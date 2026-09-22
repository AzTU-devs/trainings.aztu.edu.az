import "server-only";
import { SHOWCASE } from "@/features/showcase/flag";
import { ROOMS, roomBySlug } from "./data";
import type { Room } from "./types";

/*
 * The one place the public rooms pages get rooms from.
 *
 * Today every room is SAMPLE content (./data.ts): there is no public rooms
 * API — the portal's /api/portal/rooms needs room:read and bookings need
 * room:book, so real rooms are booked by experts in the dashboard. The rooms
 * therefore follow the showcase flag like the rest of the sample catalogue:
 * with SHOWCASE_DATA=off there is nothing honest to show, so these return
 * [] / null and the pages show their "coming soon" state instead of fake rooms.
 *
 * While rooms come from here they are always sample rooms, so the reserve flow
 * must say that no reservation was sent and point experts to the dashboard.
 * The functions are async so a real public endpoint can replace the body
 * without the pages changing.
 */

/** All rooms to list, in display order; [] when the sample content is off. */
export async function listRooms(): Promise<Room[]> {
  return SHOWCASE ? ROOMS : [];
}

/** One room by slug; null when unknown or when the sample content is off. */
export async function getRoom(slug: string): Promise<Room | null> {
  return SHOWCASE ? roomBySlug(slug) : null;
}
