import { ExportFormat } from "./types";
import { buildCSV, buildXLSX } from "./formats";

export class AssemblyManager {
  private format: ExportFormat;
  private headers: string[];
  private totalChunks: number;
  private chunks: Map<number, string[][]> = new Map();
  private completedCount: number = 0;

  constructor(format: ExportFormat, headers: string[], totalChunks: number) {
    this.format = format;
    this.headers = headers;
    this.totalChunks = totalChunks;
  }

  addChunk(chunkIndex: number, rows: string[][]): void {
    if (this.chunks.has(chunkIndex)) return;
    this.chunks.set(chunkIndex, rows);
    this.completedCount++;
  }

  getProgress(): { completed: number; total: number } {
    return { completed: this.completedCount, total: this.totalChunks };
  }

  isComplete(): boolean {
    return this.completedCount === this.totalChunks;
  }

  buildBlob(): Blob {
    const allRows: string[][] = [];
    for (let i = 0; i < this.totalChunks; i++) {
      const chunk = this.chunks.get(i);
      if (chunk) {
        allRows.push(...chunk);
      }
    }

    return this.format === "csv"
      ? buildCSV(this.headers, allRows)
      : buildXLSX(this.headers, allRows);
  }

  getCompletedChunkCount(): number {
    return this.completedCount;
  }
}
