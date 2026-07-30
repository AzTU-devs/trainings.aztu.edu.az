import { NextResponse } from "next/server";
import { backend } from "../../_helpers";

// Public — completes a password reset with a single-use token. Relays the backend
// status so the client can distinguish success (204) from an invalid/expired
// token (400).
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: "Invalid body" }, { status: 400 });
  }

  const res = await backend<unknown>("/api/auth/password/reset", {
    method: "POST",
    body,
  });

  if (!res.ok) {
    return NextResponse.json(res.raw ?? { message: "Password reset failed" }, {
      status: res.status,
    });
  }
  return new NextResponse(null, { status: 204 });
}
