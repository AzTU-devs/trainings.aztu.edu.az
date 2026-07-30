import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

  // Private, per-user areas are matched with a "*" wildcard so the locale prefix
  // (e.g. /en/dashboard, /az/dashboard) is covered without enumerating locales.
  const disallow = [
    "/api/",
    "/*/dashboard",
    "/*/my-courses",
    "/*/certificates",
    "/*/notifications",
    "/*/orders",
    "/*/profile",
    "/*/settings",
    "/*/tutor",
    "/*/learn",
    "/*/checkout",
  ];

  return {
    rules: [{ userAgent: "*", allow: "/", disallow }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
