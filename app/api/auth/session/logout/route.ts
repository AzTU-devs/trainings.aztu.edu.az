import { NextResponse } from "next/server";
import {
  backend,
  clearSessionCookies,
  readRefreshCookie,
} from "../../_helpers";

export async function POST() {
  const refreshToken = await readRefreshCookie();
  if (refreshToken) {
    await backend("/api/auth/logout", {
      method: "POST",
      body: { refreshToken },
    }).catch(() => undefined);
  }
  await clearSessionCookies();
  return NextResponse.json({ ok: true });
}
