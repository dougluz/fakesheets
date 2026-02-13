"use client";

import { useCallback, useRef, useState } from "react";
import GeneratorForm from "../components/GeneratorForm";
import ProgressBar from "../components/ProgressBar";
import { GeneratorConfig, WorkerMessage } from "../lib/types";

type AppState = "idle" | "generating" | "complete";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const handleGenerate = useCallback((config: GeneratorConfig) => {
    setState("generating");
    setProgress({ current: 0, total: config.rowCount });
    setError(null);

    const worker = new Worker(
      new URL("../workers/generator.worker.ts", import.meta.url)
    );
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data;
      switch (msg.type) {
        case "progress":
          setProgress({ current: msg.current, total: msg.total });
          break;
        case "complete": {
          const url = URL.createObjectURL(msg.blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = msg.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setState("complete");
          worker.terminate();
          workerRef.current = null;
          break;
        }
        case "error":
          setError(msg.message);
          setState("idle");
          worker.terminate();
          workerRef.current = null;
          break;
      }
    };

    worker.onerror = (err) => {
      setError(err.message || "Worker error occurred");
      setState("idle");
      worker.terminate();
      workerRef.current = null;
    };

    worker.postMessage(config);
  }, []);

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 px-4 py-12 font-sans dark:bg-zinc-950">
      <main className="w-full max-w-2xl space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Fakesheets
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Generate fake spreadsheet data instantly. All processing happens in
            your browser — nothing leaves your device.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <GeneratorForm
            onGenerate={handleGenerate}
            disabled={state === "generating"}
          />
        </div>

        <ProgressBar
          current={progress.current}
          total={progress.total}
          visible={state === "generating"}
        />

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        {state === "complete" && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
            File generated and downloaded successfully.
          </div>
        )}
      </main>
    </div>
  );
}
