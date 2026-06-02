import { NextResponse } from "next/server";
import {
  backend,
  setRefreshCookie,
  type BackendAuthTokens,
} from "../_helpers";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: "Invalid body" }, { status: 400 });
  }

  const res = await backend<BackendAuthTokens>("/api/auth/login", {
    method: "POST",
    body,
  });

  if (!res.ok || !res.data) {
    return NextResponse.json(res.raw ?? { message: "Login failed" }, {
      status: res.status,
    });
  }

  await setRefreshCookie(res.data.refreshToken, res.data.refreshExpiresAt);

  return NextResponse.json({
    accessToken: res.data.accessToken,
    user: res.data.user,
  });
}
