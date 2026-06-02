import "server-only";
import { serverFetch } from "@/lib/api/server";
import { endpoints } from "@/lib/api/endpoints";
import type { Category } from "./types";

export const categoryServerApi = {
  list: () =>
    serverFetch<Category[]>(endpoints.public.categories, {
      revalidate: 600,
      tags: ["categories:list"],
    }),
};
