import "server-only";
import { cookies } from "next/headers";
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

export async function backend<T>(
  path: string,
  init: Omit<RequestInit, "body"> & { body?: unknown } = {},
): Promise<{ ok: boolean; status: number; data?: T; raw?: unknown }> {
  const e = serverEnv();
  const base = e.INTERNAL_API_URL ?? e.NEXT_PUBLIC_API_URL;
  const url = new URL(path, base).toString();

  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");

  const res = await fetch(url, {
    ...init,
    headers,
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  const raw = res.status === 204 ? undefined : await res.json().catch(() => undefined);

  if (!res.ok) {
    return { ok: false, status: res.status, raw };
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
