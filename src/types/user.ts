export type UserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED" | "PENDING";

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  locale?: string | null;
  status: UserStatus;
  emailVerified: boolean;
  lastLoginAt?: string | null;
  roles: string[];
  permissions: string[];
};

export const fullName = (u: Pick<User, "firstName" | "lastName">) =>
  `${u.firstName} ${u.lastName}`.trim();
