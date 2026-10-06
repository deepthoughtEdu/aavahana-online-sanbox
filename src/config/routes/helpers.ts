import type { RouteConfig, RouteObject, UserRole } from "./types";
import { ROUTES } from "./definitions";
import { PUBLIC_ROUTES, type PublicRoute } from "./definitions";

// ============================================
// AUTO-EXTRACT ROUTE CONFIG MAP
// ============================================

function extractConfigs(
  obj: RouteObject,
  map: Record<string, RouteConfig> = {}
): Record<string, RouteConfig> {
  for (const key in obj) {
    const value = obj[key];

    if (key === "_config" && obj._) {
      map[obj._] = value as RouteConfig;
    }

    if (key === "_paramConfig" && obj._paramPath) {
      map[obj._paramPath] = value as RouteConfig;
    }

    if (typeof value === "object" && value !== null && !key.startsWith("_")) {
      extractConfigs(value as RouteObject, map);
    }
  }
  return map;
}

export const ROUTE_CONFIG_MAP = extractConfigs(ROUTES);

// ============================================
// HELPERS
// ============================================

export function getRouteConfig(pathname: string): RouteConfig | null {
  if (PUBLIC_ROUTES.includes(pathname as PublicRoute)) return null;

  if (pathname in ROUTE_CONFIG_MAP) {
    const c = ROUTE_CONFIG_MAP[pathname];
    return { ...c, requiresOrg: c.requiresOrg ?? true };
  }

  const segments = pathname.split("/").filter(Boolean);
  const patterns = ["[id]", "[uid]", "[token]", "[name]", "[oppId]", "[templateId]", "[processId]", "[appId]", "[roundId]", "[eid]", "[dayNumber]", "[sessionId]", "[experimentId]", "[contractId]", "[companyId]"];

  for (let i = 0; i < segments.length; i++) {
    for (const p of patterns) {
      const trial = [...segments];
      trial[i] = p;
      const test = "/" + trial.join("/");
      if (test in ROUTE_CONFIG_MAP) {
        const c = ROUTE_CONFIG_MAP[test];
        return { ...c, requiresOrg: c.requiresOrg ?? true };
      }
    }
  }

  return null;
}

export function isPublicRoute(pathname: string): boolean {
  return (
    PUBLIC_ROUTES.includes(pathname as PublicRoute) ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/ontology/") ||
    pathname.startsWith("/invite/") ||
    pathname.startsWith("/ats/apply/") ||
    pathname.startsWith("/blog/") ||
    pathname.startsWith("/experiment") ||
    pathname.startsWith("/atsdraft") ||
    pathname.startsWith("/p/") ||
    pathname.startsWith("/guides") ||
    pathname.startsWith("/hcd") ||
    pathname.startsWith("/privacy-policy")
  );
}

export function canAccessRoute(
  pathname: string,
  userRoles: UserRole[] = [],
  hasOrg = false
): boolean {
  const config = getRouteConfig(pathname);
  if (!config) return true;

  if (config.requiresOrg && !hasOrg) return false;

  if (config.requiredRoles?.length) {
    return config.requiredRoles.some((r) => userRoles.includes(r));
  }

  return true;
}

export type RoutePath = keyof typeof ROUTE_CONFIG_MAP | PublicRoute;
