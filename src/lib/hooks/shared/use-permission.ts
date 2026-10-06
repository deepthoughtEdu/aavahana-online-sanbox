// src/lib/hooks/use-permission.ts

import { useMemo } from "react";
import { useAuth } from "./use-auth";
import { roleHasPermission, roleHasAnyPermission, roleHasAllPermissions } from "@/utils/shared/permission.utils";

/**
 * Custom hook for checking user permissions based on their role and organizational context.
 * 
 * This hook provides comprehensive permission checking capabilities including:
 * - Role-based permission checks
 * - Organizational role checks (manager, admin)
 * - Department-level role checks
 * - Hierarchical permission evaluation
 * 
 * @returns Permission checking functions and organizational role information
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { canAccess, isManager, isDepartmentManager } = usePermission();
 *   
 *   if (canAccess(PERMISSIONS.USER.CREATE)) {
 *     return <CreateUserButton />;
 *   }
 *   
 *   if (isManager()) {
 *     return <ManagerDashboard />;
 *   }
 * }
 * ```
 */
export function usePermission() {
  const { user, selectedOrg, userRole, isAuthenticated } = useAuth();

  /**
   * Check if current user has a specific permission based on their role
   * 
   * @param permission - The permission to check
   * @returns True if user has the permission, false otherwise
   */
  const canAccess = useMemo(() => {
    return (permission: string): boolean => {
      if (!isAuthenticated || !userRole) {
        return false;
      }
      return roleHasPermission(userRole, permission);
    };
  }, [isAuthenticated, userRole]);

  /**
   * Check if current user has ANY of the provided permissions
   * 
   * @param permissions - Array of permissions to check
   * @returns True if user has at least one permission, false otherwise
   */
  const hasAnyPermission = useMemo(() => {
    return (permissions: string[]): boolean => {
      if (!isAuthenticated || !userRole) {
        return false;
      }
      return roleHasAnyPermission(userRole, permissions);
    };
  }, [isAuthenticated, userRole]);

  /**
   * Check if current user has ALL of the provided permissions
   * 
   * @param permissions - Array of permissions to check
   * @returns True if user has all permissions, false otherwise
   */
  const hasAllPermissions = useMemo(() => {
    return (permissions: string[]): boolean => {
      if (!isAuthenticated || !userRole) {
        return false;
      }
      return roleHasAllPermissions(userRole, permissions);
    };
  }, [isAuthenticated, userRole]);

  /**
   * Check if user is a manager in a specific organization or the currently selected one
   * 
   * @param orgId - Optional organization ID to check. If not provided, checks selected org
   * @returns True if user is a manager in the specified organization
   */
  const isManager = useMemo(() => {
    return (orgId?: string): boolean => {
      if (!user?.organizations) {
        return false;
      }

      const targetOrgId = orgId || selectedOrg?.orgId;
      if (!targetOrgId) {
        return false;
      }

      const org = user.organizations.find((o) => o.orgId === targetOrgId);
      return org?.privileges?.isManager === true;
    };
  }, [user?.organizations, selectedOrg?.orgId]);

  /**
   * Check if user is a manager in ANY organization
   * 
   * @returns True if user is a manager in at least one organization
   */
  const isAnyManager = useMemo(() => {
    return (): boolean => {
      if (!user?.organizations) {
        return false;
      }

      return user.organizations.some((org) => org.privileges?.isManager === true);
    };
  }, [user?.organizations]);

  /**
   * Check if user is a department manager in a specific department
   * 
   * @param deptId - Optional department ID to check. If not provided, checks if user manages any department
   * @returns True if user is a department manager
   */
  const isDepartmentManager = useMemo(() => {
    return (deptId?: string): boolean => {
      if (!selectedOrg?.privileges?.departments) {
        return false;
      }

      if (!deptId) {
        return selectedOrg.privileges.departments.length > 0;
      }

      return selectedOrg.privileges.departments.includes(deptId);
    };
  }, [selectedOrg?.privileges?.departments]);

  /**
   * Check if user is a department manager in ANY department across all organizations
   * 
   * @returns True if user manages at least one department
   */
  const isAnyDepartmentManager = useMemo(() => {
    return (): boolean => {
      if (!user?.organizations) {
        return false;
      }

      return user.organizations.some(
        (org) => org.privileges?.departments && org.privileges.departments.length > 0
      );
    };
  }, [user?.organizations]);

  /**
   * Get list of organization IDs where user is a manager
   * 
   * @returns Array of organization IDs
   */
  const isManagerOf = useMemo(() => {
    return (): string[] => {
      if (!user?.organizations) {
        return [];
      }

      return user.organizations
        .filter((org) => org.privileges?.isManager === true)
        .map((org) => org.orgId);
    };
  }, [user?.organizations]);

  /**
   * Get list of department IDs where user is a department manager
   * 
   * @returns Array of department IDs across all organizations
   */
  const isDepartmentManagerOf = useMemo(() => {
    return (): string[] => {
      if (!user?.organizations) {
        return [];
      }

      const departments: string[] = [];
      user.organizations.forEach((org) => {
        if (org.privileges?.departments) {
          departments.push(...org.privileges.departments);
        }
      });

      return departments;
    };
  }, [user?.organizations]);

  /**
   * Check if user is an admin in a specific organization or the currently selected one
   * 
   * @param orgId - Optional organization ID to check. If not provided, checks selected org
   * @returns True if user is an admin in the specified organization
   */
  const isAdmin = useMemo(() => {
    return (orgId?: string): boolean => {
      if (!user?.organizations) {
        return false;
      }

      const targetOrgId = orgId || selectedOrg?.orgId;
      if (!targetOrgId) {
        return false;
      }

      const org = user.organizations.find((o) => o.orgId === targetOrgId);
      return org?.privileges?.isAdmin === true;
    };
  }, [user?.organizations, selectedOrg?.orgId]);

  /**
   * Check if user is an admin in ANY organization
   * 
   * @returns True if user is an admin in at least one organization
   */
  const isAnyAdmin = useMemo(() => {
    return (): boolean => {
      if (!user?.organizations) {
        return false;
      }

      return user.organizations.some((org) => org.privileges?.isAdmin === true);
    };
  }, [user?.organizations]);

  /**
   * Check if user is a leader in a specific organization or the currently selected one
   * 
   * @param orgId - Optional organization ID to check. If not provided, checks selected org
   * @returns True if user is a leader in the specified organization
   */
  const isLeader = useMemo(() => {
    return (orgId?: string): boolean => {
      if (!user?.organizations) {
        return false;
      }

      const targetOrgId = orgId || selectedOrg?.orgId;
      if (!targetOrgId) {
        return false;
      }

      const org = user.organizations.find((o) => o.orgId === targetOrgId);
      return org?.privileges?.isLeader === true;
    };
  }, [user?.organizations, selectedOrg?.orgId]);

  return {
    // Permission checks
    canAccess,
    hasAnyPermission,
    hasAllPermissions,

    // Organizational role checks
    isManager,
    isAnyManager,
    isManagerOf,

    // Department role checks
    isDepartmentManager,
    isAnyDepartmentManager,
    isDepartmentManagerOf,

    // Additional role checks
    isAdmin,
    isAnyAdmin,
    isLeader,

    // Context information
    userRole,
    selectedOrg,
    isAuthenticated,
  };
}
