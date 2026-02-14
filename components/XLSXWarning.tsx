import { ExportFormat } from "../lib/types";

interface XLSXWarningProps {
  format: ExportFormat;
  rowCount: number;
  threshold?: number;
}

export default function XLSXWarning({ format, rowCount, threshold = 500000 }: XLSXWarningProps) {
  if (format !== "xlsx" || rowCount <= threshold) return null;

  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-800/50 bg-amber-950/50 px-4 py-3 text-sm text-amber-400">
      <span className="material-icons text-base mt-0.5">warning</span>
      <span>
        XLSX files with over {threshold.toLocaleString()} rows require significant memory. 
        Consider using CSV for better performance.
      </span>
    </div>
  );
}
