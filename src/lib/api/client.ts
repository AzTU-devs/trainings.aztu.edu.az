import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { env } from "@/lib/env";
import { tokenStore } from "@/lib/auth/tokens";
import { isLocale } from "@/i18n/config";
import type { ApiEnvelope, ApiError, FieldErrorItem } from "@/types/api";

const isLocalePrefix = (seg: string | undefined): boolean =>
  !!seg && isLocale(seg);

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// We always talk to the backend via our own Next BFF for auth so the refresh
// token cookie can be httpOnly. Everything else hits the backend directly.
export const api: AxiosInstance = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout: 20_000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// Unwrap the backend's `ApiResponse<T> = { data, meta, timestamp }` envelope.
api.interceptors.response.use(
  (response: AxiosResponse) => {
    const body = response.data;
    if (
      body &&
      typeof body === "object" &&
      "data" in body &&
      "timestamp" in body
    ) {
      response.data = (body as ApiEnvelope<unknown>).data;
    }
    return response;
  },
  (error: AxiosError) => Promise.reject(error),
);

let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  try {
    const { data } = await axios.post<{ accessToken: string }>(
      "/api/auth/refresh-session",
      {},
      { withCredentials: true, baseURL: "" },
    );
    tokenStore.set(data.accessToken);
    return data.accessToken;
  } catch {
    tokenStore.clear();
    return null;
  }
}

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const original = error.config as RetriableConfig | undefined;
  const status = error.response?.status;

  if (
    status === 401 &&
    original &&
    !original._retry &&
    !original.url?.includes("/api/auth/")
  ) {
    original._retry = true;
    refreshPromise = refreshPromise ?? performRefresh();
    const newToken = await refreshPromise;
    refreshPromise = null;
    if (newToken) {
      original.headers.set("Authorization", `Bearer ${newToken}`);
      return api(original);
    }
    if (typeof window !== "undefined") {
      const next = encodeURIComponent(
        window.location.pathname + window.location.search,
      );
      // Preserve the active locale prefix so the login route resolves and the
      // post-login redirect lands back in the same language.
      const seg = window.location.pathname.split("/")[1];
      const prefix = isLocalePrefix(seg) ? `/${seg}` : "";
      window.location.href = `${prefix}/login?next=${next}`;
    }
  }

  return Promise.reject(normalizeError(error));
});

export function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as
      | {
          status?: number;
          code?: string;
          message?: string;
          path?: string;
          requestId?: string;
          errors?: FieldErrorItem[];
        }
      | undefined;
    const status = body?.status ?? error.response?.status ?? 0;

    // The API rate-limits the auth endpoints per IP and answers 429 with a
    // Retry-After. Campus networks are NATed, so an ordinary student can be
    // throttled by a neighbour's activity; the backend's own message does not know
    // the wait, and without this the form shows a generic failure that reads as a
    // wrong password.
    if (status === 429) {
      return {
        status,
        code: body?.code ?? "RATE_LIMITED",
        message: retryAfterMessage(error.response?.headers?.["retry-after"]),
        path: body?.path,
        requestId: body?.requestId,
      };
    }

    return {
      status,
      code: body?.code,
      message: body?.message ?? error.message,
      path: body?.path,
      requestId: body?.requestId,
      errors: body?.errors,
    };
  }
  return { status: 0, message: "Unexpected error" };
}

/**
 * Human wording for a 429's `Retry-After`. The header is in the API's CORS
 * exposed-headers list, but can still be stripped by a proxy — so degrade to
 * actionable advice rather than to a bare status.
 */
function retryAfterMessage(header: unknown): string {
  const seconds = Number(header);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "Too many attempts from this network. Please wait a little and try again.";
  }
  if (seconds < 60) {
    return `Too many attempts from this network. Please try again in ${Math.ceil(seconds)} seconds.`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `Too many attempts from this network. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const res = await api.request<T>(config);
  return res.data;
}
