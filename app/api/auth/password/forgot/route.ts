import { NextResponse } from "next/server";
import { backend, forwardedErrorHeaders } from "../../_helpers";

// Public — relays 202 with no body whatever the backend said. The backend never
// reveals whether the account exists (no account enumeration), so neither do we.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: "Invalid body" }, { status: 400 });
  }

  const res = await backend<unknown>("/api/auth/password/forgot", {
    method: "POST",
    body,
  }).catch(() => undefined);

  // 429 is the one upstream status worth passing through, and it is the tightest
  // budget of any endpoint (3/hour per IP, because each call sends an e-mail).
  // Reporting it leaks nothing: a rate limit is a fact about the caller's own
  // address, not about whether the address they typed belongs to an account.
  // Swallowing it would be actively harmful — the user is told to check their
  // inbox for a message that was never sent, and waits instead of retrying.
  if (res?.status === 429) {
    return NextResponse.json(res.raw ?? { code: "RATE_LIMITED" }, {
      status: 429,
      headers: forwardedErrorHeaders(res),
    });
  }

  // Every other outcome — success, unknown address, backend error — is 202.
  return new NextResponse(null, { status: 202 });
}
