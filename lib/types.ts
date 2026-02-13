export type ExportFormat = "csv" | "xlsx";

export interface ColumnDefinition {
  key: string;
  label: string;
}

export interface GeneratorConfig {
  columns: string[];
  rowCount: number;
  format: ExportFormat;
}

export type WorkerMessage =
  | { type: "progress"; current: number; total: number }
  | { type: "complete"; blob: Blob; filename: string }
  | { type: "error"; message: string };
