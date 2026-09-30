/**
 * ONE_TIME is an in-person training that happens once: a single date with a
 * start and an end time. It is in person everywhere OFFLINE is (seats, venue,
 * classroom hours) and carries its schedule in the same `offlineDetails`.
 */
export type CourseType = "ONLINE" | "OFFLINE" | "ONE_TIME";

/** Every format, in the order filters list them. */
export const COURSE_TYPES: readonly CourseType[] = ["ONLINE", "OFFLINE", "ONE_TIME"];

/** OFFLINE and ONE_TIME: taught in a room, with seats and an address. */
export const isInPerson = (type: CourseType) => type !== "ONLINE";

export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL";
export type CourseStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "PUBLISHED"
  | "REJECTED"
  | "ARCHIVED";
/** Catalogue duration filter, in the buckets the API understands. */
export type DurationBucket = "lt2" | "2to6" | "6to17" | "gt17";
export type LessonContentType =
  | "VIDEO"
  | "TEXT"
  | "PDF"
  | "QUIZ"
  | "LIVE_SESSION";

export type CourseSummary = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  courseType: CourseType;
  level: CourseLevel;
  language: string;
  free: boolean;
  price: string;
  currency: string;
  status: CourseStatus;
  ratingAvg: string;
  ratingCount: number;
  enrolledCount: number;
  tutorId: string;
  tutorDisplayName: string;
  publishedAt?: string | null;
  /**
   * Total course length in seconds — video time for ONLINE, classroom hours for
   * OFFLINE and ONE_TIME. Null while the course has no detail row yet.
   */
  totalDurationSec: number | null;
  /** Media path (`/api/public/media/{id}/content`); resolve with `mediaSrc()`. */
  thumbnailUrl: string | null;
};

export type Lesson = {
  id: string;
  title: string;
  description?: string | null;
  contentType: LessonContentType;
  videoUrl?: string | null;
  durationSeconds: number;
  orderIndex: number;
  preview: boolean;
};

export type CourseModule = {
  id: string;
  title: string;
  description?: string | null;
  orderIndex: number;
  lessons: Lesson[];
};

export type OnlineDetails = {
  totalVideoSeconds: number;
  hasCertificate: boolean;
  dripEnabled: boolean;
};

/**
 * The in-person part of an OFFLINE or ONE_TIME course. The API sends the hours
 * as numbers (BigDecimal); the sample content writes them as strings.
 */
export type OfflineDetails = {
  startDate?: string | null;
  /** A ONE_TIME course's is its startDate: it takes place on a single day. */
  endDate?: string | null;
  /** "HH:mm" or "HH:mm:ss". Required for ONE_TIME, optional for OFFLINE. */
  startTime?: string | null;
  endTime?: string | null;
  /** Null for ONE_TIME, which has no weekly rhythm. */
  weeklyHours?: string | number | null;
  /** For ONE_TIME the API derives it from the time range. */
  totalHours?: string | number | null;
  studentLimit: number;
  enrolledCount: number;
  city?: string | null;
  addressLine?: string | null;
};

/**
 * One entry of a course's programme, in display order. The description is
 * rich text (see src/lib/rich-text.server.ts).
 */
export type SyllabusItem = {
  title: string;
  description?: string | null;
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  /**
   * The next three, every syllabus item's description and module and lesson
   * descriptions are rich text: sanitized HTML from the dashboard's editor, or
   * plain text on older courses. Render them with <RichText>, and put them in
   * metadata or JSON-LD only through richTextToPlain().
   */
  description?: string | null;
  requirements?: string | null;
  learningOutcomes?: string | null;
  /** The legacy free-text programme; shown only when syllabusItems is empty. */
  syllabus?: string | null;
  /** Always an array from an API that has it; absent from older ones. */
  syllabusItems?: SyllabusItem[] | null;
  thumbnailMediaId?: string | null;
  trailerMediaId?: string | null;
  courseType: CourseType;
  level: CourseLevel;
  language: string;
  free: boolean;
  price: string;
  currency: string;
  status: CourseStatus;
  publishedAt?: string | null;
  ratingAvg: string;
  ratingCount: number;
  enrolledCount: number;
  tutorId: string;
  tutorDisplayName: string;
  categoryIds: string[];
  tagIds: string[];
  onlineDetails?: OnlineDetails | null;
  offlineDetails?: OfflineDetails | null;
  modules: CourseModule[];
};

/**
 * Query for `GET /api/public/courses`. Every field is a server-side filter and
 * all of them combine, the free-text `q` included — nothing is post-filtered in
 * the browser, so a filtered page 2 is as correct as page 1.
 */
export type CourseListParams = {
  q?: string;
  type?: CourseType;
  categoryId?: string;
  level?: CourseLevel;
  language?: string;
  free?: boolean;
  priceMin?: number;
  priceMax?: number;
  ratingMin?: number;
  durationBucket?: DurationBucket;
  page?: number;
  size?: number;
  sort?: string;
};
