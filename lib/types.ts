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
}

export interface ChunkConfig {
  columns: string[];
}

export interface ChunkAssignment {
  chunkIndex: number;
  startRow: number;
  endRow: number;
  config: ChunkConfig;
}

export interface ChunkResult {
  chunkIndex: number;
  rows: string[][];
}
