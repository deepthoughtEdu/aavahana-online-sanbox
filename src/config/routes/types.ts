import { UserRole } from "@/types";

export { UserRole };

export interface RouteConfig {
  title?: string;
  requiredRoles?: UserRole[];
  requiresOrg?: boolean;
  redirectTo?: string;
  description?: string;
}

export type RouteObject = {
  _?: string;
  _config?: RouteConfig;
  _param?: string;
  _paramPath?: string;
  _paramConfig?: RouteConfig;
  [key: string]: unknown;
};
