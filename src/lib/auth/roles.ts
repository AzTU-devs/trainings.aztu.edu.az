import type { User } from "@/types/user";

/**
 * Roles that must sign in through the portal (React) app, not the public site.
 * A freshly self-registered tutor only holds USER until an admin approves them,
 * so they can still use the public site until the TUTOR role is granted.
 */
export const PORTAL_ROLES = ["TUTOR", "ADMIN", "SUPER_ADMIN"] as const;

export function isPortalUser(roles: string[] | undefined | null): boolean {
  if (!roles) return false;
  return roles.some((r) => (PORTAL_ROLES as readonly string[]).includes(r));
}

export function userIsPortalOnly(user: Pick<User, "roles">): boolean {
  return isPortalUser(user.roles);
}
