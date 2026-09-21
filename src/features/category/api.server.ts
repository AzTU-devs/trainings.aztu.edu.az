import "server-only";
import { serverFetch } from "@/lib/api/server";
import { endpoints } from "@/lib/api/endpoints";
import type { Category } from "./types";

export const categoryServerApi = {
  /**
   * Never cached. A category added in the dashboard has to show up on the site
   * immediately — anything else reads as the save having failed.
   *
   * <p>It used to be cached for ten minutes, with the pages that render it cached
   * for ten more, so a new category could take twenty to appear. That is the wrong
   * trade for this call: it returns the handful of top-level categories, it is a
   * single indexed query, and the pages using it already hit the API for their
   * other data. The `categories:list` tag stays so that on-demand revalidation can
   * take over here if this ever becomes hot enough to be worth caching again.
   */
  list: () =>
    serverFetch<Category[]>(endpoints.public.categories, {
      revalidate: 0,
      tags: ["categories:list"],
    }),
};
