import "server-only";
import { cookies } from "next/headers";
import { serverEnv } from "@/lib/env";
import type { ApiEnvelope } from "@/types/api";

export const REFRESH_COOKIE = "ep_rt";

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
