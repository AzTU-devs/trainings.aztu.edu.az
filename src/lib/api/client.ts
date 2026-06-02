import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { env } from "@/lib/env";
import { tokenStore } from "@/lib/auth/tokens";
import type { ApiEnvelope, ApiError, FieldErrorItem } from "@/types/api";

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
      const next = encodeURIComponent(window.location.pathname);
      window.location.href = `/login?next=${next}`;
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
    return {
      status: body?.status ?? error.response?.status ?? 0,
      code: body?.code,
      message: body?.message ?? error.message,
      path: body?.path,
      requestId: body?.requestId,
      errors: body?.errors,
    };
  }
  return { status: 0, message: "Unexpected error" };
}

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const res = await api.request<T>(config);
  return res.data;
}
