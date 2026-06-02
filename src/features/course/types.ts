export type CourseType = "ONLINE" | "OFFLINE";
export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL";
export type CourseStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "PUBLISHED"
  | "REJECTED"
  | "ARCHIVED";
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

export type CourseListParams = {
  type?: CourseType;
  page?: number;
  size?: number;
  sort?: string;
};
