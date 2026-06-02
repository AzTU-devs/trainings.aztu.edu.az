import "server-only";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "./session";
import type { User } from "@/types/user";

export async function requireUser(): Promise<User> {
  const user = await getSession();
  if (!user) {
    const h = await headers();
    const path = h.get("x-pathname") ?? "/";
    redirect(`/login?next=${encodeURIComponent(path)}`);
  }
  return user;
}
