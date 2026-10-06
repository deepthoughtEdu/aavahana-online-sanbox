// src/lib/auth/role-match.ts
import { UserRole } from "@/types";

/**
 * Role matching, extracted verbatim from `useAuth().hasRole` so the nav layer and
 * the 61 existing `useAuth()` call sites share one implementation.
 *
 * Semantics are deliberately unchanged and deliberately FLAT: there is no hierarchy,
 * so `matchesRole([MANAGER], { userRole: ADMIN })` is `false`. `userRoleAtom` collapses
 * privileges in the order isAdmin > isManager > isMember, which means an admin never
 * reports MANAGER even when `privileges.isManager` is true. Anything that needs to
 * mirror a layout gate must read the raw booleans on `NavAccess.privileges` instead.
 */
export function matchesRole(
  roles: UserRole | UserRole[],
  ctx: { userRole: UserRole; isTicketAgent: boolean; isTicketAdmin: boolean },
): boolean {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  if (roleArray.includes(ctx.userRole)) return true;
  if (roleArray.includes(UserRole.TICKET_AGENT) && ctx.isTicketAgent) return true;
  if (roleArray.includes(UserRole.TICKET_ADMIN) && ctx.isTicketAdmin) return true;
  return false;
}
