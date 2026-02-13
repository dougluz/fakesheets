import { useState } from "react";
import { AVAILABLE_COLUMNS } from "../lib/columns";
import { ExportFormat, GeneratorConfig } from "../lib/types";

interface GeneratorFormProps {
  onGenerate: (config: GeneratorConfig) => void;
  disabled: boolean;
}

export default function GeneratorForm({ onGenerate, disabled }: GeneratorFormProps) {
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(["firstName", "lastName", "email"])
  );
  const [rowCount, setRowCount] = useState(1000);
  const [format, setFormat] = useState<ExportFormat>("csv");

  function toggleColumn(key: string) {
    setSelectedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedColumns(new Set(AVAILABLE_COLUMNS.map((c) => c.key)));
  }

  function selectNone() {
    setSelectedColumns(new Set());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedColumns.size === 0) return;
    const columns = AVAILABLE_COLUMNS.filter((c) => selectedColumns.has(c.key)).map(
      (c) => c.key
    );
    onGenerate({ columns, rowCount, format });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Columns
          </label>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={selectAll}
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={selectNone}
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {AVAILABLE_COLUMNS.map((col) => (
            <label
              key={col.key}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                selectedColumns.has(col.key)
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300"
                  : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedColumns.has(col.key)}
                onChange={() => toggleColumn(col.key)}
                className="sr-only"
              />
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  selectedColumns.has(col.key)
                    ? "border-blue-500 bg-blue-500 text-white dark:border-blue-400 dark:bg-blue-400"
                    : "border-zinc-300 dark:border-zinc-600"
                }`}
              >
                {selectedColumns.has(col.key) && (
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 6L5 8.5L9.5 3.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              {col.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="rowCount"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Number of rows
          </label>
          <input
            id="rowCount"
            type="number"
            min={1}
            max={500000}
            value={rowCount}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v)) setRowCount(Math.max(1, Math.min(500000, v)));
            }}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Format
          </label>
          <div className="flex overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-600">
            {(["csv", "xlsx"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={`px-4 py-2 text-sm font-medium uppercase transition-colors ${
                  format === f
                    ? "bg-blue-600 text-white"
                    : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled || selectedColumns.size === 0}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {disabled ? "Generating..." : "Generate"}
      </button>
    </form>
  );
}
