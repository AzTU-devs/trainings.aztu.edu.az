"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { useT } from "@/i18n/client";
import { ReduxProvider } from "./ReduxProvider";
import { QueryProvider } from "@/lib/query/provider";
import { AuthHydrator } from "./AuthHydrator";
import { TokenBridge } from "./TokenBridge";
import { NotificationBridge } from "./NotificationBridge";

export function AppProviders({ children }: { children: ReactNode }) {
  // Only for the Toaster's labels: sonner's defaults ("Notifications",
  // "Close toast") would reach screen readers in English on /az pages.
  const t = useT();
  return (
    <ReduxProvider>
      <QueryProvider>
        <TokenBridge />
        <AuthHydrator />
        <NotificationBridge />
        {children}
        {/* The ink toast (styled in globals.css): bottom-right, and on phones
            lifted above the course page's fixed enrol bar via --enrol-bar-h. */}
        <Toaster
          position="bottom-right"
          closeButton
          offset={24}
          mobileOffset={{ bottom: "calc(16px + var(--enrol-bar-h, 0px))", left: 16, right: 16 }}
          containerAriaLabel={t("ui.toastRegion")}
          toastOptions={{ closeButtonAriaLabel: t("ui.toastClose") }}
        />
      </QueryProvider>
    </ReduxProvider>
  );
}
