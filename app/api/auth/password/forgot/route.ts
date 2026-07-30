import { NextResponse } from "next/server";
import { backend } from "../../_helpers";

// Public — always relays 202 with no body. The backend never reveals whether the
// account exists (no account enumeration), so we surface the same result here.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: "Invalid body" }, { status: 400 });
  }

  await backend<unknown>("/api/auth/password/forgot", {
    method: "POST",
    body,
  }).catch(() => undefined);

  // Always 202 regardless of the backend outcome.
  return new NextResponse(null, { status: 202 });
}
