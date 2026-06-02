import { NextResponse } from "next/server";
import { backend } from "../../../_helpers";

// Public OTP step — no cookie set. Just proxies to the backend and relays the result.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: "Invalid body" }, { status: 400 });
  }

  const res = await backend<unknown>("/api/auth/register/tutor/start", {
    method: "POST",
    body,
  });

  if (!res.ok) {
    return NextResponse.json(res.raw ?? { message: "Could not start tutor signup" }, {
      status: res.status,
    });
  }
  return NextResponse.json(res.data, { status: 202 });
}
