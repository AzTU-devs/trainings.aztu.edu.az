import type { Dictionary } from "./dictionaries";

export type Values = Record<string, string | number>;

// Minimal ICU-lite formatter:
//   - "{name}" → value
//   - "{count, plural, =0 {none} one {# item} other {# items}}"  (# = value)
//   - "{x, number}" → Intl.NumberFormat
function formatMessage(template: string, values: Values, locale: string): string {
  let result = "";
  let i = 0;
  while (i < template.length) {
    const ch = template[i];
    if (ch !== "{") {
      result += ch;
      i++;
      continue;
    }
    // find matching closing brace, accounting for nested {}
    let depth = 1;
    let j = i + 1;
    while (j < template.length && depth > 0) {
      if (template[j] === "{") depth++;
      else if (template[j] === "}") depth--;
      if (depth === 0) break;
      j++;
    }
    const inner = template.slice(i + 1, j);
    result += formatToken(inner, values, locale);
    i = j + 1;
  }
  return result;
}

function formatToken(token: string, values: Values, locale: string): string {
  const trimmed = token.trim();
  // simple "{name}"
  if (!trimmed.includes(",")) {
    const raw = values[trimmed];
    return raw === undefined ? `{${trimmed}}` : String(raw);
  }
  const [name, type, ...rest] = trimmed.split(",").map((s) => s.trim());
  const raw = values[name];

  if (type === "number") {
    if (typeof raw === "number") return new Intl.NumberFormat(locale).format(raw);
    return String(raw ?? "");
  }

  if (type === "plural") {
    const n = Number(raw);
    const body = rest.join(",").trim(); // contains "=0 {…} one {…} other {…}"
    const cases = parsePluralCases(body);
    const exact = cases[`=${n}`];
    if (exact !== undefined) {
      return formatMessage(exact.replace(/#/g, String(n)), values, locale);
    }
    const cat = new Intl.PluralRules(locale).select(n);
    const chosen = cases[cat] ?? cases.other ?? "";
    return formatMessage(chosen.replace(/#/g, String(n)), values, locale);
  }

  return String(raw ?? "");
}

function parsePluralCases(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  let i = 0;
  while (i < body.length) {
    while (i < body.length && /\s/.test(body[i])) i++;
    if (i >= body.length) break;
    let key = "";
    while (i < body.length && body[i] !== "{" && !/\s/.test(body[i])) {
      key += body[i];
      i++;
    }
    while (i < body.length && body[i] !== "{") i++;
    if (body[i] !== "{") break;
    let depth = 1;
    const start = i + 1;
    i++;
    while (i < body.length && depth > 0) {
      if (body[i] === "{") depth++;
      else if (body[i] === "}") depth--;
      if (depth === 0) break;
      i++;
    }
    out[key] = body.slice(start, i);
    i++;
  }
  return out;
}

export function makeT(dict: Dictionary, locale: string) {
  return function t(path: string, values: Values = {}): string {
    const [ns, key] = path.split(".");
    const raw = (dict[ns]?.[key] as string | undefined) ?? path;
    return formatMessage(raw, values, locale);
  };
}

export type TFunction = ReturnType<typeof makeT>;
