"use client";

import { useEffect } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/query/keys";
import { request } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { tokenStore } from "@/lib/auth/tokens";
import { useAppDispatch } from "@/store/hooks";
import { setAccessToken, setStatus, setUser } from "@/store/slices/auth-slice";
import type { User } from "@/types/user";

/**
 * The access token for an existing session, from the BFF (see the GET handler
 * in app/api/auth/session/route.ts), or null when there is no session. Never
 * throws: failing to restore a session means rendering signed-out, not an error.
 */
async function restoreAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.get<{ accessToken: string | null }>("/api/auth/session", {
      baseURL: "",
      withCredentials: true,
    });
    return data.accessToken ?? null;
  } catch {
    return null;
  }
}

export function AuthHydrator() {
  const dispatch = useAppDispatch();

  const { data, isLoading, isError } = useQuery({
    queryKey: qk.auth.me(),
    queryFn: async () => {
      // After a full page load the in-memory token is gone. Asking /me without
      // one always answered 401, which made every signed-in participant look
      // signed out on the client until they signed in again.
      if (!tokenStore.get()) {
        const token = await restoreAccessToken();
        if (!token) return null;
        // Set directly as well as in the store: the /me request below goes out
        // before TokenBridge's effect would copy the store value across.
        tokenStore.set(token);
        dispatch(setAccessToken(token));
      }
      return request<User>({ url: endpoints.auth.me, method: "GET" });
    },
    retry: false,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (isLoading) dispatch(setStatus("loading"));
    else if (isError) dispatch(setUser(null));
    // null is a settled answer — no session — and must end the loading state.
    else dispatch(setUser(data ?? null));
  }, [data, isLoading, isError, dispatch]);

  return null;
}
