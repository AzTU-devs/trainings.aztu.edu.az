import { CalendarClock, MapPin, MonitorPlay, type LucideIcon } from "lucide-react";
import type { CourseType } from "./types";

/**
 * The icon a course format is drawn with, wherever the format is named — card
 * pills, the course page's facts, the catalogue filter and the hero search —
 * so a one-time training reads the same everywhere. A plain map, not a
 * component, so server and client components can both use it.
 */
export const FORMAT_ICON: Record<CourseType, LucideIcon> = {
  ONLINE: MonitorPlay,
  OFFLINE: MapPin,
  ONE_TIME: CalendarClock,
};
