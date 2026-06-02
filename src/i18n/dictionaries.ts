import "server-only";
import { cache } from "react";
import type { Locale } from "./config";

export type Dictionary = Record<string, Record<string, string>>;

const loaders: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("../../messages/en.json").then((m) => m.default as Dictionary),
  az: () => import("../../messages/az.json").then((m) => m.default as Dictionary),
};

export const getDictionary = cache(async (locale: Locale): Promise<Dictionary> => {
  return loaders[locale]();
});
