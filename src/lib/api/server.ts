import "server-only";
import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { serverEnv } from "@/lib/env";
import type { ApiEnvelope, ApiError, FieldErrorItem } from "@/types/api";

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
  searchParams?: Record<string, string | number | boolean | undefined>;
  revalidate?: number | false;
  tags?: string[];
};

function buildUrl(path: string, params?: FetchOptions["searchParams"]) {
  const e = serverEnv();
  const base = e.INTERNAL_API_URL ?? e.NEXT_PUBLIC_API_URL;
  const url = new URL(path.startsWith("/") ? path : `/${path}`, base);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

function unwrap<T>(body: unknown): T {
  if (
    body &&
    typeof body === "object" &&
    "data" in (body as Record<string, unknown>) &&
    "timestamp" in (body as Record<string, unknown>)
  ) {
    return (body as ApiEnvelope<T>).data;
  }
  return body as T;
}

function networkCode(cause: unknown): string {
  const c = cause as { cause?: { code?: string }; code?: string; message?: string };
  return c?.cause?.code ?? c?.code ?? c?.message ?? String(cause);
}

/** Path and origin only: the query can carry search terms, and never a token. */
function logFailure(method: string | undefined, url: string, what: string) {
  const u = new URL(url);
  console.error(`[api] ${method ?? "GET"} ${u.pathname} via ${u.origin} failed: ${what}`);
}

export async function serverFetch<T>(
  path: string,
  opts: FetchOptions = {},
): Promise<T> {
  const { body, auth, searchParams, revalidate, tags, headers, ...rest } = opts;

  const reqHeaders = new Headers(headers);
  reqHeaders.set("Content-Type", "application/json");
  reqHeaders.set("Accept", "application/json");

  if (auth) {
    const jar = await cookies();
    const access = jar.get("ep_at")?.value;
    if (access) reqHeaders.set("Authorization", `Bearer ${access}`);
  }

  const next: { revalidate?: number | false; tags?: string[] } = {};
  if (revalidate !== undefined) next.revalidate = revalidate;
  if (tags) next.tags = tags;

  const url = buildUrl(path, searchParams);
  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: reqHeaders,
      body: body ? JSON.stringify(body) : undefined,
      next: Object.keys(next).length ? next : undefined,
    });
  } catch (cause) {
    // Next.js's own signals (a page found to be dynamic during the build, and the
    // like) are thrown through fetch too; they pass untouched and are not failures.
    unstable_rethrow(cause);
    // Many pages turn a failed call into an empty list (`.catch(() => [])`), so an
    // API this server cannot reach looked like an empty catalogue: the expert
    // sign-up page said there were no categories while the API had seven. Said
    // here once, with the address tried, it shows up in `docker logs`.
    logFailure(rest.method, url, networkCode(cause));
    throw cause;
  }

  if (res.status >= 500) logFailure(rest.method, url, `HTTP ${res.status}`);

  if (!res.ok) {
    let parsed: {
      status?: number;
      code?: string;
      message?: string;
      path?: string;
      requestId?: string;
      errors?: FieldErrorItem[];
    } = {};
    try {
      parsed = await res.json();
    } catch {
      /* ignore */
    }
    const err: ApiError = {
      status: parsed.status ?? res.status,
      code: parsed.code,
      message: parsed.message ?? res.statusText,
      path: parsed.path,
      requestId: parsed.requestId,
      errors: parsed.errors,
    };
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return unwrap<T>(await res.json());
}
