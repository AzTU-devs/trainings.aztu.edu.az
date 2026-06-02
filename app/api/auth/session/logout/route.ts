import { NextResponse } from "next/server";
import {
  backend,
  clearRefreshCookie,
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
  await clearRefreshCookie();
  return NextResponse.json({ ok: true });
}
