/*
 * The shape of a university room on the public website ("Our classrooms").
 *
 * There is no public rooms API yet (the portal's /api/portal/rooms needs the
 * room:read permission and bookings need room:book, i.e. experts in the
 * dashboard), so today every room is sample content from ./data.ts. The types
 * are kept close to what a public endpoint would return, so the pages will not
 * change when one exists — only ./source.server.ts will.
 */

export type RoomKind = "LECTURE" | "COMPUTER_LAB" | "ENGINEERING_LAB" | "SEMINAR" | "CONFERENCE" | "STUDIO";

export type Room = {
  id: string; slug: string;            // slug e.g. "b1-204-komputer-laboratoriyasi"
  name: string;                        // Azerbaijani display name, e.g. "Kompüter laboratoriyası 204"
  kind: RoomKind;
  building: string; buildingCode: string; floor: number; roomNumber: string;
  capacity: number; areaM2: number;
  hue: "it" | "data" | "eng" | "biz" | "res" | "build" | "trans" | "energy" | "navy" | "gold"; // .k-* class family
  photo?: string;                      // a real photo of this room, once one exists; otherwise the generated floor plan is used
  summary: string;                     // one line for cards
  description: string[];               // 2–3 paragraphs for the detail page
  equipment: string[];                 // "Proyektor", "32 iş stansiyası (Intel i7, 32 GB)", …
  amenities: ("PROJECTOR"|"SMART_BOARD"|"COMPUTERS"|"AUDIO"|"VIDEO_CONF"|"AIR_CON"|"ACCESSIBLE"|"WIFI"|"LAB_BENCHES"|"WHITEBOARD")[];
  layout: "THEATRE" | "CLASSROOM" | "U_SHAPE" | "LAB" | "BOARDROOM";
  openHours: { weekday: [string, string]; saturday: [string, string] | null }; // "08:30","20:00"; Sunday closed
  rules: string[];                     // booking rules shown on the detail page
  coords: { lat: number; lng: number };// AzTU main campus, H. Cavid pr. 25 area (~40.3777, 49.8520) — small offsets per building
};

export type BusySlot = { date: string /* YYYY-MM-DD */; start: string /* HH:MM */; end: string; title: string;
  kind: "CLASS" | "EXAM" | "EVENT" | "MAINTENANCE" | "BOOKING" };

// ---------------------------------------------------------------- derived names
// Convenience aliases and value lists for filters, legends and translation
// keys (rooms.kind_<KIND>, rooms.amenity_<AMENITY>, …). They are derived from
// the contract above, so they can never drift from it.

export type RoomHue = Room["hue"];
export type RoomAmenity = Room["amenities"][number];
export type RoomLayout = Room["layout"];
export type SlotKind = BusySlot["kind"];

/** Why a room takes no bookings on a day (see closedReason in ./schedule.ts). */
export type ClosedReason = "SUNDAY" | "SATURDAY" | "HOLIDAY";

/** A day at a glance, for calendar cells and card badges (see dayStatus). */
export type DayStatus = "CLOSED" | "FREE" | "PARTIAL" | "BUSY" | "FULL";

/** A bookable window on one day. */
export type FreeWindow = { start: string /* HH:MM */; end: string };

/** Why a requested reservation cannot be accepted (see reservationProblem). */
export type ReservationProblem =
  | "INVALID"       // missing or malformed date / time
  | "PAST"          // the start is before now (Baku time)
  | "TOO_FAR"       // further ahead than the calendar shows
  | "CLOSED"        // Sunday, holiday, or a Saturday the room is shut
  | "OUTSIDE_HOURS" // starts before opening or ends after closing
  | "TOO_SHORT"     // shorter than 30 minutes (or end before start)
  | "TOO_LONG"      // longer than 8 hours
  | "CONFLICT"      // overlaps a busy slot
  | "CAPACITY";     // more attendees than seats

export const ROOM_KINDS: RoomKind[] = ["LECTURE", "COMPUTER_LAB", "ENGINEERING_LAB", "SEMINAR", "CONFERENCE", "STUDIO"];
export const ROOM_AMENITIES: RoomAmenity[] = [
  "PROJECTOR", "SMART_BOARD", "COMPUTERS", "AUDIO", "VIDEO_CONF", "AIR_CON", "ACCESSIBLE", "WIFI", "LAB_BENCHES", "WHITEBOARD",
];
export const ROOM_LAYOUTS: RoomLayout[] = ["THEATRE", "CLASSROOM", "U_SHAPE", "LAB", "BOARDROOM"];
export const SLOT_KINDS: SlotKind[] = ["CLASS", "EXAM", "EVENT", "MAINTENANCE", "BOOKING"];
