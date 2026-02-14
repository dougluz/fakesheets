"use client";

import { useCallback, useRef, useState } from "react";
import GeneratorForm from "../components/GeneratorForm";
import PreviewTable from "../components/PreviewTable";
import ProgressBar from "../components/ProgressBar";
import { GeneratorConfig, ChunkAssignment, ColumnDefinition } from "../lib/types";
import { AVAILABLE_COLUMNS } from "../lib/columns";
import { WorkerPool, createPreviewWorker } from "../lib/workerPool";
import { AssemblyManager } from "../lib/assemblyManager";
import { Analytics } from "@vercel/analytics/next"

type AppState = "idle" | "generating" | "complete";

const CHUNK_SIZE = 10000;

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{
    headers: string[];
    rows: string[][];
  } | null>(null);
  const poolRef = useRef<WorkerPool | null>(null);
  const assemblyRef = useRef<AssemblyManager | null>(null);

  const handleGenerate = useCallback((config: GeneratorConfig) => {
    setState("generating");
    setError(null);
    setPreviewData(null);

    const { columns, rowCount, format } = config;

    const headers = columns.map(
      (key) => AVAILABLE_COLUMNS.find((c: ColumnDefinition) => c.key === key)?.label ?? key
    );

    const totalChunks = Math.ceil(rowCount / CHUNK_SIZE);
    const totalRows = rowCount;

    assemblyRef.current = new AssemblyManager(format, headers, totalChunks);

    setProgress({ current: 0, total: totalRows });

    const pool = new WorkerPool(
      (result) => {
        if (!assemblyRef.current) return;

        assemblyRef.current.addChunk(result.chunkIndex, result.rows);
        
        const progressInfo = assemblyRef.current.getProgress();
        const rowsCompleted = Math.min(progressInfo.completed * CHUNK_SIZE, totalRows);
        setProgress({ current: rowsCompleted, total: totalRows });

        if (assemblyRef.current.isComplete()) {
          const blob = assemblyRef.current.buildBlob();
          const timestamp = Date.now();
          const ext = format === "csv" ? "csv" : "xlsx";
          const filename = `fakesheets-${timestamp}.${ext}`;

          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          setState("complete");
          pool.terminate();
          poolRef.current = null;
          assemblyRef.current = null;
        }
      },
      (err: Error) => {
        setError(err.message);
        setState("idle");
        if (poolRef.current) {
          poolRef.current.terminate();
          poolRef.current = null;
        }
        assemblyRef.current = null;
      }
    );

    poolRef.current = pool;

    for (let i = 0; i < totalChunks; i++) {
      const startRow = i * CHUNK_SIZE;
      const endRow = Math.min(startRow + CHUNK_SIZE, rowCount);
      const assignment: ChunkAssignment = {
        chunkIndex: i,
        startRow,
        endRow,
        config: { columns },
      };
      pool.assignChunk(assignment);
    }
  }, []);

  const handlePreview = useCallback((config: GeneratorConfig) => {
    const columnLabels: Record<string, string> = {};
    for (const col of AVAILABLE_COLUMNS) {
      columnLabels[col.key] = col.label;
    }

    createPreviewWorker(
      config,
      columnLabels,
      (headers, rows) => {
        setPreviewData({ headers, rows });
      },
      (err: Error) => {
        setError(err.message);
      }
    );
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center bg-background-dark px-4 py-12 sm:px-6 lg:px-8">
      <Analytics />
      <header className="mb-10 max-w-2xl text-center">
        <div className="mb-4 flex items-center justify-center">
          <span className="material-icons text-primary text-4xl mr-2">table_view</span>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Fakesheets
          </h1>
        </div>
        <p className="text-lg text-slate-400">
          Generate fake spreadsheet data instantly. All processing happens in your browser — nothing leaves your device.
        </p>
      </header>

      <main className="w-full max-w-4xl space-y-8">
        <div className="bg-surface-dark rounded-2xl border border-border-dark p-6 sm:p-8">
          <GeneratorForm
            onGenerate={handleGenerate}
            onPreview={handlePreview}
            disabled={state === "generating"}
          />
        </div>

        {previewData && (
          <PreviewTable headers={previewData.headers} rows={previewData.rows} />
        )}

        <ProgressBar
          current={progress.current}
          total={progress.total}
          visible={state === "generating"}
        />

        {error && (
          <div className="rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {state === "complete" && (
          <div className="rounded-lg border border-green-800 bg-green-950 px-4 py-3 text-sm text-green-400">
            File generated and downloaded successfully.
          </div>
        )}
      </main>

      <footer className="mt-12 text-center text-sm text-slate-600">
        <p>© {new Date().getFullYear()} Fakesheets.</p>
      </footer>
    </div>
  );
}
