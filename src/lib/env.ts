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

function readClient() {
  const parsed = ClientSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_PORTAL_URL: process.env.NEXT_PUBLIC_PORTAL_URL,
    NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
  });
  if (parsed.success) return parsed.data;
  console.warn("Invalid client env, falling back to defaults:", parsed.error.flatten());
  return ClientSchema.parse({});
}

export const env = readClient();

export function serverEnv() {
  const parsed = ServerSchema.safeParse({
    ...env,
    INTERNAL_API_URL: process.env.INTERNAL_API_URL,
    REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
    SENTRY_DSN: process.env.SENTRY_DSN,
  });
  if (parsed.success) return parsed.data;
  return ServerSchema.parse({ ...env });
}
