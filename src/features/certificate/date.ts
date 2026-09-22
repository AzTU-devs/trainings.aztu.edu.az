/**
 * The calendar date in Baku of an instant (now by default) as YYYY-MM-DD, for
 * the server to pass down. Azerbaijan keeps UTC+4 all year (no daylight
 * saving since 2016), so a fixed offset is exact and needs no time-zone data.
 * Unlike nowInBaku in the rooms feature it takes any instant, which the
 * participant preview needs for the day a course was finished.
 */
export function bakuDateISO(ms: number = Date.now()): string {
  return new Date(ms + 4 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" from a date or date-time string, or null when it is not one. */
export function isoDay(value: string | null | undefined): string | null {
  const day = value?.slice(0, 10) ?? "";
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}
