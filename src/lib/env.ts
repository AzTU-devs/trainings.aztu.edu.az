import { z } from "zod";

const ClientSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:8080"),
  NEXT_PUBLIC_WS_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  // Portal (React) frontend where tutors & admins sign in.
  NEXT_PUBLIC_PORTAL_URL: z.string().url().default("http://localhost:3001"),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.string().default("en"),
});

const ServerSchema = ClientSchema.extend({
  INTERNAL_API_URL: z.string().url().optional(),
  REVALIDATE_SECRET: z.string().min(8).optional(),
  SENTRY_DSN: z.string().url().optional(),
});

type ClientEnv = z.infer<typeof ClientSchema>;
type ServerEnv = z.infer<typeof ServerSchema>;

// serverEnv() runs on every SSR fetch and BFF call, so an invalid value would
// otherwise repeat its warning on every request.
const warned = new Set<string>();

/**
 * Validates ONE variable and, if it is invalid, falls back to that variable's
 * own default. Validating the whole object at once is what used to go wrong:
 * one bad value failed the parse and the fallback threw away every other
 * variable with it — an empty SENTRY_DSN silently discarded INTERNAL_API_URL,
 * sending SSR and the auth BFF through the public hostname instead of the
 * loopback API.
 *
 * Blank counts as unset. `KEY=` is what .env.example ships (SENTRY_DSN,
 * REVALIDATE_SECRET), what docker-compose.yml passes for `${SENTRY_DSN:-}`, and
 * what docker-compose.prod.yml bakes in as a build arg for any NEXT_PUBLIC_* the
 * .env leaves out — none of that is an attempt to configure a value.
 *
 * The warning names the variable and the rule it broke but never the value:
 * SENTRY_DSN carries a key and REVALIDATE_SECRET is a secret.
 */
function read<S extends z.ZodType>(name: string, schema: S, raw: string | undefined): z.output<S> {
  const value = raw === undefined || raw.trim() === "" ? undefined : raw;
  const parsed = schema.safeParse(value);
  if (parsed.success) return parsed.data;
  if (!warned.has(name)) {
    warned.add(name);
    const reason = parsed.error.issues.map((issue) => issue.message).join("; ");
    console.warn(`Invalid ${name} (${reason}); treating it as unset.`);
  }
  return schema.parse(undefined);
}

// Every NEXT_PUBLIC_* read is spelled out as a literal `process.env.NAME`:
// that exact expression is what `next build` inlines into the client bundle,
// and a computed `process.env[name]` would be undefined in the browser.
function readClient(): ClientEnv {
  const s = ClientSchema.shape;
  return {
    NEXT_PUBLIC_API_URL: read(
      "NEXT_PUBLIC_API_URL",
      s.NEXT_PUBLIC_API_URL,
      process.env.NEXT_PUBLIC_API_URL,
    ),
    NEXT_PUBLIC_WS_URL: read(
      "NEXT_PUBLIC_WS_URL",
      s.NEXT_PUBLIC_WS_URL,
      process.env.NEXT_PUBLIC_WS_URL,
    ),
    NEXT_PUBLIC_SITE_URL: read(
      "NEXT_PUBLIC_SITE_URL",
      s.NEXT_PUBLIC_SITE_URL,
      process.env.NEXT_PUBLIC_SITE_URL,
    ),
    NEXT_PUBLIC_PORTAL_URL: read(
      "NEXT_PUBLIC_PORTAL_URL",
      s.NEXT_PUBLIC_PORTAL_URL,
      process.env.NEXT_PUBLIC_PORTAL_URL,
    ),
    NEXT_PUBLIC_DEFAULT_LOCALE: read(
      "NEXT_PUBLIC_DEFAULT_LOCALE",
      s.NEXT_PUBLIC_DEFAULT_LOCALE,
      process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
    ),
  };
}

export const env = readClient();

export function serverEnv(): ServerEnv {
  const s = ServerSchema.shape;
  return {
    ...env,
    INTERNAL_API_URL: read("INTERNAL_API_URL", s.INTERNAL_API_URL, process.env.INTERNAL_API_URL),
    REVALIDATE_SECRET: read("REVALIDATE_SECRET", s.REVALIDATE_SECRET, process.env.REVALIDATE_SECRET),
    SENTRY_DSN: read("SENTRY_DSN", s.SENTRY_DSN, process.env.SENTRY_DSN),
  };
}
