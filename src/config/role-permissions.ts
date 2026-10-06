// src/config/role-permissions.ts

import { UserRole } from "@/types";
import { getAllPermissions, PERMISSIONS } from "./permissions";

/**
 * Role key type for type-safe role-permission mappings
 */
export type RoleKey = UserRole;

/**
 * Role-based permission mappings.
 * Defines which permissions each role has access to.
 */
export const ROLE_PERMISSIONS: Record<RoleKey, string[]> = {
  // ============================================
  // ADMIN - Full organizational access
  // ============================================
  [UserRole.ADMIN]: getAllPermissions(),

  // ============================================
  // MANAGER - Organization management access
  // ============================================
  [UserRole.MANAGER]: [
    // User management
    PERMISSIONS.USER.VIEW,
    PERMISSIONS.USER.VIEW_ALL,
    PERMISSIONS.USER.INVITE,
    PERMISSIONS.USER.EXPORT,

    // Organization (view only)
    PERMISSIONS.ORGANIZATION.VIEW,
    PERMISSIONS.ORGANIZATION.MANAGE_MEMBERS,
    PERMISSIONS.ORGANIZATION.INVITE_MEMBERS,

    // Department management
    PERMISSIONS.DEPARTMENT.CREATE,
    PERMISSIONS.DEPARTMENT.VIEW,
    PERMISSIONS.DEPARTMENT.VIEW_ALL,
    PERMISSIONS.DEPARTMENT.EDIT,
    PERMISSIONS.DEPARTMENT.MANAGE_MEMBERS,
    PERMISSIONS.DEPARTMENT.ASSIGN_ROLES,

    // Plan management
    PERMISSIONS.PLAN.CREATE_DAILY,
    PERMISSIONS.PLAN.CREATE_WEEKLY,
    PERMISSIONS.PLAN.VIEW_OWN,
    PERMISSIONS.PLAN.VIEW_ALL,
    PERMISSIONS.PLAN.VIEW_DEPARTMENT,
    PERMISSIONS.PLAN.EDIT_OWN,
    PERMISSIONS.PLAN.EDIT_ALL,
    PERMISSIONS.PLAN.EXPORT,

    // Report management
    PERMISSIONS.REPORT.CREATE_DAILY,
    PERMISSIONS.REPORT.CREATE_WEEKLY,
    PERMISSIONS.REPORT.VIEW_OWN,
    PERMISSIONS.REPORT.VIEW_ALL,
    PERMISSIONS.REPORT.VIEW_DEPARTMENT,
    PERMISSIONS.REPORT.EDIT_OWN,
    PERMISSIONS.REPORT.EXPORT,
    PERMISSIONS.REPORT.VIEW_ANALYTICS,

    // Profile
    PERMISSIONS.PROFILE.VIEW_OWN,
    PERMISSIONS.PROFILE.VIEW_ALL,
    PERMISSIONS.PROFILE.EDIT_OWN,
    PERMISSIONS.PROFILE.CHANGE_PASSWORD,

    // Analytics
    PERMISSIONS.ANALYTICS.VIEW_DASHBOARD,
    PERMISSIONS.ANALYTICS.VIEW_ORG,
    PERMISSIONS.ANALYTICS.VIEW_DEPARTMENT,
    PERMISSIONS.ANALYTICS.VIEW_USER,
    PERMISSIONS.ANALYTICS.EXPORT,
    PERMISSIONS.ANALYTICS.CREATE_REPORTS,

    // Settings
    PERMISSIONS.SETTINGS.VIEW_ORG,
    PERMISSIONS.SETTINGS.VIEW_USER,
    PERMISSIONS.SETTINGS.EDIT_USER,

    // Notifications
    PERMISSIONS.NOTIFICATION.VIEW_OWN,
    PERMISSIONS.NOTIFICATION.MARK_READ,
    PERMISSIONS.NOTIFICATION.DELETE,
    PERMISSIONS.NOTIFICATION.MANAGE_PREFERENCES,
    PERMISSIONS.NOTIFICATION.SEND_DEPARTMENT,
    PERMISSIONS.NOTIFICATION.SEND_USER,

    // Dashboard
    PERMISSIONS.DASHBOARD.VIEW,
    PERMISSIONS.DASHBOARD.VIEW_ORG_STATS,
    PERMISSIONS.DASHBOARD.VIEW_DEPARTMENT_STATS,
    PERMISSIONS.DASHBOARD.VIEW_USER_STATS,
  ],

  // ============================================
  // MEMBER - Standard team member access
  // ============================================
  [UserRole.MEMBER]: [
    // User (view only)
    PERMISSIONS.USER.VIEW,

    // Organization (view only)
    PERMISSIONS.ORGANIZATION.VIEW,

    // Department (view only)
    PERMISSIONS.DEPARTMENT.VIEW,

    // Plan management (own)
    PERMISSIONS.PLAN.CREATE_DAILY,
    PERMISSIONS.PLAN.VIEW_OWN,
    PERMISSIONS.PLAN.EDIT_OWN,
    PERMISSIONS.PLAN.DELETE_OWN,

    // Report management (own)
    PERMISSIONS.REPORT.CREATE_DAILY,
    PERMISSIONS.REPORT.VIEW_OWN,
    PERMISSIONS.REPORT.EDIT_OWN,
    PERMISSIONS.REPORT.DELETE_OWN,

    // Profile (own)
    PERMISSIONS.PROFILE.VIEW_OWN,
    PERMISSIONS.PROFILE.EDIT_OWN,
    PERMISSIONS.PROFILE.CHANGE_PASSWORD,

    // Analytics (limited)
    PERMISSIONS.ANALYTICS.VIEW_USER,

    // Settings (own)
    PERMISSIONS.SETTINGS.VIEW_USER,
    PERMISSIONS.SETTINGS.EDIT_USER,

    // Notifications
    PERMISSIONS.NOTIFICATION.VIEW_OWN,
    PERMISSIONS.NOTIFICATION.MARK_READ,
    PERMISSIONS.NOTIFICATION.DELETE,
    PERMISSIONS.NOTIFICATION.MANAGE_PREFERENCES,

    // Dashboard
    PERMISSIONS.DASHBOARD.VIEW,
    PERMISSIONS.DASHBOARD.VIEW_USER_STATS,
  ],

  // ============================================
  // USER - Basic user access (no organization)
  // ============================================
  [UserRole.USER]: [
    // Profile (own)
    PERMISSIONS.PROFILE.VIEW_OWN,
    PERMISSIONS.PROFILE.EDIT_OWN,
    PERMISSIONS.PROFILE.CHANGE_PASSWORD,

    // Settings (own)
    PERMISSIONS.SETTINGS.VIEW_USER,
    PERMISSIONS.SETTINGS.EDIT_USER,

    // Notifications
    PERMISSIONS.NOTIFICATION.VIEW_OWN,
    PERMISSIONS.NOTIFICATION.MARK_READ,
    PERMISSIONS.NOTIFICATION.DELETE,
    PERMISSIONS.NOTIFICATION.MANAGE_PREFERENCES,

    // Dashboard (limited)
    PERMISSIONS.DASHBOARD.VIEW,
  ],

  // ============================================
  // ALL - Special role (typically no permissions)
  // ============================================
  [UserRole.ALL]: [],

  [UserRole.TICKET_AGENT]: [
    PERMISSIONS.PROFILE.VIEW_OWN,
    PERMISSIONS.PROFILE.EDIT_OWN,
  ],

  [UserRole.TICKET_ADMIN]: [
    PERMISSIONS.PROFILE.VIEW_OWN,
    PERMISSIONS.PROFILE.EDIT_OWN,
  ],
};

/**
 * Get permissions for a specific role
 */
export const getRolePermissions = (role: RoleKey): string[] => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Check if a role has access to all permissions (super admin check)
 */
export const isRoleSuperAdmin = (role: RoleKey): boolean => {
  return role === UserRole.ADMIN;
};
