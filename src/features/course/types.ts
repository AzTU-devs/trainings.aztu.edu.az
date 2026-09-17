export type CourseType = "ONLINE" | "OFFLINE";
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
   * OFFLINE. Null while the course has no detail row yet.
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

export type OfflineDetails = {
  startDate?: string | null;
  endDate?: string | null;
  weeklyHours: string;
  totalHours: string;
  studentLimit: number;
  enrolledCount: number;
  city?: string | null;
  addressLine?: string | null;
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  requirements?: string | null;
  learningOutcomes?: string | null;
  syllabus?: string | null;
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
