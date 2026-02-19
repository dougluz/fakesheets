export type ExportFormat = "csv" | "xlsx";

export interface ColumnDefinition {
  key: string;
  label: string;
  icon: string;
}

export interface GeneratorConfig {
  columns: string[];
  rowCount: number;
  format: ExportFormat;
  preview?: boolean;
}

export type WorkerMessage =
  | { type: "progress"; current: number; total: number }
  | { type: "complete"; blob: Blob; filename: string }
  | { type: "preview"; headers: string[]; rows: string[][] }
  | { type: "error"; message: string };

export interface ChunkConfig {
  columns: string[];
  startRow: number;
  endRow: number;
  format: ExportFormat;
  workerId: number;
  includeHeader: boolean;
}

export type ChunkWorkerMessage =
  | { type: "chunk-progress"; workerId: number; current: number; total: number }
  | { type: "chunk-complete"; workerId: number; data: string[][] | string }
  | { type: "error"; workerId: number; message: string };

export interface PoolProgress {
  current: number;
  total: number;
  workersComplete: number;
  totalWorkers: number;
}

export interface WorkerPoolOptions {
  maxWorkers?: number;
}

export type ProgressCallback = (progress: PoolProgress) => void;
