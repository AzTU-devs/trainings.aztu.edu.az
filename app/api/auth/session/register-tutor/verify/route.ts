import { NextResponse } from "next/server";
import { backend } from "../../../_helpers";

// Public OTP step — no cookie/login. Creates a PENDING tutor application on the backend.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: "Invalid body" }, { status: 400 });
  }

  const res = await backend<unknown>("/api/auth/register/tutor/verify", {
    method: "POST",
    body,
  });

  if (!res.ok) {
    return NextResponse.json(res.raw ?? { message: "OTP verification failed" }, {
      status: res.status,
    });
  }
  return NextResponse.json(res.data, { status: 201 });
}
