import { NextResponse } from "next/server";

/**
 * Any /api path without a handler of its own. Without this the path would be
 * tried as a locale ("api") by app/[lang], rejected there, and answered with
 * an HTML 404 page; an API path should answer like the rest of the API, in
 * JSON. The more specific routes beside it (auth, health) always win.
 */
function notFound() {
  return NextResponse.json(
    { status: 404, message: "Not found" },
    { status: 404, headers: { "Cache-Control": "no-store" } },
  );
}

export const GET = notFound;
export const POST = notFound;
export const PUT = notFound;
export const PATCH = notFound;
export const DELETE = notFound;
