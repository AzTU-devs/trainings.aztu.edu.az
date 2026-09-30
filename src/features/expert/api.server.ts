import "server-only";
import { serverFetch } from "@/lib/api/server";
import { endpoints } from "@/lib/api/endpoints";
import type { Page } from "@/types/api";
import type { ExpertProfile } from "./types";

export const expertServerApi = {
  myProfile: () =>
    serverFetch<ExpertProfile>(endpoints.portal.tutorMe, {
      auth: true,
      cache: "no-store",
    }),

  /** One page of the approved experts, ordered by name. */
  list: (page: number, size: number) =>
    serverFetch<Page<ExpertProfile>>(endpoints.public.tutors, {
      searchParams: { page, size },
      revalidate: 300,
      tags: ["experts"],
    }),
  /** Public profile of an approved expert. id === course.tutorId. */
  byId: (id: string) =>
    serverFetch<ExpertProfile>(endpoints.public.tutorById(id), {
      revalidate: 300,
      tags: [`expert:${id}`],
    }),
};
