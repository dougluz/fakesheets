import { faker, fakerPT_BR } from "@faker-js/faker";
import { GeneratorConfig } from "../lib/types";
import { buildCSV, buildXLSX } from "../lib/formats";
import { AVAILABLE_COLUMNS } from "../lib/columns";

const CHUNK_SIZE = 5000;

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
  avatarUrl: (locale) => () => getFaker(locale).image.avatar(),
};

self.onmessage = async (e: MessageEvent<GeneratorConfig>) => {
  try {
    const config = e.data;
    const { columns, rowCount, format, seed, locale } = config;

    const activeFaker = getFaker(locale);
    activeFaker.seed(seed);

    const headers = columns.map(
      (key) => AVAILABLE_COLUMNS.find((c) => c.key === key)?.label ?? key
    );
    const generators = columns.map(
      (key) => columnGenerators[key]?.(locale) ?? (() => "")
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

    const blob = format === "csv" ? buildCSV(headers, rows) : await buildXLSX(headers, rows);

    self.postMessage({ type: "complete", blob, filename });
  } catch (err) {
    self.postMessage({
      type: "error",
      message: err instanceof Error ? err.message : "Unknown error occurred",
    });
  }
};
