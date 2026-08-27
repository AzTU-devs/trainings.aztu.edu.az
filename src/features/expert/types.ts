/**
 * The backend calls this domain "tutor" (role `TUTOR`, `/api/public/tutors/:id`,
 * `TutorProfileDto`). The product calls these people **experts**, so the
 * frontend speaks that language everywhere; only the endpoint paths and the
 * role constant keep the backend's word.
 */

export type ExpertApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

/** Mirrors the backend `TutorProfileDto`. */
export type ExpertProfile = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  headline?: string | null;
  bio?: string | null;
  yearsExperience?: number | null;
  websiteUrl?: string | null;
  linkedinUrl?: string | null;
  approvalStatus: ExpertApprovalStatus;
  approvedAt?: string | null;
  ratingAvg: string;
  ratingCount: number;
  expertiseCategoryIds: string[];
};

/**
 * A directory entry, aggregated from the published catalogue rather than
 * fetched — see `directory.server.ts` for why.
 */
export type ExpertSummary = {
  id: string;
  displayName: string;
  courseCount: number;
  /** Enrolment-weighted mean across the expert's published courses. */
  ratingAvg: number;
  ratingCount: number;
  enrolledCount: number;
  /** Distinct subject areas, derived from course titles' course types. */
  online: boolean;
  offline: boolean;
};

export const fullExpertName = (
  e: Pick<ExpertProfile, "firstName" | "lastName">,
) => `${e.firstName} ${e.lastName}`.trim();

export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
