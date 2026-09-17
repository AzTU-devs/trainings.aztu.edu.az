import "server-only";
import { cookies, headers } from "next/headers";
import { serverEnv } from "@/lib/env";
import type { ApiEnvelope } from "@/types/api";

export const REFRESH_COOKIE = "ep_rt";
export const ACCESS_COOKIE = "ep_at";

// Fallback access-token lifetime if the backend doesn't give us an expiry we can
// parse. The backend's access TTL is ~15 minutes.
const ACCESS_FALLBACK_MAX_AGE = 15 * 60;

export type BackendAuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessExpiresAt: string;
  refreshExpiresAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    locale?: string | null;
    status: string;
    emailVerified: boolean;
    lastLoginAt?: string | null;
    roles: string[];
    permissions: string[];
  };
};

/**
 * Response headers to copy onto a forwarded error.
 *
 * Only `Retry-After` today, and only when the upstream sent one. Returning
 * `undefined` rather than an empty object keeps `NextResponse.json` from being
 * handed a header bag it does not need.
 */
export function forwardedErrorHeaders(res: {
  retryAfter?: string | null;
}): Record<string, string> | undefined {
  return res.retryAfter ? { "Retry-After": res.retryAfter } : undefined;
}

/**
 * The address of whoever called this route, or undefined when it cannot be
 * established. Never throws: a missing request scope must not take an auth route
 * down, it should only cost the per-IP attribution.
 */
async function callerAddress(): Promise<string | undefined> {
  try {
    const h = await headers();
    const realIp = h.get("x-real-ip")?.trim();
    if (realIp) return realIp;
    // Leftmost X-Forwarded-For entry: the client as reported by the first proxy.
    // Spoofable (see the note at the call site), hence second choice.
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
  } catch {
    return undefined;
  }
}

export async function backend<T>(
  path: string,
  init: Omit<RequestInit, "body"> & { body?: unknown } = {},
): Promise<{
  ok: boolean;
  status: number;
  data?: T;
  raw?: unknown;
  retryAfter?: string | null;
}> {
  const e = serverEnv();
  const base = e.INTERNAL_API_URL ?? e.NEXT_PUBLIC_API_URL;
  const url = new URL(path, base).toString();

  const outbound = new Headers(init.headers);
  outbound.set("Content-Type", "application/json");
  outbound.set("Accept", "application/json");

  // Forward the real caller's address.
  //
  // Every request through this BFF is made server-to-server, so without this the
  // API sees the Next process's own address for all of them. That matters now
  // that the API rate-limits the auth endpoints per IP: one shared bucket would
  // mean the 4th password reset by ANY student in an hour is refused, and an
  // attacker spraying logins would lock out every legitimate user at once, while
  // being perfectly isolated from nobody.
  //
  // X-Real-IP is preferred over X-Forwarded-For because the terminator in front
  // of this app is expected to set it from $remote_addr, which a client cannot
  // forge. A client CAN send its own X-Forwarded-For, and nginx's usual
  // $proxy_add_x_forwarded_for appends to it rather than replacing it, so the
  // leftmost entry there is attacker-controlled — it is only a fallback.
  //
  // Requires the reverse proxy in front of this app to set `X-Real-IP
  // $remote_addr`. If it does not, the API's per-IP budget degrades back to one
  // shared bucket for the whole site.
  const clientIp = await callerAddress();
  if (clientIp) outbound.set("X-Forwarded-For", clientIp);

  const res = await fetch(url, {
    ...init,
    headers: outbound,
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  const raw = res.status === 204 ? undefined : await res.json().catch(() => undefined);

  if (!res.ok) {
    // Carried through so the route can put it back on its own response: the API
    // rate-limits these endpoints and sends Retry-After with its 429, but the
    // browser only ever sees this BFF's response, so a header dropped here is a
    // wait time the login form cannot show.
    return { ok: false, status: res.status, raw, retryAfter: res.headers.get("retry-after") };
  }

  const data =
    raw &&
    typeof raw === "object" &&
    "data" in (raw as Record<string, unknown>) &&
    "timestamp" in (raw as Record<string, unknown>)
      ? (raw as ApiEnvelope<T>).data
      : (raw as T);

  return { ok: true, status: res.status, data, raw };
}

export async function setRefreshCookie(refreshToken: string, expiresAt: string) {
  const jar = await cookies();
  const expires = new Date(expiresAt);
  jar.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: Number.isNaN(expires.getTime()) ? undefined : expires,
  });
}

export async function clearRefreshCookie() {
  const jar = await cookies();
  jar.delete(REFRESH_COOKIE);
}

export async function readRefreshCookie() {
  const jar = await cookies();
  return jar.get(REFRESH_COOKIE)?.value ?? null;
}

// Mirror the backend access token into an httpOnly cookie so that server
// components / route handlers (serverFetch with auth:true, getSession) can read
// it. Browser JS never reads this — the client keeps its own copy in memory.
export async function setAccessCookie(accessToken: string, expiresAt?: string) {
  const jar = await cookies();
  let maxAge = ACCESS_FALLBACK_MAX_AGE;
  if (expiresAt) {
    const secondsLeft = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    if (Number.isFinite(secondsLeft) && secondsLeft > 0) maxAge = secondsLeft;
  }
  jar.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function clearAccessCookie() {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
}

// Convenience: persist both cookies from a successful auth response.
export async function setSessionCookies(tokens: BackendAuthTokens) {
  await setRefreshCookie(tokens.refreshToken, tokens.refreshExpiresAt);
  await setAccessCookie(tokens.accessToken, tokens.accessExpiresAt);
}

export async function clearSessionCookies() {
  await clearRefreshCookie();
  await clearAccessCookie();
}
