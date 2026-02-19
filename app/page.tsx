"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GeneratorForm from "../components/GeneratorForm";
import PreviewTable from "../components/PreviewTable";
import ProgressBar from "../components/ProgressBar";
import { CANCELLED_ERROR, GeneratorConfig, WorkerMessage } from "../lib/types";
import { WorkerPool } from "../lib/workerPool";
import { Analytics } from "@vercel/analytics/next"

type AppState = "idle" | "generating" | "complete";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [previewData, setPreviewData] = useState<{
    headers: string[];
    rows: string[][];
  } | null>(null);
  const poolRef = useRef<WorkerPool | null>(null);

  useEffect(() => {
    if (showCancelled) {
      const timer = setTimeout(() => setShowCancelled(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showCancelled]);

  const handleGenerate = useCallback(async (config: GeneratorConfig) => {
    setState("generating");
    setProgress({ current: 0, total: config.rowCount });
    setError(null);

    const pool = new WorkerPool();
    poolRef.current = pool;

    pool.onProgress((p) => {
      setProgress({ current: p.current, total: p.total });
    });

    try {
      const { blob, filename } = await pool.generate(config);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setState("complete");
    } catch (err) {
      if (err instanceof Error && err.message === CANCELLED_ERROR) {
        setShowCancelled(true);
        setState("idle");
      } else {
        setError(err instanceof Error ? err.message : "Generation failed");
        setState("idle");
      }
    } finally {
      pool.terminate();
      poolRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    poolRef.current?.abort();
  }, []);

  const handlePreview = useCallback((config: GeneratorConfig) => {
    const worker = new Worker(
      new URL("../workers/generator.worker.ts", import.meta.url)
    );

    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data;
      if (msg.type === "preview") {
        setPreviewData({ headers: msg.headers, rows: msg.rows });
      } else if (msg.type === "error") {
        setError(msg.message);
      }
      worker.terminate();
    };

    worker.onerror = (err) => {
      setError(err.message || "Worker error occurred");
      worker.terminate();
    };

    worker.postMessage(config);
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
          onCancel={handleCancel}
        />

        {showCancelled && (
          <div className="rounded-lg border border-amber-800 bg-amber-950 px-4 py-3 text-sm text-amber-400">
            Generation cancelled
          </div>
        )}

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
        <p>© {new Date().getFullYear()} Fakesheets. Designed for testing purposes.</p>
      </footer>
    </div>
  );
}
