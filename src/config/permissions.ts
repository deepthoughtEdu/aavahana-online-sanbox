// src/config/permissions.ts

/**
 * Comprehensive permission definitions for the application.
 * Each permission follows the format: "resource:action"
 */
export const PERMISSIONS = {
  // ============================================
  // USER MANAGEMENT
  // ============================================
  USER: {
    CREATE: "user:create",
    VIEW: "user:view",
    VIEW_ALL: "user:view_all",
    EDIT: "user:edit",
    EDIT_ALL: "user:edit_all",
    DELETE: "user:delete",
    INVITE: "user:invite",
    MANAGE_ROLES: "user:manage_roles",
    EXPORT: "user:export",
  },

  // ============================================
  // ORGANIZATION MANAGEMENT
  // ============================================
  ORGANIZATION: {
    CREATE: "organization:create",
    VIEW: "organization:view",
    VIEW_ALL: "organization:view_all",
    EDIT: "organization:edit",
    DELETE: "organization:delete",
    MANAGE_SETTINGS: "organization:manage_settings",
    MANAGE_MEMBERS: "organization:manage_members",
    INVITE_MEMBERS: "organization:invite_members",
    REMOVE_MEMBERS: "organization:remove_members",
    EXPORT: "organization:export",
  },

  // ============================================
  // DEPARTMENT MANAGEMENT
  // ============================================
  DEPARTMENT: {
    CREATE: "department:create",
    VIEW: "department:view",
    VIEW_ALL: "department:view_all",
    EDIT: "department:edit",
    DELETE: "department:delete",
    MANAGE_MEMBERS: "department:manage_members",
    ASSIGN_ROLES: "department:assign_roles",
  },

  // ============================================
  // PLAN MANAGEMENT
  // ============================================
  PLAN: {
    CREATE_DAILY: "plan:create_daily",
    CREATE_WEEKLY: "plan:create_weekly",
    VIEW_OWN: "plan:view_own",
    VIEW_ALL: "plan:view_all",
    VIEW_DEPARTMENT: "plan:view_department",
    EDIT_OWN: "plan:edit_own",
    EDIT_ALL: "plan:edit_all",
    DELETE_OWN: "plan:delete_own",
    DELETE_ALL: "plan:delete_all",
    EXPORT: "plan:export",
  },

  // ============================================
  // REPORT MANAGEMENT
  // ============================================
  REPORT: {
    CREATE_DAILY: "report:create_daily",
    CREATE_WEEKLY: "report:create_weekly",
    VIEW_OWN: "report:view_own",
    VIEW_ALL: "report:view_all",
    VIEW_DEPARTMENT: "report:view_department",
    EDIT_OWN: "report:edit_own",
    EDIT_ALL: "report:edit_all",
    DELETE_OWN: "report:delete_own",
    DELETE_ALL: "report:delete_all",
    EXPORT: "report:export",
    VIEW_ANALYTICS: "report:view_analytics",
  },

  // ============================================
  // PROFILE MANAGEMENT
  // ============================================
  PROFILE: {
    VIEW_OWN: "profile:view_own",
    VIEW_ALL: "profile:view_all",
    EDIT_OWN: "profile:edit_own",
    EDIT_ALL: "profile:edit_all",
    CHANGE_PASSWORD: "profile:change_password",
    DELETE_ACCOUNT: "profile:delete_account",
  },

  // ============================================
  // ANALYTICS & INSIGHTS
  // ============================================
  ANALYTICS: {
    VIEW_DASHBOARD: "analytics:view_dashboard",
    VIEW_ORG: "analytics:view_org",
    VIEW_DEPARTMENT: "analytics:view_department",
    VIEW_USER: "analytics:view_user",
    EXPORT: "analytics:export",
    CREATE_REPORTS: "analytics:create_reports",
  },

  // ============================================
  // SETTINGS
  // ============================================
  SETTINGS: {
    VIEW_ORG: "settings:view_org",
    EDIT_ORG: "settings:edit_org",
    VIEW_USER: "settings:view_user",
    EDIT_USER: "settings:edit_user",
    MANAGE_INTEGRATIONS: "settings:manage_integrations",
    MANAGE_BILLING: "settings:manage_billing",
    MANAGE_SECURITY: "settings:manage_security",
  },

  // ============================================
  // NOTIFICATIONS
  // ============================================
  NOTIFICATION: {
    VIEW_OWN: "notification:view_own",
    MARK_READ: "notification:mark_read",
    DELETE: "notification:delete",
    MANAGE_PREFERENCES: "notification:manage_preferences",
    SEND_ORG: "notification:send_org",
    SEND_DEPARTMENT: "notification:send_department",
    SEND_USER: "notification:send_user",
  },

  // ============================================
  // PLATFORM-LEVEL PERMISSIONS
  // ============================================
  PLATFORM: {
    MANAGE_USERS: "platform:manage_users",
    MANAGE_ORGANIZATIONS: "platform:manage_organizations",
    MANAGE_SETTINGS: "platform:manage_settings",
    VIEW_SYSTEM_LOGS: "platform:view_system_logs",
    MANAGE_BILLING: "platform:manage_billing",
    MANAGE_INTEGRATIONS: "platform:manage_integrations",
  },

  // ============================================
  // DASHBOARD
  // ============================================
  DASHBOARD: {
    VIEW: "dashboard:view",
    VIEW_ORG_STATS: "dashboard:view_org_stats",
    VIEW_DEPARTMENT_STATS: "dashboard:view_department_stats",
    VIEW_USER_STATS: "dashboard:view_user_stats",
  },
} as const;

/**
 * Helper type to extract all permission values
 */
export type PermissionCategory = keyof typeof PERMISSIONS;

// Extract permission type more explicitly to avoid TypeScript inference issues
type ExtractPermissions<T> = T extends Record<string, Record<string, infer P>> ? P : never;

export type Permission = ExtractPermissions<typeof PERMISSIONS>;

/**
 * Helper function to get all permissions as a flat array
 */
export const getAllPermissions = (): string[] => {
  return Object.values(PERMISSIONS).flatMap((category) =>
    Object.values(category)
  );
};

/**
 * Helper function to get permissions by category
 */
export const getPermissionsByCategory = (
  category: PermissionCategory
): string[] => {
  return Object.values(PERMISSIONS[category]);
};
