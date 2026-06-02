"use client";

import { useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import { tokenStore } from "@/lib/auth/tokens";

export function TokenBridge() {
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  useEffect(() => {
    tokenStore.set(accessToken);
  }, [accessToken]);
  return null;
}
