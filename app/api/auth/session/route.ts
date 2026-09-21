import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ACCESS_COOKIE,
  backend,
  clearSessionCookies,
  forwardedErrorHeaders,
  readRefreshCookie,
  setSessionCookies,
  type BackendAuthTokens,
} from "../_helpers";

// The token is a credential: no shared cache, no browser cache, no bfcache copy.
const NO_STORE = { "Cache-Control": "no-store" };

/** Seconds the access token must still have left to be handed out as-is. */
const MIN_REMAINING_S = 60;

/** The `exp` claim of a JWT, or null when it cannot be read. Not a verification — the API does that. */
function expiresAt(jwt: string): number | null {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split(".")[1] ?? "", "base64url").toString("utf8"));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

/**
 * The browser's copy of the access token, after a full page load.
 *
 * The client keeps the access token in memory only (src/lib/auth/tokens.ts), so
 * a reload, a new tab or a link from outside starts with none. Nothing restored
 * it: the /api/auth/me call that decides whether the header shows the user went
 * out without a token, got 401, and — auth URLs being exempt from the silent
 * refresh — left a signed-in participant looking signed out. The header offered
 * "Daxil ol", and the course page's enrol button sent them to the login form.
 *
 * This hands back the token from the httpOnly cookie while it is still good, and
 * only when it has expired spends the refresh token for a new one. An anonymous
 * visitor gets `{ accessToken: null }` with a 200, so the common case costs one
 * cheap local request and logs no error in the console.
 *
 * Exposing the token to page script adds nothing: login already returns it to
 * the browser. A cross-site page cannot read this response (no CORS headers),
 * and the SameSite=Lax cookies are not sent on cross-site fetches anyway.
 */
export async function GET() {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  const exp = access ? expiresAt(access) : null;
  if (access && exp !== null && exp - Date.now() / 1000 > MIN_REMAINING_S) {
    return NextResponse.json({ accessToken: access }, { headers: NO_STORE });
  }

  const refreshToken = await readRefreshCookie();
  if (!refreshToken) {
    return NextResponse.json({ accessToken: null }, { headers: NO_STORE });
  }

  const res = await backend<BackendAuthTokens>("/api/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });
  if (!res.ok || !res.data) {
    // Only a refresh token the API has rejected ends the session. A 429 from a
    // busy shared address or a 5xx must not sign the user out for good; this
    // page just renders signed-out and the next load tries again.
    if (res.status === 401 || res.status === 403) await clearSessionCookies();
    return NextResponse.json({ accessToken: null }, { headers: NO_STORE });
  }

  await setSessionCookies(res.data);
  return NextResponse.json({ accessToken: res.data.accessToken }, { headers: NO_STORE });
}

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
      status: res.status, headers: forwardedErrorHeaders(res),
    });
  }

  await setSessionCookies(res.data);

  return NextResponse.json({
    accessToken: res.data.accessToken,
    user: res.data.user,
  });
}
