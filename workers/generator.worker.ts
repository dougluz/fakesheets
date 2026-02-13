import { faker } from "@faker-js/faker";
import { GeneratorConfig } from "../lib/types";
import { buildCSV, buildXLSX } from "../lib/formats";
import { AVAILABLE_COLUMNS } from "../lib/columns";

const CHUNK_SIZE = 5000;

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

self.onmessage = (e: MessageEvent<GeneratorConfig>) => {
  try {
    const config = e.data;
    const { columns, rowCount, format } = config;

    const headers = columns.map(
      (key) => AVAILABLE_COLUMNS.find((c) => c.key === key)?.label ?? key
    );
    const generators = columns.map(
      (key) => columnGenerators[key] ?? (() => "")
    );

    if (config.preview) {
      const rows: string[][] = [];
      for (let i = 0; i < 5; i++) {
        const row: string[] = new Array(generators.length);
        for (let j = 0; j < generators.length; j++) {
          row[j] = generators[j]();
        }
        rows.push(row);
      }
      self.postMessage({ type: "preview", headers, rows });
      return;
    }

    const rows: string[][] = [];
    let generated = 0;

    while (generated < rowCount) {
      const chunkEnd = Math.min(generated + CHUNK_SIZE, rowCount);
      for (let i = generated; i < chunkEnd; i++) {
        const row: string[] = new Array(generators.length);
        for (let j = 0; j < generators.length; j++) {
          row[j] = generators[j]();
        }
        rows.push(row);
      }
      generated = chunkEnd;
      self.postMessage({ type: "progress", current: generated, total: rowCount });
    }

    const timestamp = Date.now();
    const ext = format === "csv" ? "csv" : "xlsx";
    const filename = `fakesheets-${timestamp}.${ext}`;

    const blob = format === "csv" ? buildCSV(headers, rows) : buildXLSX(headers, rows);

    self.postMessage({ type: "complete", blob, filename });
  } catch (err) {
    self.postMessage({
      type: "error",
      message: err instanceof Error ? err.message : "Unknown error occurred",
    });
  }
};
