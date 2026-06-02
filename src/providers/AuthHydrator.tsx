"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/query/keys";
import { request } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { useAppDispatch } from "@/store/hooks";
import { setStatus, setUser } from "@/store/slices/auth-slice";
import type { User } from "@/types/user";

export function AuthHydrator() {
  const dispatch = useAppDispatch();

  const { data, isLoading, isError } = useQuery({
    queryKey: qk.auth.me(),
    queryFn: () => request<User>({ url: endpoints.auth.me, method: "GET" }),
    retry: false,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (isLoading) dispatch(setStatus("loading"));
    else if (isError) dispatch(setUser(null));
    else if (data) dispatch(setUser(data));
  }, [data, isLoading, isError, dispatch]);

  return null;
}
