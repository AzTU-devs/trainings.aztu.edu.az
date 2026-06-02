import "server-only";
import { getDictionary } from "./dictionaries";
import { makeT, type TFunction } from "./format";
import type { Locale } from "./config";

export async function getT(locale: Locale): Promise<TFunction> {
  const dict = await getDictionary(locale);
  return makeT(dict, locale);
}
