import type { MetadataRoute } from "next";
import { courseServerApi } from "@/features/course/api.server";
import { categoryServerApi } from "@/features/category/api.server";
import { listExperts } from "@/features/expert/directory.server";
import { SHOWCASE_EXPERTS } from "@/features/showcase/flag";
import { locales } from "@/i18n/config";
import { env } from "@/lib/env";

export const revalidate = 3600;

// Public, indexable marketing routes (the authenticated student area is noindex).
const STATIC_PATHS = ["", "/courses", "/categories", "/experts", "/rooms", "/login", "/register"];

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

  // Expert pages, while the site shows the real experts (SHOWCASE_EXPERTS
  // off, the default): the same directory /experts lists, minus anyone whose
  // profile did not load — their page is a "not found" notice. A sample
  // expert's page is noindex, like the sample courses that link to it.
  if (!SHOWCASE_EXPERTS) {
    const experts = await listExperts(); // empty, not thrown, when the API is down
    for (const expert of experts.filter((e) => e.approved)) {
      for (const locale of locales) {
        entries.push({
          url: `${base}/${locale}/experts/${expert.id}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    }
  }

  // No room detail pages: today every room is a sample and its page is
  // noindex (like the sample courses', which are not listed either), and a
  // sitemap entry for a noindex page is only a "submitted URL marked noindex"
  // warning. /rooms itself is listed above; add the rooms here once they come
  // from a real public source.

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
