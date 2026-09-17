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
| `INTERNAL_API_URL` | Server-side (RSC + proxy token refresh) backend URL. Inside a container network this is the **service name**, e.g. `http://backend:8080` — not `localhost`. |
| `REVALIDATE_SECRET` | Shared secret for on-demand revalidation. |
| `SENTRY_DSN` | Optional. |
| `PORT` / `HOSTNAME` | Preset to `3000` / `0.0.0.0` in the image. |

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

  The API must also be configured to trust these — see `TRUST_FORWARD_HEADERS` in
  the backend's `DEPLOY.md`, including the warning about firewalling its port.

## Notes

- `images.remotePatterns` is narrowed to the API origin plus localhost. Keep it
  that way: `hostname: "**"` turns the image optimizer into an open proxy for any
  URL the API returns. Add a CDN/S3 host explicitly if one is introduced.
- The build runs `next build` with `NODE_ENV=production` and telemetry disabled.
- `public/` and `.next/static` are copied explicitly; the standalone tracer does
  not include them.
