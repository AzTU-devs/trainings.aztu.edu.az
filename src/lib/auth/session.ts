import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { serverFetch } from "@/lib/api/server";
import { endpoints } from "@/lib/api/endpoints";
import type { User } from "@/types/user";

export const getSession = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  if (!jar.get("ep_rt") && !jar.get("ep_at")) return null;
  try {
    return await serverFetch<User>(endpoints.auth.me, { auth: true });
  } catch {
    return null;
  }
});
