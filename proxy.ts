import { NextResponse, type NextRequest } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { locales, defaultLocale, isLocale } from "@/i18n/config";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/my-courses",
  "/certificates",
  "/notifications",
  "/orders",
  "/profile",
  "/settings",
  "/learn",
  "/checkout",
];

const ACCESS_COOKIE = "ep_at";
const REFRESH_COOKIE = "ep_rt";
const ACCESS_FALLBACK_MAX_AGE = 15 * 60;

type BackendAuthTokens = {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: string;
  refreshExpiresAt: string;
};

function detectLocale(req: NextRequest): string {
  const cookieLocale = req.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && isLocale(cookieLocale)) return cookieLocale;

  const accept = req.headers.get("accept-language");
  if (!accept) return defaultLocale;
  try {
    const headers = { "accept-language": accept };
    const languages = new Negotiator({ headers }).languages();
    return match(languages, locales as unknown as string[], defaultLocale);
  } catch {
    return defaultLocale;
  }
}

// Server-side refresh from the proxy layer.
//
// Next 16 server components can only READ cookies — `.set`/`.delete` are not
// allowed during RSC render (they must run in a Server Action or Route Handler,
// see node_modules/next/dist/docs/.../cookies.md). So when an SSR-protected page
// is requested with a valid `ep_rt` but an expired/absent `ep_at` (the browser
// drops `ep_at` once its maxAge passes), neither getSession nor serverFetch can
// rotate the tokens — they would just 401 and the page would bounce to /login.
//
// The proxy IS allowed to set cookies (on the request via `NextResponse.next({
// request })` so the downstream RSC sees the fresh `ep_at`, and on the response
// so the browser persists the rotated pair). This mirrors the client axios 401
// interceptor + /api/auth/refresh-session route handler, just one layer earlier.
async function refreshTokens(
  refreshToken: string,
): Promise<BackendAuthTokens | null> {
  const base = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
  try {
    const res = await fetch(new URL("/api/auth/refresh", base).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const raw = await res.json().catch(() => undefined);
    const data =
      raw &&
      typeof raw === "object" &&
      "data" in raw &&
      "timestamp" in raw
        ? (raw as { data: BackendAuthTokens }).data
        : (raw as BackendAuthTokens);
    if (!data?.accessToken || !data?.refreshToken) return null;
    return data;
  } catch {
    return null;
  }
}

function accessMaxAge(expiresAt?: string): number {
  if (!expiresAt) return ACCESS_FALLBACK_MAX_AGE;
  const secondsLeft = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
  return Number.isFinite(secondsLeft) && secondsLeft > 0
    ? secondsLeft
    : ACCESS_FALLBACK_MAX_AGE;
}

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Skip API routes — those are not locale-scoped
  if (pathname.startsWith("/api/")) {
    const res = NextResponse.next();
    res.headers.set("x-pathname", pathname);
    return res;
  }

  const pathnameHasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );

  if (!pathnameHasLocale) {
    const locale = detectLocale(req);
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  // Strip leading "/{locale}" to evaluate auth gating on the logical path
  const segments = pathname.split("/");
  const locale = segments[1];
  const logicalPath = "/" + segments.slice(2).join("/");

  const needsAuth = PROTECTED_PREFIXES.some(
    (p) => logicalPath === p || logicalPath.startsWith(`${p}/`),
  );

  // Carry the fresh access token into the request when we rotate below, so the
  // RSC render (getSession / serverFetch auth:true) reads the new `ep_at`.
  let rotated: BackendAuthTokens | null = null;

  if (needsAuth) {
    const hasAccess = req.cookies.has(ACCESS_COOKIE);
    const hasRefresh = req.cookies.has(REFRESH_COOKIE);

    if (!hasAccess && !hasRefresh) {
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      url.search = `?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    }

    // Access token expired/absent but refresh token present: refresh server-side
    // before the page renders so the user isn't bounced to /login.
    if (!hasAccess && hasRefresh) {
      const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
      rotated = refreshToken ? await refreshTokens(refreshToken) : null;

      if (!rotated) {
        // Refresh failed — fall through to the unauthenticated path.
        const url = req.nextUrl.clone();
        url.pathname = `/${locale}/login`;
        url.search = `?next=${encodeURIComponent(pathname + search)}`;
        const res = NextResponse.redirect(url);
        res.cookies.delete(ACCESS_COOKIE);
        res.cookies.delete(REFRESH_COOKIE);
        return res;
      }

      // Make the fresh access token visible to the downstream RSC render.
      req.cookies.set(ACCESS_COOKIE, rotated.accessToken);
      req.cookies.set(REFRESH_COOKIE, rotated.refreshToken);
    }
  }

  const res = NextResponse.next({
    request: rotated ? { headers: req.headers } : undefined,
  });
  res.headers.set("x-pathname", pathname);
  res.headers.set("x-locale", locale);

  // Persist rotated cookies to the browser, mirroring app/api/auth/_helpers.ts.
  if (rotated) {
    const secure = process.env.NODE_ENV === "production";
    res.cookies.set(ACCESS_COOKIE, rotated.accessToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: accessMaxAge(rotated.accessExpiresAt),
    });
    const refreshExpires = new Date(rotated.refreshExpiresAt);
    res.cookies.set(REFRESH_COOKIE, rotated.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      expires: Number.isNaN(refreshExpires.getTime()) ? undefined : refreshExpires,
    });
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
