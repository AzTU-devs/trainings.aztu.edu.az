import { NextResponse } from "next/server";
import { backend } from "../../../_helpers";

// Public — confirms an email-verification token. Relays the backend status so the
// client can distinguish success (204) from an invalid/expired token (400).
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: "Invalid body" }, { status: 400 });
  }

  const res = await backend<unknown>("/api/auth/email/verify/confirm", {
    method: "POST",
    body,
  });

  if (!res.ok) {
    return NextResponse.json(
      res.raw ?? { message: "Email verification failed" },
      { status: res.status },
    );
  }
  return new NextResponse(null, { status: 204 });
}
