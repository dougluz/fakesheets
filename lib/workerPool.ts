import { ChunkAssignment, ChunkResult, GeneratorConfig } from "./types";
import { createWorkerBlobURL } from "./workerCode";

function getPoolSize(): number {
  if (typeof navigator !== "undefined" && navigator.hardwareConcurrency) {
    return Math.min(navigator.hardwareConcurrency, 8);
  }
  return 4;
}

export type ChunkCompleteHandler = (result: ChunkResult) => void;
export type ErrorHandler = (error: Error) => void;

export class WorkerPool {
  private workers: Worker[] = [];
  private poolSize: number;
  private currentWorkerIndex: number = 0;
  private onChunkComplete: ChunkCompleteHandler;
  private onError: ErrorHandler;
  private terminated: boolean = false;
  private workerUrl: string;

  constructor(
    onChunkComplete: ChunkCompleteHandler,
    onError: ErrorHandler
  ) {
    this.poolSize = getPoolSize();
    this.onChunkComplete = onChunkComplete;
    this.onError = onError;
    this.workerUrl = createWorkerBlobURL();
    this.spawnWorkers();
  }

  private spawnWorkers(): void {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(this.workerUrl, { type: "module" });
      worker.onmessage = (e) => {
        const msg = e.data;
        if (msg.type === "chunk_complete") {
          this.onChunkComplete({ chunkIndex: msg.chunkIndex, rows: msg.rows });
        } else if (msg.type === "error") {
          this.onError(new Error(msg.message));
        }
      };
      worker.onerror = (e) => {
        this.onError(new Error(e.message || "Worker error"));
      };
      this.workers.push(worker);
    }
  }

  assignChunk(assignment: ChunkAssignment): void {
    if (this.terminated) return;
    const worker = this.workers[this.currentWorkerIndex];
    worker.postMessage(assignment);
    this.currentWorkerIndex = (this.currentWorkerIndex + 1) % this.poolSize;
  }

  terminate(): void {
    this.terminated = true;
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers = [];
    URL.revokeObjectURL(this.workerUrl);
  }

  getPoolSize(): number {
    return this.poolSize;
  }
}

export function createPreviewWorker(
  config: GeneratorConfig,
  columnLabels: Record<string, string>,
  onComplete: (headers: string[], rows: string[][]) => void,
  onError: (error: Error) => void
): Worker {
  const workerUrl = createWorkerBlobURL();
  const worker = new Worker(workerUrl, { type: "module" });

  worker.onmessage = (e) => {
    const msg = e.data;
    if (msg.type === "preview") {
      onComplete(msg.headers, msg.rows);
    } else if (msg.type === "error") {
      onError(new Error(msg.message));
    }
    worker.terminate();
    URL.revokeObjectURL(workerUrl);
  };

  worker.onerror = (e) => {
    onError(new Error(e.message || "Worker error"));
    worker.terminate();
    URL.revokeObjectURL(workerUrl);
  };

  worker.postMessage({ ...config, preview: true, columnLabels });
  return worker;
}
