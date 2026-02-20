import { faker, fakerPT_BR } from "@faker-js/faker";
import { ChunkConfig, ChunkWorkerMessage } from "../lib/types";
import { AVAILABLE_COLUMNS } from "../lib/columns";

const PROGRESS_INTERVAL = 5000;

function getFaker(locale: string) {
  return locale === "pt_BR" ? fakerPT_BR : faker;
}

const columnGenerators: Record<string, (locale: string) => () => string> = {
  firstName: (locale) => () => getFaker(locale).person.firstName(),
  lastName: (locale) => () => getFaker(locale).person.lastName(),
  fullName: (locale) => () => getFaker(locale).person.fullName(),
  email: (locale) => () => getFaker(locale).internet.email(),
  phone: (locale) => () => getFaker(locale).phone.number(),
  company: (locale) => () => getFaker(locale).company.name(),
  jobTitle: (locale) => () => getFaker(locale).person.jobTitle(),
  address: (locale) => () => getFaker(locale).location.streetAddress(),
  city: (locale) => () => getFaker(locale).location.city(),
  country: (locale) => () => getFaker(locale).location.country(),
  website: (locale) => () => getFaker(locale).internet.url(),
  avatarUrl:  (locale) => () => getFaker(locale).image.avatar(),
  date:       (locale) => () => getFaker(locale).date.past({ years: 5 }).toISOString().split('T')[0],
  uuid:       (locale) => () => getFaker(locale).string.uuid(),
  username:   (locale) => () => getFaker(locale).internet.username(),
  zipCode:    (locale) => () => getFaker(locale).location.zipCode(),
  state:      (locale) => () => getFaker(locale).location.state(),
  price:      (locale) => () => getFaker(locale).commerce.price(),
  department: (locale) => () => getFaker(locale).commerce.department(),
  boolean:    (locale) => () => getFaker(locale).datatype.boolean().toString(),
  number:     (locale) => () => getFaker(locale).number.int({ min: 1, max: 1000 }).toString(),
};

function escapeCSVField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return '"' + field.replace(/"/g, '""') + '"';
  }
  return field;
}

self.onmessage = (e: MessageEvent<ChunkConfig>) => {
  try {
    const config = e.data;
    const { columns, startRow, endRow, format, seed, locale, workerId } = config;

    const activeFaker = getFaker(locale);
    activeFaker.seed(seed + workerId);

    const headers = columns.map(
      (key) => AVAILABLE_COLUMNS.find((c) => c.key === key)?.label ?? key
    );
    const generators = columns.map(
      (key) => columnGenerators[key]?.(locale) ?? (() => "")
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
      const csvData = rows.map((row) => row.map(escapeCSVField).join(",")).join("\n");
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
