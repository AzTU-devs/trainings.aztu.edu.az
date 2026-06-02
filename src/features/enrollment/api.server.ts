import "server-only";
import { serverFetch } from "@/lib/api/server";
import { endpoints } from "@/lib/api/endpoints";
import type { Enrollment } from "./types";

export const enrollmentServerApi = {
  mine: () =>
    serverFetch<Enrollment[]>(endpoints.portal.myEnrollments, {
      auth: true,
      cache: "no-store",
    }),
};
