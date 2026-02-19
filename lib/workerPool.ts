import {
  ChunkConfig,
  ChunkWorkerMessage,
  CANCELLED_ERROR,
  ExportFormat,
  GeneratorConfig,
  ProgressCallback,
  WorkerPoolOptions,
} from "./types";
import { AVAILABLE_COLUMNS } from "./columns";
import { buildStreamingCSV, buildStreamingXLSX, escapeCSVField } from "./streamingBuilder";

const MAX_WORKERS = 8;
const MIN_ROWS_PER_WORKER = 10000;

export class WorkerPool {
  private workerCount: number;
  private workers: Worker[] = [];
  private progressCallback: ProgressCallback | null = null;
  private headers: string[] = [];
  private resolve: ((value: { blob: Blob; filename: string }) => void) | null = null;
  private reject: ((reason: Error) => void) | null = null;
  private cancelled = false;

  constructor(options?: WorkerPoolOptions) {
    const hardwareConcurrency =
      typeof navigator !== "undefined"
        ? navigator.hardwareConcurrency || 4
        : 4;

    const requestedMax = options?.maxWorkers ?? MAX_WORKERS;
    this.workerCount = Math.min(hardwareConcurrency, requestedMax);
  }

  onProgress(callback: ProgressCallback): void {
    this.progressCallback = callback;
  }

  async generate(config: GeneratorConfig): Promise<{ blob: Blob; filename: string }> {
    const { columns, rowCount, format, seed } = config;

    this.headers = columns.map(
      (key) => AVAILABLE_COLUMNS.find((c) => c.key === key)?.label ?? key
    );

    const effectiveWorkerCount = Math.min(
      this.workerCount,
      Math.ceil(rowCount / MIN_ROWS_PER_WORKER)
    );

    const rowsPerWorker = Math.ceil(rowCount / effectiveWorkerCount);
    const chunks: Array<{
      workerId: number;
      data: string[][] | string;
    }> = new Array(effectiveWorkerCount);

    const progress = new Map<number, { current: number; total: number }>();
    for (let i = 0; i < effectiveWorkerCount; i++) {
      progress.set(i, { current: 0, total: rowsPerWorker });
    }

    this.cancelled = false;

    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      let completed = 0;
      let hasError = false;

      const spawnWorker = (workerId: number, startRow: number, endRow: number) => {
        const worker = new Worker(
          new URL("../workers/chunkWorker.ts", import.meta.url)
        );

        this.workers.push(worker);

        worker.onmessage = (e: MessageEvent<ChunkWorkerMessage>) => {
          if (hasError || this.cancelled) return;

          const msg = e.data;

          switch (msg.type) {
            case "chunk-progress":
              progress.set(workerId, { current: msg.current, total: msg.total });
              this.reportProgress(progress, rowCount, completed, effectiveWorkerCount);
              break;

            case "chunk-complete":
              chunks[workerId] = { workerId, data: msg.data };
              completed++;

              if (completed === effectiveWorkerCount) {
                this.buildAndResolve(format, chunks)
                  .then(resolve)
                  .catch(reject);
              }
              break;

            case "error":
              hasError = true;
              this.terminate();
              reject(new Error(`Worker ${workerId}: ${msg.message}`));
              break;
          }
        };

        worker.onerror = (e) => {
          if (!hasError && !this.cancelled) {
            hasError = true;
            this.terminate();
            reject(new Error(e.message || "Worker error"));
          }
        };

        const chunkConfig: ChunkConfig = {
          columns,
          startRow,
          endRow,
          format,
          seed,
          workerId,
          includeHeader: workerId === 0,
        };

        worker.postMessage(chunkConfig);
      };

      for (let i = 0; i < effectiveWorkerCount; i++) {
        const startRow = i * rowsPerWorker;
        const endRow = Math.min(startRow + rowsPerWorker, rowCount);
        spawnWorker(i, startRow, endRow);
      }
    });
  }

  private reportProgress(
    progress: Map<number, { current: number; total: number }>,
    totalRows: number,
    completed: number,
    totalWorkers: number
  ): void {
    if (!this.progressCallback) return;

    let totalCurrent = 0;
    progress.forEach((p) => {
      totalCurrent += p.current;
    });

    this.progressCallback({
      current: Math.min(totalCurrent, totalRows),
      total: totalRows,
      workersComplete: completed,
      totalWorkers,
    });
  }

  private async buildAndResolve(
    format: ExportFormat,
    chunks: Array<{ workerId: number; data: string[][] | string }>
  ): Promise<{ blob: Blob; filename: string }> {
    chunks.sort((a, b) => a.workerId - b.workerId);

    let blob: Blob;

    if (format === "csv") {
      const headerLine = this.headers.map(escapeCSVField).join(",");
      const csvChunks = chunks.map((c) => c.data as string);
      blob = buildStreamingCSV(csvChunks, headerLine);
    } else {
      const xlsxChunks = chunks.map((c) => c.data as string[][]);
      blob = await buildStreamingXLSX(this.headers, xlsxChunks);
    }

    const timestamp = Date.now();
    const ext = format === "csv" ? "csv" : "xlsx";
    const filename = `fakesheets-${timestamp}.${ext}`;

    return { blob, filename };
  }

  terminate(): void {
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers = [];
  }

  abort(): void {
    this.cancelled = true;
    this.terminate();
    if (this.reject) {
      this.reject(new Error(CANCELLED_ERROR));
      this.resolve = null;
      this.reject = null;
    }
  }
}
