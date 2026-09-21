"use client";

import type { ReactNode } from "react";
import { useT } from "@/i18n/client";
import { Footer } from "./Footer";
import { Header } from "./Header";

/**
 * The public site chrome: skip link, floating header, main, footer. Used by
 * the marketing layout and by the localised 404, which renders at the [lang]
 * level — above the marketing layout — and so has to draw the chrome itself.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  const t = useT();
  return (
    <div className="flex min-h-screen flex-col">
      {/* The floating header sits above a lot of content on every page; the
          skip link lets keyboard users jump straight past it. */}
      <a
        href="#main"
        className="sr-only z-[60] rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground elev-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t("nav.skipToContent")}
      </a>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
