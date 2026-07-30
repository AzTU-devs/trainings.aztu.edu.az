export type EnrollmentStatus =
  | "PENDING_PAYMENT"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export type EnrollmentSource = "PURCHASE" | "FREE" | "ADMIN_GRANT";

export type Enrollment = {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  status: EnrollmentStatus;
  source: EnrollmentSource;
  enrolledAt: string;
  completedAt?: string | null;
  progressPercent: number;
  lastAccessedAt?: string | null;
};

export type LessonProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export type LessonProgress = {
  lessonId: string;
  status: LessonProgressStatus;
  positionSec: number;
  completedAt?: string | null;
  updatedAt?: string | null;
};

export type LessonProgressUpdate = {
  status: LessonProgressStatus;
  positionSec: number;
};
