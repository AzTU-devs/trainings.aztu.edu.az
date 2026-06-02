export type TutorApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

export type TutorProfile = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  headline?: string | null;
  bio?: string | null;
  yearsExperience?: number | null;
  websiteUrl?: string | null;
  linkedinUrl?: string | null;
  approvalStatus: TutorApprovalStatus;
  approvedAt?: string | null;
  ratingAvg: string;
  ratingCount: number;
  expertiseCategoryIds: string[];
};

export const fullTutorName = (t: Pick<TutorProfile, "firstName" | "lastName">) =>
  `${t.firstName} ${t.lastName}`.trim();
