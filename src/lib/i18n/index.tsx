"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import sv from "@/locales/sv/common.json";
import en from "@/locales/en/common.json";

export type Locale = "sv" | "en";

const dictionaries: Record<Locale, Record<string, unknown>> = { sv, en };
const STORAGE_KEY = "ema:locale";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveKey(dict: Record<string, unknown>, key: string): string | null {
  const value = key
    .split(".")
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === "object"
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      dict
    );
  return typeof value === "string" ? value : null;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("sv");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === "sv" || stored === "en") {
      setLocaleState(stored);
      return;
    }
    // Automatic language detection
    const browser = navigator.language.toLowerCase();
    setLocaleState(browser.startsWith("sv") ? "sv" : "en");
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const raw =
        resolveKey(dictionaries[locale], key) ??
        resolveKey(dictionaries.en, key) ??
        key;
      if (!vars) return raw;
      return Object.entries(vars).reduce(
        (acc, [k, v]) => acc.replaceAll(`{{${k}}}`, String(v)),
        raw
      );
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export function useT() {
  return useI18n().t;
}
