// src/lib/store/auth.ts
import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { AuthState, UserRole } from "@/types";
import type { ProgramMembership } from "@/types/shared/user.types";
import type { NavAccess, NavPrivileges } from "@/types/shared/nav.types";
import { matchesRole } from "@/lib/auth/role-match";

// ============================================
// PRIMARY AUTH ATOM (Persisted — selection only)
// ============================================
// auth-refactor Step 5: the server-verified /api/auth/session query is the
// single source of truth for identity. We persist ONLY the user's selection
// (org/dept/program) for UX continuity across reloads, and NEVER hydrate
// user/isAuthenticated/loading from storage — those must always be re-derived
// from the server. Persisting them produced a "ghost authenticated" state on a
// logged-out browser (stale isAuthenticated:true → spurious authed queries and
// bounce-through redirects before the session check resolved).
// SSR-safe: localStorage only exists in the browser. On the server the getter
// returns undefined and createJSONStorage falls back to the initial value.
const authStorage = createJSONStorage<AuthState>(
  // Cast keeps the sync-storage overload (the getter may return undefined on the
  // server; createJSONStorage null-checks it internally, so this is type-only).
  () => (typeof window !== "undefined" ? window.localStorage : undefined) as Storage,
);
const persistedGetItem = authStorage.getItem.bind(authStorage);
authStorage.getItem = (key, initialValue) => {
  const stored = persistedGetItem(key, initialValue) as AuthState;
  return { ...stored, user: null, isAuthenticated: false, loading: false };
};

export const authAtom = atomWithStorage<AuthState>(
  "auth",
  {
    user: null,
    selectedOrgId: null,
    selectedDeptId: null,
    selectedProgramId: null,
    isAuthenticated: false,
    loading: false,
  },
  authStorage,
  { getOnInit: true }
);

// ============================================
// DERIVED ATOMS (Read-only, Computed)
// ============================================
export const userAtom = atom((get) => get(authAtom).user);

export const selectedOrgAtom = atom((get) => {
  const { user, selectedOrgId } = get(authAtom);
  if (!user?.organizations.length) return null;

  // Return selected org or first org by default
  return (
    user.organizations.find((org) => org.orgId === selectedOrgId) ||
    user.organizations[0]
  );
});

export const selectedDeptAtom = atom((get) => {
  const { selectedDeptId } = get(authAtom);
  const selectedOrg = get(selectedOrgAtom);
  if (!selectedOrg?.deparments?.length) return null;

  // Return selected department if set
  return selectedDeptId
    ? selectedOrg.deparments.find((dept) => dept._id === selectedDeptId) || null
    : null;
});

export const userRoleAtom = atom((get) => {
  const org = get(selectedOrgAtom);
  if (!org?.privileges) return UserRole.USER;

  if (org.privileges.isAdmin) return UserRole.ADMIN;
  if (org.privileges.isManager) return UserRole.MANAGER;
  if (org.privileges.isMember) return UserRole.MEMBER;

  return UserRole.USER;
});

export const ticketRoleAtom = atom((get) => {
  const org = get(selectedOrgAtom);
  if (!org?.privileges) return { isTicketAgent: false, isTicketAdmin: false };
  return {
    isTicketAgent: org.privileges.isTicketAgent === true,
    isTicketAdmin: org.privileges.isTicketAdmin === true,
  };
});

// ============================================
// NAV ACCESS (derived — display filtering only)
// ============================================
// One shape for every navigation surface to filter against: the sidebar, the command
// palette, and any future launcher. A derived atom rather than a hook so the value is
// referentially stable per store — the palette memoises a ~200-entry index on it.
//
// ⚠️ THIS HIDES LINKS. IT DOES NOT PROTECT PAGES. See the warning block on NavAccess
// in src/types/shared/nav.types.ts for where enforcement actually lives.

/** The runtime shape of a membership. The typed `Membership` declares a singular
 *  `role`, but /api/v3/auth/me returns `roles[]`. Same cast as use-finance-role.ts:7. */
type MembershipWithRoles = { roles?: { name?: string }[] };

export const navAccessAtom = atom<NavAccess>((get) => {
  const { user } = get(authAtom);
  const org = get(selectedOrgAtom);
  const userRole = get(userRoleAtom);
  const ticketRole = get(ticketRoleAtom);

  const privileges: NavPrivileges = {
    isMember: org?.privileges?.isMember === true,
    isManager: org?.privileges?.isManager === true,
    isLeader: org?.privileges?.isLeader === true,
    isAdmin: org?.privileges?.isAdmin === true,
    isTicketAgent: ticketRole.isTicketAgent,
    isTicketAdmin: ticketRole.isTicketAdmin,
  };

  // Unioned across ALL orgs, not just the selected one — matching the existing
  // semantics of useFinanceRole/useOutreachRole, which the finance layout gate uses.
  const orgRoles = new Set<string>();
  for (const o of user?.organizations ?? []) {
    for (const m of (o as { memberships?: MembershipWithRoles[] }).memberships ?? []) {
      for (const r of m.roles ?? []) {
        if (r?.name) orgRoles.add(r.name.toLowerCase());
      }
    }
  }

  return {
    userRole,
    hasRole: (roles) => matchesRole(roles, { userRole, ...ticketRole }),
    privileges,
    isPlatformAdmin: user?.isAdministrator === true,
    orgRoles,
    hasOrgRole: (name) => orgRoles.has(name.toLowerCase()),
    orgId: org?.orgId ?? null,
  };
});

// Non-persisted: populated by useAuth when employees/me resolves
export const currentProgramsAtom = atom<ProgramMembership[]>([]);

// ============================================
// UI STATE
// ============================================
export const sidebarOpenAtom = atom(false);

export interface SidebarOverrideItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  path?: string;
  children?: Omit<SidebarOverrideItem, "children" | "icon">[];
}

export const sidebarOverrideAtom = atom<{
  moduleName: string;
  navItems: SidebarOverrideItem[];
} | null>(null);

export const tourDayAtom = atom<{ currentDay: number; totalDays: number } | null>(null);
