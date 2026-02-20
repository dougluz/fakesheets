import { AVAILABLE_COLUMNS } from "../lib/columns";
import { GeneratorConfig, FakerLocale } from "../lib/types";
import { useUrlState } from "../hooks/useUrlState";

const LOCALE_OPTIONS: { value: FakerLocale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "pt_BR", label: "Português (BR)" },
];

interface GeneratorFormProps {
  onGenerate: (config: GeneratorConfig) => void;
  onPreview: (config: GeneratorConfig) => void;
  disabled: boolean;
}

export default function GeneratorForm({ onGenerate, onPreview, disabled }: GeneratorFormProps) {
  const {
    state,
    setColumns,
    setRowCount,
    setFormat,
    setLocale,
    regenerateSeed,
    copyShareableUrl,
    copied,
  } = useUrlState();

  const selectedColumns = new Set(state.columns);

  function toggleColumn(key: string) {
    const next = new Set(selectedColumns);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setColumns(Array.from(next));
  }

  function selectAll() {
    setColumns(AVAILABLE_COLUMNS.map((c) => c.key));
  }

  function selectNone() {
    setColumns([]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedColumns.size === 0) return;
    const columns = AVAILABLE_COLUMNS.filter((c) => selectedColumns.has(c.key)).map(
      (c) => c.key
    );
    onGenerate({ columns, rowCount: state.rowCount, format: state.format, seed: state.seed, locale: state.locale });
  }

  function getConfig(preview: boolean = false): GeneratorConfig {
    const columns = AVAILABLE_COLUMNS.filter((c) => selectedColumns.has(c.key)).map(
      (c) => c.key
    );
    return {
      columns,
      rowCount: state.rowCount,
      format: state.format,
      seed: state.seed,
      locale: state.locale,
      preview,
    };
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <label className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Columns
          </label>
          <div className="space-x-4 text-xs font-medium">
            <button
              type="button"
              onClick={selectAll}
              className="text-primary hover:text-primary-dark transition-colors"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={selectNone}
              className="text-slate-400 hover:text-slate-300 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {AVAILABLE_COLUMNS.map((col) => (
            <label
              key={col.key}
              className="cursor-pointer group relative"
            >
              <input
                type="checkbox"
                checked={selectedColumns.has(col.key)}
                onChange={() => toggleColumn(col.key)}
                className="peer sr-only"
              />
              <div
                className={`flex items-center p-3 rounded-xl border transition-all duration-200 shadow-sm ${
                  selectedColumns.has(col.key)
                    ? "border-primary bg-blue-900/30 text-primary"
                    : "border-border-dark bg-slate-800 text-slate-300 hover:border-primary/50 hover:shadow-md"
                }`}
              >
                <span className="material-icons text-sm mr-2">{col.icon}</span>
                <span className="text-sm font-medium">{col.label}</span>
              </div>
              {selectedColumns.has(col.key) && (
                <div className="absolute top-0 right-0 -mt-1 -mr-1 h-4 w-4 bg-primary rounded-full border-2 border-surface-dark opacity-100 transition-opacity" />
              )}
            </label>
          ))}
        </div>
      </div>

      <hr className="border-border-dark" />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="w-full sm:w-48">
            <label
              htmlFor="rowCount"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Number of rows
            </label>
            <input
              id="rowCount"
              type="number"
              min={1}
              max={1000000}
              value={state.rowCount}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v)) setRowCount(Math.max(1, Math.min(1000000, v)));
              }}
              className="block w-full rounded-xl border-border-dark bg-slate-900 text-white focus:border-primary focus:ring-primary sm:text-sm py-3 px-4 shadow-sm"
            />
          </div>

          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Format
            </label>
            <div className="inline-flex rounded-xl shadow-sm bg-slate-800 p-1" role="group">
              {(["csv", "xlsx", "json"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    state.format === f
                      ? "text-white bg-primary shadow-sm"
                      : "text-slate-400 bg-transparent hover:text-white"
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Language
            </label>
            <div className="inline-flex rounded-xl shadow-sm bg-slate-800 p-1" role="group">
              {LOCALE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLocale(opt.value)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    state.locale === opt.value
                      ? "text-white bg-primary shadow-sm"
                      : "text-slate-400 bg-transparent hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap justify-end">
          <button
            type="button"
            disabled={disabled}
            onClick={copyShareableUrl}
            className="flex-1 sm:flex-none px-4 py-3 rounded-xl text-slate-300 border border-slate-600 hover:bg-slate-800 hover:border-slate-500 transition-colors font-medium flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer text-sm"
          >
            <span className="material-icons text-base mr-2">{copied ? "check" : "link"}</span>
            {copied ? "Copied!" : "Copy Link"}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={regenerateSeed}
            className="flex-1 sm:flex-none px-4 py-3 rounded-xl text-slate-300 border border-slate-600 hover:bg-slate-800 hover:border-slate-500 transition-colors font-medium flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer text-sm"
          >
            <span className="material-icons text-base mr-2">refresh</span>
            Regenerate
          </button>
          <button
            type="button"
            disabled={disabled || selectedColumns.size === 0}
            onClick={() => onPreview(getConfig(true))}
            className="flex-1 sm:flex-none px-6 py-3 rounded-xl text-primary border border-primary/30 hover:bg-primary/10 transition-colors font-medium flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            <span className="material-icons text-base mr-2">visibility</span>
            Preview
          </button>
          <button
            type="submit"
            disabled={disabled || selectedColumns.size === 0}
            className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white shadow-glow transition-all duration-200 font-medium flex items-center justify-center transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            <span className="material-icons text-base mr-2">download</span>
            {disabled ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {state.format === "xlsx" && state.rowCount > 500000 && (
        <div className="mt-4 p-4 rounded-xl bg-amber-900/30 border border-amber-500/50 flex items-start gap-3">
          <span className="material-icons text-amber-400 text-xl flex-shrink-0">warning</span>
          <p className="text-sm text-amber-200">
            <strong>Performance Warning:</strong> XLSX files with more than 500,000 rows may take significantly longer to generate and could cause memory issues in your browser. Consider using CSV format for large datasets, or reduce the row count.
          </p>
        </div>
      )}
    </form>
  );
}
