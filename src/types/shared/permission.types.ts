// src/types/permission.types.ts

import { Permission, PermissionCategory } from "@/config/permissions";
import { RoleKey } from "@/config/role-permissions";

/**
 * Type for permission check result
 */
export type PermissionCheckResult = boolean;

/**
 * Type for organizational role check options
 */
export interface OrgRoleCheckOptions {
  orgId?: string;
}

/**
 * Type for department role check options
 */
export interface DeptRoleCheckOptions {
  deptId?: string;
}

/**
 * Hook return type for usePermission
 */
export interface UsePermissionReturn {
  // Permission checks
  canAccess: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;

  // Organizational role checks
  isManager: (orgId?: string) => boolean;
  isAnyManager: () => boolean;
  isManagerOf: () => string[];

  // Department role checks
  isDepartmentManager: (deptId?: string) => boolean;
  isAnyDepartmentManager: () => boolean;
  isDepartmentManagerOf: () => string[];

  // Additional role checks
  isAdmin: (orgId?: string) => boolean;
  isAnyAdmin: () => boolean;
  isLeader: (orgId?: string) => boolean;

  // Context information
  userRole: import("@/types").UserRole;
  selectedOrg: import("@/types").Organization | null;
  isAuthenticated: boolean;
}

/**
 * Re-export permission types for convenience
 */
export type { Permission, PermissionCategory, RoleKey };
