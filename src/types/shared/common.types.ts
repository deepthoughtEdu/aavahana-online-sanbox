import { UserRole } from ".";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?:'end' | 'start' | 'center'
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

// ============================================
// ROUTES & MENU
// ============================================
export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  path?: string;
  roles?: UserRole[];
  minDay?: number;
  /**
   * Kept out of the sidebar.
   *
   * For surfaces that exist and work but that nobody opens day to day. The
   * route is untouched and the command palette still finds it, so marking one
   * removes a line of noise without removing a capability. One line to undo.
   */
  advanced?: boolean;
  children?: Omit<MenuItem, 'children' | 'icon'>[]; // Children can't have children or icons
}

export interface RouteGuardProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  redirectTo?: string;
}


export interface ProtectedRouteConfig {
  path: string;
  requiredRoles?: UserRole[];
  requiredPermissions?: string[];
}

export interface RouteMetadata {
  title: string;
  description?: string;
  requiresAuth: boolean;
  roles?: UserRole[];
  permissions?: string[];
}
