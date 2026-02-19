"use client";

import { useCallback, useEffect, useState } from "react";
import {
  UrlState,
  parseUrlState,
  updateUrlState,
  generateSeed,
  getShareableUrl,
  DEFAULT_COLUMNS,
  DEFAULT_ROW_COUNT,
  DEFAULT_FORMAT,
} from "../lib/urlState";
import { ExportFormat, FakerLocale } from "../lib/types";

function getInitialState(): UrlState {
  return {
    seed: generateSeed(),
    columns: DEFAULT_COLUMNS,
    rowCount: DEFAULT_ROW_COUNT,
    format: DEFAULT_FORMAT,
    locale: "en",
  };
}

export function useUrlState() {
  const [state, setState] = useState<UrlState>(getInitialState);
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const parsed = parseUrlState();
    setState(parsed);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      updateUrlState(state);
    }
  }, [state, hydrated]);

  const setColumns = useCallback((columns: string[]) => {
    setState((prev) => ({ ...prev, columns }));
  }, []);

  const setRowCount = useCallback((rowCount: number) => {
    setState((prev) => ({ ...prev, rowCount }));
  }, []);

  const setFormat = useCallback((format: ExportFormat) => {
    setState((prev) => ({ ...prev, format }));
  }, []);

  const setLocale = useCallback((locale: FakerLocale) => {
    setState((prev) => ({ ...prev, locale }));
  }, []);

  const regenerateSeed = useCallback(() => {
    setState((prev) => ({ ...prev, seed: generateSeed() }));
  }, []);

  const copyShareableUrl = useCallback(async () => {
    const url = getShareableUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    state,
    setColumns,
    setRowCount,
    setFormat,
    setLocale,
    regenerateSeed,
    copyShareableUrl,
    copied,
  };
}
