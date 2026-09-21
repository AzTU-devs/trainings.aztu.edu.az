import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// `NEXT_PUBLIC_*` are build args (DEPLOY.md), so everything below is resolved
// once during `next build` and baked into the routes manifest / image config.
// Deriving the CSP and the image allowlist from the same value is what stops the
// two from drifting apart when the API moves hosts.
const PROD_API_ORIGIN = "https://api-trainings.aztu.edu.az";
const PROD_SITE_ORIGIN = "https://trainings.aztu.edu.az";
const DEV_API_ORIGIN = "http://localhost:8080"; // same defaults as src/lib/env.ts
const DEV_SITE_ORIGIN = "http://localhost:3000";

function originOf(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

const apiOrigin =
  originOf(process.env.NEXT_PUBLIC_API_URL) ??
  (isDev ? DEV_API_ORIGIN : PROD_API_ORIGIN);

// Mirrors deriveWsUrl() in src/features/notification/ws.ts: an explicit
// NEXT_PUBLIC_WS_URL wins, otherwise the API origin with the scheme upgraded.
function wsOriginFrom(httpOrigin: string): string {
  const url = new URL(httpOrigin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.origin;
}

const wsOrigin = originOf(process.env.NEXT_PUBLIC_WS_URL) ?? wsOriginFrom(apiOrigin);

// HSTS and upgrade-insecure-requests are keyed off the scheme this build will
// actually be served on rather than off NODE_ENV, because the image is also run
// in production mode locally (the Dockerfile's http://localhost defaults). Both
// directives are meaningless-to-harmful over plain http.
const siteOrigin =
  originOf(process.env.NEXT_PUBLIC_SITE_URL) ??
  (isDev ? DEV_SITE_ORIGIN : PROD_SITE_ORIGIN);
const servesHttps = siteOrigin.startsWith("https:");

// Course thumbnails are the only remote images the app renders — CourseCard
// feeds `mediaSrc(course.thumbnailUrl)` (an absolute URL on the API origin,
// pointing at /api/public/media/{id}/content) to next/image. Everything else is
// a local asset under public/. The previous `hostname: "**"` therefore bought
// nothing and let any URL the API returned be laundered through /_next/image,
// which is exactly what DEPLOY.md warned about.
function imagePatternFor(origin: string) {
  const url = new URL(origin);
  return {
    protocol: url.protocol === "https:" ? ("https" as const) : ("http" as const),
    hostname: url.hostname,
    port: url.port,
    // Scoped to the anonymous media endpoint: the optimizer deliberately does
    // not forward request headers, so no authenticated API path could be
    // optimized anyway.
    pathname: "/api/public/media/**",
  };
}

const remoteImageOrigins = Array.from(
  new Set([apiOrigin, PROD_API_ORIGIN, ...(isDev ? [DEV_API_ORIGIN] : [])]),
);

// script-src carries 'unsafe-inline' and that is not an oversight.
//
// Next streams hydration data as inline <script> tags (`bootstrapScriptContent`
// and the `self.__next_f.push(...)` chunks in app-render), and the only
// supported way to allow those without 'unsafe-inline' is a per-request nonce
// generated in proxy.ts. A nonce forces every route to render dynamically: the
// marketing pages here are prerendered with ISR (`revalidate` of 300/600 on the
// home, categories and expert pages, 3600 on the sitemap) and Next bakes the
// inline scripts — including the client-resume script it injects into static
// prerenders — into the cached HTML at build time. A nonce minted per request
// could never match that cached HTML, so the whole site would fail to hydrate
// on every cache hit. experimental.sri is not a way out either: SRI adds
// `integrity` to external bundle files and cannot cover inline scripts.
//
// So the inline allowance stays, and the compensating controls are that
// script-src names no host other than 'self' (an injected `<script src>` to an
// attacker origin is still blocked), plus object-src/base-uri/frame-ancestors
// below. Revisit if ISR is dropped from the marketing routes.
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  // frame-ancestors is the real clickjacking control; frame-src 'none' is the
  // other direction — this site embeds no third-party frames at all.
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  // 'unsafe-eval' in dev only: React uses eval to rebuild server stacks in the
  // browser, and the HMR runtime compiles modules the same way.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  // Unavoidable and low-risk: next/font injects a <style> block, and motion and
  // sonner animate through inline style attributes.
  "style-src 'self' 'unsafe-inline'",
  // next/font/google downloads the font files at build time and serves them from
  // /_next/static, so no Google Fonts origin is needed.
  "font-src 'self'",
  // data:/blob: cover next/image placeholders and client-side file previews.
  `img-src 'self' data: blob: ${apiOrigin}`,
  // Lesson videos and HLS playlists are served by the API; blob: is the
  // MediaSource URL hls.js attaches to the <video> element.
  `media-src 'self' blob: ${apiOrigin}`,
  // hls.js runs its demuxer in a Worker built from a Blob URL (injectWorker in
  // hls.js), which browsers check against worker-src rather than script-src.
  "worker-src 'self' blob:",
  // The browser talks to the API directly (axios baseURL) and opens the STOMP
  // notifications socket. In dev the extra ws://localhost:* is the HMR channel,
  // which runs on the Next port rather than the API port.
  `connect-src 'self' ${apiOrigin} ${wsOrigin}${isDev ? " ws://localhost:*" : ""}`,
  // Omitted on http deployments, where it would rewrite the plain-http API
  // calls the app is legitimately configured to make.
  ...(servesHttps ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Pre-CSP3 fallback for frame-ancestors 'none'.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // Severs window.opener both ways. Safe here because the portal hand-off in
  // LoginForm is a full navigation, not a popup that needs to talk back.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(servesHttps
    ? [
        {
          key: "Strict-Transport-Security",
          // 2 years. `includeSubDomains` is only safe once EVERY *.aztu.edu.az
          // host serves HTTPS — one http-only subdomain becomes unreachable in
          // any browser that has seen this header, and the pin outlives the
          // header being removed. No `preload` until that has been verified,
          // because getting off the preload list takes months.
          value: "max-age=63072000; includeSubDomains",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: remoteImageOrigins.map(imagePatternFor),
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    // The root layout is app/[lang]/layout.tsx (so <html lang> is rendered in
    // the page's language), which leaves no layout above [lang] for the
    // handful of URLs that match no route at all. app/global-not-found.tsx is
    // the documented answer for exactly that setup; this flag enables it.
    globalNotFound: true,
  },
  headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
