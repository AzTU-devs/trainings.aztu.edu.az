import { NextResponse } from "next/server";
import {
  backend,
  clearSessionCookies,
  readRefreshCookie,
  setSessionCookies,
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
    await clearSessionCookies();
    return NextResponse.json(res.raw ?? { message: "Refresh failed" }, {
      status: res.status,
    });
  }

  await setSessionCookies(res.data);
  return NextResponse.json({ accessToken: res.data.accessToken });
}
