# Deploying `eduplatform-frontend`

Next.js 16 App Router, `output: "standalone"`. The image runs the traced minimal
server (`node server.js`) as a non-root user on port 3000.

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.com \
  --build-arg NEXT_PUBLIC_SITE_URL=https://example.com \
  --build-arg NEXT_PUBLIC_PORTAL_URL=https://portal.example.com \
  --build-arg NEXT_PUBLIC_WS_URL=wss://api.example.com/ws/notifications \
  -t eduplatform-frontend:latest .

docker run -p 3000:3000 -e INTERNAL_API_URL=http://backend:8080 \
  -e REVALIDATE_SECRET=... eduplatform-frontend:latest
```

## Build-time vs runtime env — this is the part that bites

`NEXT_PUBLIC_*` values are **inlined into the client bundle by `next build`**.
Setting them with `docker run -e` does nothing; the browser bundle already has
the old value baked in. They must be `--build-arg`, which means **one image per
environment**.

| Build arg (`--build-arg`) | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Browser → backend origin |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8080/ws/notifications` | STOMP notifications socket |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Canonical/OG URLs |
| `NEXT_PUBLIC_PORTAL_URL` | `http://localhost:3001` | Tutor/admin portal link target |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `en` | Fallback for locale negotiation |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | *(empty)* | See multi-replica note below |

| Runtime env (`-e` / `environment:`) | Purpose |
| --- | --- |
| `INTERNAL_API_URL` | Server-side (RSC + proxy token refresh) backend URL, including the scheme. Inside a container network this is the **service name**, e.g. `http://backend:8080` — not `localhost`. Under `docker-compose.prod.yml` (host networking) it is `http://127.0.0.1:8080`. |
| `REVALIDATE_SECRET` | Shared secret for on-demand revalidation. |
| `SENTRY_DSN` | Optional. An empty `SENTRY_DSN=` (the `.env.example` default) is the same as leaving it out. |
| `PORT` / `HOSTNAME` | Preset to `3000` / `0.0.0.0` in the image. |

`src/lib/env.ts` validates every variable above, and every `NEXT_PUBLIC_*`,
**on its own**. An empty value means unset. An invalid value is logged once as
`Invalid <NAME> (<rule>); treating it as unset.` and replaced by that variable's
own default; the other variables are unaffected. The log never includes the
value, because `SENTRY_DSN` and `REVALIDATE_SECRET` are secrets.

This used to be all-or-nothing. An empty `SENTRY_DSN=` failed URL validation and
the fallback discarded `INTERNAL_API_URL` along with it, so SSR and every
`app/api/auth/*` route silently called the API through its public hostname (the
server's own NAT hairpin) instead of `127.0.0.1:8080`. The client side had the
same flaw: one bad `NEXT_PUBLIC_*` reset `NEXT_PUBLIC_API_URL` to
`http://localhost:8080` in the browser bundle. An existing `.env` needs no
change. If the log shows the warning for `INTERNAL_API_URL`, fix it, because
until you do, server-side calls go to `NEXT_PUBLIC_API_URL`.

## Running more than one replica

Next encrypts Server Function closures with a per-build key. With several
instances behind a load balancer, a payload encrypted by one cannot be decrypted
by another — surfacing as intermittent *"Failed to find Server Action"* errors.
Pass a stable base64 AES key (16/24/32 bytes) at build time:

```bash
--build-arg NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=$(openssl rand -base64 32)
```

Use the same key for every replica of the same release.

## Health

`GET /api/health` → `{"status":"ok"}`. It is a **liveness** probe only: it does
not call the backend on purpose, so an API blip does not pull the frontend out of
rotation exactly when its static pages are the most useful thing still serving.

`proxy.ts` short-circuits `/api/*` before locale redirection, so the probe is not
redirected to `/en/api/health`.

## TLS / reverse proxy

**No TLS configuration ships in this repo.** `docker-compose.prod.yml` uses
`network_mode: host`, so the app binds `PORT` (3000) on the host over plain HTTP.
Certificates, HSTS and the `http → https` redirect belong to the reverse proxy in
front of it.

One requirement is easy to miss and fails silently:

- **The proxy must set `X-Real-IP $remote_addr`.**

  Auth calls from the browser go to this app's BFF (`app/api/auth/*`), which then
  calls the API server-to-server. The API rate-limits those endpoints per client
  IP, so the BFF forwards the caller's address — and it trusts `X-Real-IP` for it,
  because a client can prepend its own `X-Forwarded-For` entry and nginx's usual
  `$proxy_add_x_forwarded_for` appends rather than replaces.

  Without that header every visitor shares one bucket, and the symptoms are
  bizarre rather than obviously a misconfiguration: the 11th login *site-wide* in
  a minute is refused, the 4th password-reset request in an hour is refused, and
  one attacker can lock out every student at once.

  ```nginx
  proxy_set_header X-Real-IP         $remote_addr;
  proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  ```

  The API needs no flag of its own for this. It resolves the client address with
  Tomcat's `RemoteIpValve` (`server.forward-headers-strategy=native`), which
  honours `X-Forwarded-For` only on connections from loopback or private-range
  addresses, and this BFF reaches it over `127.0.0.1`. `TRUST_FORWARD_HEADERS` no
  longer has any effect. See the backend's `DEPLOY.md` for why its port must stay
  firewalled.

## Notes

- **Course thumbnails are served unoptimized.** `CourseCard` passes
  `unoptimized` to `next/image`, so the browser loads
  `<NEXT_PUBLIC_API_URL>/api/public/media/{id}/content` itself. The Next server
  never fetches the API's public hostname for an image. When thumbnails went
  through `/_next/image` it had to, and that can break in two ways. Next refuses
  an upstream hostname that resolves to a private IP (split DNS or `/etc/hosts`),
  and without a NAT hairpin the fetch times out. Either one leaves every course
  card with a broken image while the API itself is healthy.
  Nothing else needs configuring. The API sends
  `Cache-Control: public, max-age=86400, immutable` and an ETag for these, and CSP
  `img-src` in `next.config.ts` allows the API origin. That origin is derived from
  `NEXT_PUBLIC_API_URL`, the same value `mediaSrc()` builds the URL from.
  The trade-off is that thumbnails reach the browser at their uploaded size, up to
  the API's image limit (10 MB by default). Upload covers at web size (about 1280 px
  wide), not as camera originals.
- `images.remotePatterns` is narrowed to the API origin plus localhost. Keep it
  that way: `hostname: "**"` turns the image optimizer into an open proxy for any
  URL the API returns. If a CDN/S3 host is introduced for media, add it to CSP
  `img-src` in `next.config.ts`, since unoptimized images are fetched by the
  browser. Add it to `remotePatterns` only if its images will go through the
  optimizer.
- The build runs `next build` with `NODE_ENV=production` and telemetry disabled.
- `public/` and `.next/static` are copied explicitly; the standalone tracer does
  not include them.
