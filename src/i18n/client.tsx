"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { makeT, type TFunction } from "./format";
import type { Dictionary } from "./dictionaries";
import type { Locale } from "./config";

type Ctx = { locale: Locale; t: TFunction };

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Dictionary;
  children: ReactNode;
}) {
  const value = useMemo<Ctx>(
    () => ({ locale, t: makeT(messages, locale) }),
    [locale, messages],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): TFunction {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used within I18nProvider");
  return ctx.t;
}

export function useLocale(): Locale {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useLocale must be used within I18nProvider");
  return ctx.locale;
}
