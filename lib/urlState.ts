import { ExportFormat, FakerLocale } from "./types";

export const DEFAULT_COLUMNS = ["firstName", "lastName", "email"];
export const DEFAULT_ROW_COUNT = 1000;
export const DEFAULT_FORMAT: ExportFormat = "csv";

export function detectLocale(): FakerLocale {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith("pt")) return "pt_BR";
  return "en";
}

export interface UrlState {
  seed: number;
  columns: string[];
  rowCount: number;
  format: ExportFormat;
  locale: FakerLocale;
}

export function generateSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}

export function parseUrlState(): UrlState {
  if (typeof window === "undefined") {
    return {
      seed: generateSeed(),
      columns: DEFAULT_COLUMNS,
      rowCount: DEFAULT_ROW_COUNT,
      format: DEFAULT_FORMAT,
      locale: "en",
    };
  }

  const params = new URLSearchParams(window.location.search);

  const seedParam = params.get("seed");
  const seed = seedParam ? parseInt(seedParam, 10) : generateSeed();

  const colsParam = params.get("cols");
  const columns = colsParam ? colsParam.split(",").filter(Boolean) : DEFAULT_COLUMNS;

  const rowsParam = params.get("rows");
  const rowCount = rowsParam ? Math.max(1, Math.min(1000000, parseInt(rowsParam, 10))) : DEFAULT_ROW_COUNT;

  const formatParam = params.get("format");
  const format: ExportFormat = formatParam === "xlsx" ? "xlsx" : DEFAULT_FORMAT;

  const localeParam = params.get("locale");
  const locale: FakerLocale = localeParam === "pt_BR" ? "pt_BR" : localeParam === "en" ? "en" : detectLocale();

  return { seed, columns, rowCount, format, locale };
}

export function updateUrlState(state: UrlState): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams();
  params.set("seed", state.seed.toString());
  params.set("cols", state.columns.join(","));
  params.set("rows", state.rowCount.toString());
  params.set("format", state.format);
  params.set("locale", state.locale);

  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, "", newUrl);
}

export function getShareableUrl(): string {
  if (typeof window === "undefined") return "";
  return window.location.href;
}
