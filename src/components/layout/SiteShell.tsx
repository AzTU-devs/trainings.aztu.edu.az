"use client";

import type { ReactNode } from "react";
import { useT } from "@/i18n/client";
import { Footer } from "./Footer";
import { Header } from "./Header";

/**
 * The public site chrome: skip link, header, main, footer (the back cover).
 * Used by the marketing layout and by the localised 404, which renders at the
 * [lang] level — above the marketing layout — and so has to draw the chrome
 * itself.
 *
 * `year` is the imprint year, computed by the server component that renders
 * the shell (see Footer).
 */
export function SiteShell({ children, year }: { children: ReactNode; year: number }) {
  const t = useT();
  return (
    <div className="flex min-h-screen flex-col">
      {/* The header sits above a lot of content on every page; the skip link
          lets keyboard users jump straight past it. */}
      <a href="#main" className="skip-link">
        {t("nav.skipToContent")}
      </a>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer year={year} />
    </div>
  );
}
