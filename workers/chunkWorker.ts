import { faker } from "@faker-js/faker";
import { ChunkConfig, ChunkWorkerMessage } from "../lib/types";
import { AVAILABLE_COLUMNS } from "../lib/columns";

const PROGRESS_INTERVAL = 5000;

const columnGenerators: Record<string, () => string> = {
  firstName: () => faker.person.firstName(),
  lastName: () => faker.person.lastName(),
  fullName: () => faker.person.fullName(),
  email: () => faker.internet.email(),
  phone: () => faker.phone.number(),
  company: () => faker.company.name(),
  jobTitle: () => faker.person.jobTitle(),
  address: () => faker.location.streetAddress(),
  city: () => faker.location.city(),
  country: () => faker.location.country(),
  website: () => faker.internet.url(),
  avatarUrl: () => faker.image.avatar(),
};

function escapeCSVField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return '"' + field.replace(/"/g, '""') + '"';
  }
  return field;
}

function buildCSVChunk(headers: string[], rows: string[][]): string {
  const lines: string[] = [];
  lines.push(headers.map(escapeCSVField).join(","));
  for (const row of rows) {
    lines.push(row.map(escapeCSVField).join(","));
  }
  return lines.join("\n");
}

self.onmessage = (e: MessageEvent<ChunkConfig>) => {
  try {
    const config = e.data;
    const { columns, startRow, endRow, format, seed, workerId, includeHeader } = config;

    faker.seed(seed + workerId);

    const headers = columns.map(
      (key) => AVAILABLE_COLUMNS.find((c) => c.key === key)?.label ?? key
    );
    const generators = columns.map(
      (key) => columnGenerators[key] ?? (() => "")
    );

    const totalRows = endRow - startRow;
    const rows: string[][] = [];
    let generated = 0;

    while (generated < totalRows) {
      const chunkEnd = Math.min(generated + PROGRESS_INTERVAL, totalRows);
      for (let i = generated; i < chunkEnd; i++) {
        const row: string[] = new Array(generators.length);
        for (let j = 0; j < generators.length; j++) {
          row[j] = generators[j]();
        }
        rows.push(row);
      }
      generated = chunkEnd;
      self.postMessage({
        type: "chunk-progress",
        workerId,
        current: generated,
        total: totalRows,
      } as ChunkWorkerMessage);
    }

    if (format === "csv") {
      const csvData = includeHeader
        ? buildCSVChunk(headers, rows)
        : rows.map((row) => row.map(escapeCSVField).join(",")).join("\n");
      self.postMessage({
        type: "chunk-complete",
        workerId,
        data: csvData,
      } as ChunkWorkerMessage);
    } else {
      self.postMessage({
        type: "chunk-complete",
        workerId,
        data: rows,
      } as ChunkWorkerMessage);
    }
  } catch (err) {
    self.postMessage({
      type: "error",
      workerId: e.data.workerId,
      message: err instanceof Error ? err.message : "Unknown error occurred",
    } as ChunkWorkerMessage);
  }
};
