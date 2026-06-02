import { NextResponse } from "next/server";
import {
  backend,
  clearRefreshCookie,
  readRefreshCookie,
  setRefreshCookie,
  type BackendAuthTokens,
} from "../_helpers";

export async function POST() {
  const refreshToken = await readRefreshCookie();
  if (!refreshToken) {
    return NextResponse.json({ message: "No session" }, { status: 401 });
  }

  const res = await backend<BackendAuthTokens>("/api/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });

  if (!res.ok || !res.data) {
    await clearRefreshCookie();
    return NextResponse.json(res.raw ?? { message: "Refresh failed" }, {
      status: res.status,
    });
  }

  await setRefreshCookie(res.data.refreshToken, res.data.refreshExpiresAt);
  return NextResponse.json({ accessToken: res.data.accessToken });
}
