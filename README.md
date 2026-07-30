# EduPlatform — student / public web app

The public-facing learning site for AZTU EduPlatform: course catalog, course detail,
checkout, and the authenticated student area (dashboard, my courses, orders,
certificates, notifications, profile/settings, and the lesson player).

Tutors and admins sign in through the separate **portal** app — this app redirects
those accounts to `NEXT_PUBLIC_PORTAL_URL`.

## Stack

- **Next.js 16** (App Router, Turbopack) — note `proxy.ts` is the middleware entry,
  and route `params` / `searchParams` are Promises.
- **React 19**, TypeScript
- **Tailwind CSS v4**
- **Redux Toolkit** (auth/cart/player/ui state) + **TanStack Query** (server cache)
- **axios** for browser → API calls; native `fetch` for server components
- **zod** + **react-hook-form** for forms
- Custom lightweight i18n (`en`, `az`) under `src/i18n` with messages in `messages/*.json`

## Getting started

```bash
npm install
cp .env.example .env.local   # then edit values
npm run dev                  # http://localhost:3000
```

The backend (Spring Boot) must be reachable at `NEXT_PUBLIC_API_URL`
(default `http://localhost:8080`, dev seed password `Password123!`).

## Scripts

| Command         | Purpose                              |
| --------------- | ------------------------------------ |
| `npm run dev`   | Dev server (Turbopack)               |
| `npm run build` | Production build + type check        |
| `npm run start` | Serve the production build           |
| `npm run lint`  | ESLint                               |

## Environment

See `.env.example`. Key variables:

- `NEXT_PUBLIC_API_URL` — backend base URL used by the browser.
- `INTERNAL_API_URL` — backend base URL used by server components / the BFF
  (falls back to `NEXT_PUBLIC_API_URL`).
- `NEXT_PUBLIC_SITE_URL` — canonical origin (used for metadata, `sitemap.ts`, `robots.ts`).
- `NEXT_PUBLIC_PORTAL_URL` — tutor/admin portal, where non-student accounts are sent.
- `NEXT_PUBLIC_WS_URL` — STOMP/WebSocket endpoint for live notifications.

## Auth model

Authentication goes through a thin **BFF** under `app/api/auth/*`:

- On login / register, the BFF stores the refresh token (`ep_rt`) and access token
  (`ep_at`) as httpOnly cookies. Server components read `ep_at` to call the API with
  a Bearer token; the browser keeps its own in-memory copy.
- `proxy.ts` handles locale detection/redirects and gates the private routes by the
  presence of the session cookies.
- The axios client refreshes the access token via `/api/auth/refresh-session` on 401.

## Project layout

```
app/                 App Router routes (grouped: (marketing), (auth), (student), checkout)
  api/auth/          BFF session routes (login/register/refresh/logout)
  sitemap.ts         Generated sitemap (static routes + published courses)
  robots.ts          Robots policy (private areas disallowed)
src/
  lib/api/           server fetch, axios client, endpoint map
  lib/auth/          session/token helpers, role gating
  features/          domain modules (course, category, auth, enrollment, learning, …)
  components/        shared UI + layout
  i18n/              locale config, dictionaries, formatter
messages/            en.json / az.json (kept key-for-key identical)
proxy.ts             Next 16 middleware (locale + auth gating)
docs/BACKEND_GAPS.md endpoints the frontend still needs from the backend
```

## Known backend gaps

Some features are honest stubs because the backend does not expose them yet:
password reset / email verification, signed media manifests, and Stripe charging.
See `docs/BACKEND_GAPS.md` for the full list.
