import { NextResponse } from "next/server";

// Liveness probe for the container / load balancer. Deliberately does NOT touch the
// backend: this answers "is this Next server up", not "is the whole platform up".
// A dependency check here would take the frontend out of rotation whenever the API
// blips, which is exactly when the static pages should keep serving.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { status: "ok", service: "eduplatform-frontend" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
