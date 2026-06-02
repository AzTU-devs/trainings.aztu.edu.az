"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { ReduxProvider } from "./ReduxProvider";
import { QueryProvider } from "@/lib/query/provider";
import { AuthHydrator } from "./AuthHydrator";
import { TokenBridge } from "./TokenBridge";
import { NotificationBridge } from "./NotificationBridge";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ReduxProvider>
      <QueryProvider>
        <TokenBridge />
        <AuthHydrator />
        <NotificationBridge />
        {children}
        <Toaster position="top-right" richColors closeButton />
      </QueryProvider>
    </ReduxProvider>
  );
}
