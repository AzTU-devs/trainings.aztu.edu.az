import type { MetadataRoute } from "next";
import { courseServerApi } from "@/features/course/api.server";
import { categoryServerApi } from "@/features/category/api.server";
import { locales } from "@/i18n/config";
import { env } from "@/lib/env";

export const revalidate = 3600;

// Public, indexable marketing routes (the authenticated student area is noindex).
const STATIC_PATHS = ["", "/courses", "/categories", "/login", "/register"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [];

  // Static pages, per locale.
  for (const locale of locales) {
    for (const path of STATIC_PATHS) {
      entries.push({
        url: `${base}/${locale}${path}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: path === "" ? 1 : 0.6,
      });
    }
  }

  // Published courses (best-effort — skipped if the catalog is unreachable).
  // No dedicated sitemap feed exists yet, so we page through the public catalog.
  try {
    const data = await courseServerApi.list({ size: 100 });
    for (const course of data.content) {
      const last = course.publishedAt ? new Date(course.publishedAt) : now;
      for (const locale of locales) {
        entries.push({
          url: `${base}/${locale}/courses/${course.slug}`,
          lastModified: last,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }
  } catch {
    /* catalog unavailable — keep the static entries only */
  }

  // Category landing (deep links into the catalog filter).
  try {
    const categories = await categoryServerApi.list();
    for (const category of categories.filter((c) => c.active)) {
      for (const locale of locales) {
        entries.push({
          url: `${base}/${locale}/courses?categoryId=${category.id}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.5,
        });
      }
    }
  } catch {
    /* categories unavailable */
  }

  return entries;
}
