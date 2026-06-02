import "server-only";
import { serverFetch } from "@/lib/api/server";
import { endpoints } from "@/lib/api/endpoints";
import type { TutorProfile } from "./types";

export const tutorServerApi = {
  myProfile: () =>
    serverFetch<TutorProfile>(endpoints.portal.tutorMe, {
      auth: true,
      cache: "no-store",
    }),
};
