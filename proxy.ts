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

export function proxy(req: NextRequest) {
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

  if (needsAuth) {
    const hasSession = req.cookies.has("ep_rt") || req.cookies.has("ep_at");
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      url.search = `?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    }
  }

  const res = NextResponse.next();
  res.headers.set("x-pathname", pathname);
  res.headers.set("x-locale", locale);
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
