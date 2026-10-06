// src/types/shared/nav.types.ts
//
// Deliberately its own file rather than an addition to `common.types.ts`: that one is
// re-exported through the `@/types` barrel, and `NavAccess` is a nav-layer concern that
// only `src/config/modules.ts` and `src/lib/nav/*` consume. Import it by direct path.

import type { UserRole } from "./user.types";

/** Raw org privileges, copied verbatim from `selectedOrg.privileges`. */
export interface NavPrivileges {
  isMember: boolean;
  isManager: boolean;
  /**
   * No `UserRole` maps to this. `userRoleAtom` (src/lib/store/auth.ts:71-80) drops it
   * entirely, so `isLeader` is readable ONLY here and via `usePermission().isLeader`.
   */
  isLeader: boolean;
  isAdmin: boolean;
  isTicketAgent: boolean;
  isTicketAdmin: boolean;
}

/**
 * The one shape every navigation surface filters against: the sidebar, the command
 * palette, and any future launcher.
 *
 * ⚠️ DISPLAY FILTERING ONLY. THIS HIDES LINKS. IT DOES NOT PROTECT PAGES OR DATA.
 *
 * Enforcement lives in three other places and none of them consult this:
 *   1. Backend endpoint guards (e.g. `requireFinance(caller)` in src/api/pdgms/finance.js)
 *   2. `requiredRoles` in src/config/routes/*, enforced by AuthProvider.tsx
 *   3. Layout gates: src/app/finance/layout.tsx, src/app/payroll/layout.tsx,
 *      src/app/garudavega/layout.tsx, src/components/shared/guards/OrgGuard.tsx
 *
 * Giving a module a `visible` predicate protects nothing. Same warning, same reason, as
 * `src/lib/hooks/finance/use-finance-role.ts:21-24`.
 */
export interface NavAccess {
  /** Collapsed role, for `MenuItem.roles` compatibility. isAdmin > isManager > isMember. */
  userRole: UserRole;
  /** Same flat-OR semantics as `useAuth().hasRole`. No hierarchy: ADMIN does not satisfy MANAGER. */
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  /**
   * RAW privileges on the SELECTED org. Use these, not `userRole`, when mirroring a
   * layout gate — `usePermission().isManager()` reads `privileges.isManager` and
   * excludes admins, while `userRole` collapses admin over manager. A predicate written
   * against `userRole` will disagree with the gate it is supposed to mirror.
   */
  privileges: NavPrivileges;
  /** `user.isAdministrator` — platform-level, orthogonal to per-org privileges. */
  isPlatformAdmin: boolean;
  /**
   * Named org roles, lowercased, unioned across ALL orgs. Surfaces in the
   * /api/v3/auth/me payload as `organizations[].memberships[].roles[]` — the only place
   * a named org role is readable on the client. Today: `finance` and `analyst`.
   */
  orgRoles: ReadonlySet<string>;
  hasOrgRole: (name: string) => boolean;
  orgId: string | null;
}
