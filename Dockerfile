# syntax=docker/dockerfile:1
#
# EduPlatform public frontend (Next.js 16, App Router, output: "standalone").
#
# NEXT_PUBLIC_* are inlined into the client bundle by `next build`, so they are
# BUILD ARGS, not runtime env. Changing one requires a rebuild — a rebuilt image
# per environment is the intended model. INTERNAL_API_URL / REVALIDATE_SECRET are
# read on the server at request time and stay runtime env.
#
#   docker build \
#     --build-arg NEXT_PUBLIC_API_URL=https://api.example.com \
#     --build-arg NEXT_PUBLIC_SITE_URL=https://example.com \
#     --build-arg NEXT_PUBLIC_PORTAL_URL=https://portal.example.com \
#     --build-arg NEXT_PUBLIC_WS_URL=wss://api.example.com/ws/notifications \
#     -t eduplatform-frontend:latest .

# ─────────────────────────── Stage 1: dependencies ───────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Only the manifests, so this layer caches until dependencies actually change.
COPY package.json package-lock.json ./
RUN npm ci

# ─────────────────────────── Stage 2: build ──────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ARG NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws/notifications
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_PORTAL_URL=http://localhost:3001
ARG NEXT_PUBLIC_DEFAULT_LOCALE=en

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_PORTAL_URL=$NEXT_PUBLIC_PORTAL_URL \
    NEXT_PUBLIC_DEFAULT_LOCALE=$NEXT_PUBLIC_DEFAULT_LOCALE

# Running >1 replica? Pass a stable base64 AES key (16/24/32 bytes) so Server
# Function payloads encrypted by one instance decrypt on another, otherwise you get
# intermittent "Failed to find Server Action" errors behind a load balancer.
ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=""

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# The key is passed inline rather than via ENV so it is not persisted into this
# stage's image config (where `docker history` would show it). Next embeds it into
# the build output itself, which is what the runtime stage copies.
RUN NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY" npm run build

# ─────────────────────────── Stage 3: runtime ────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 nextjs

# `standalone` ships its own minimal server.js plus only the traced node_modules.
# public/ and .next/static are NOT copied by the tracer — server.js serves them
# once they are placed at these exact paths.
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static    ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public          ./public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
