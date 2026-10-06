// Barrel re-export — all consumers import from "@/config/routes"
export type { RouteConfig, RouteObject } from "./types";
export { ROUTES, PUBLIC_ROUTES, type PublicRoute } from "./definitions";
export { routes, type Routes } from "./builders";
export { ROUTE_CONFIG_MAP, getRouteConfig, isPublicRoute, canAccessRoute, type RoutePath } from "./helpers";
