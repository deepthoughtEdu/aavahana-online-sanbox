// src/utils/permission.utils.ts

import { getRolePermissions, RoleKey, isRoleSuperAdmin } from "@/config/role-permissions";

/**
 * Check if a role has a specific permission
 * 
 * @param role - The role to check
 * @param permission - The permission to check for
 * @returns True if the role has the permission, false otherwise
 * 
 * @example
 * ```typescript
 * roleHasPermission(UserRole.ADMIN, PERMISSIONS.USER.CREATE); // true
 * roleHasPermission(UserRole.MEMBER, PERMISSIONS.USER.DELETE); // false
 * ```
 */
export function roleHasPermission(role: RoleKey, permission: string): boolean {
  // Super admin has all permissions
  if (isRoleSuperAdmin(role)) {
    return true;
  }

  const rolePermissions = getRolePermissions(role);
  return rolePermissions.includes(permission);
}

/**
 * Check if a role has ANY of the specified permissions
 * 
 * @param role - The role to check
 * @param permissions - Array of permissions to check for
 * @returns True if the role has at least one of the permissions, false otherwise
 * 
 * @example
 * ```typescript
 * roleHasAnyPermission(UserRole.MANAGER, [
 *   PERMISSIONS.USER.CREATE,
 *   PERMISSIONS.USER.DELETE
 * ]); // true (manager has CREATE)
 * ```
 */
export function roleHasAnyPermission(role: RoleKey, permissions: string[]): boolean {
  // Super admin has all permissions
  if (isRoleSuperAdmin(role)) {
    return permissions.length > 0;
  }

  const rolePermissions = getRolePermissions(role);
  return permissions.some((permission) => rolePermissions.includes(permission));
}

/**
 * Check if a role has ALL of the specified permissions
 * 
 * @param role - The role to check
 * @param permissions - Array of permissions to check for
 * @returns True if the role has all of the permissions, false otherwise
 * 
 * @example
 * ```typescript
 * roleHasAllPermissions(UserRole.ADMIN, [
 *   PERMISSIONS.USER.CREATE,
 *   PERMISSIONS.USER.DELETE
 * ]); // true
 * 
 * roleHasAllPermissions(UserRole.MEMBER, [
 *   PERMISSIONS.USER.CREATE,
 *   PERMISSIONS.USER.DELETE
 * ]); // false (member doesn't have DELETE)
 * ```
 */
export function roleHasAllPermissions(role: RoleKey, permissions: string[]): boolean {
  // Super admin has all permissions
  if (isRoleSuperAdmin(role)) {
    return true;
  }

  const rolePermissions = getRolePermissions(role);
  return permissions.every((permission) => rolePermissions.includes(permission));
}

/**
 * Get all permissions for a role
 * 
 * @param role - The role to get permissions for
 * @returns Array of permissions for the role
 * 
 * @example
 * ```typescript
 * const permissions = getPermissionsForRole(UserRole.MANAGER);
 * console.log(permissions); // ['user:view', 'user:invite', ...]
 * ```
 */
export function getPermissionsForRole(role: RoleKey): string[] {
  return getRolePermissions(role);
}

/**
 * Check if a permission string is valid
 * 
 * @param permission - The permission string to validate
 * @returns True if the permission is valid, false otherwise
 * 
 * @example
 * ```typescript
 * isValidPermission('user:create'); // true
 * isValidPermission('invalid'); // false
 * ```
 */
export function isValidPermission(permission: string): boolean {
  return /^[a-z]+:[a-z_]+$/.test(permission);
}
