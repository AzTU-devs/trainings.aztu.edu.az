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
  avatarMediaId?: string | null;
  /**
   * Media path (`/api/public/media/{id}/content`); resolve with `mediaSrc()`.
   * The API serves it anonymously only while the expert is APPROVED.
   */
  avatarUrl?: string | null;
  /** e.g. "Associate Professor", "Dosent". */
  academicTitle?: string | null;
  department?: string | null;
  /** Free text, one qualification per line. */
  education?: string | null;
  /** Free text, one certification per line. */
  certifications?: string | null;
  /** Free text, e.g. "Azerbaijani, English, Russian". */
  languages?: string | null;
  googleScholarUrl?: string | null;
  researchGateUrl?: string | null;
  /** The bare iD, `0000-0000-0000-000X`, not a URL. */
  orcid?: string | null;
  githubUrl?: string | null;
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
  /**
   * Copied from the expert's public profile when it loads. The catalogue the
   * directory is built from carries none of these, so each may be absent.
   */
  avatarUrl?: string | null;
  academicTitle?: string | null;
  department?: string | null;
  headline?: string | null;
};

export const fullExpertName = (
  e: Pick<ExpertProfile, "firstName" | "lastName">,
) => `${e.firstName} ${e.lastName}`.trim();

export function initialsOf(name: string) {
  return (
    name
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      // Azerbaijani dotted/dotless i, mapped by hand: toUpperCase() turns "i"
      // into "I", and toLocaleUpperCase("az") depends on locale data that
      // browsers may lack, which would print different text on the server and
      // in the browser.
      .replace(/i/g, "İ")
      .replace(/ı/g, "I")
      .toUpperCase()
  );
}
