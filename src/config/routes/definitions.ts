import { homeRoutes, authRoutes, profileRoutes, dashboardLegacyRoutes } from "./shared";
import { aavahanaRoutes } from "./aavahana";
import { trinethraRoutes } from "./trinethra";
import { mimamsakaRoutes } from "./mimamsaka";
import { niyantaRoutes } from "./niyanta";
import { adminRoutes } from "./admin";
import { atsRoutes } from "./ats";
import { crmRoutes } from "./crm";
import { financeRoutes } from "./finance";
import { virtualTourRoutes } from "./virtual-tour";
import { welcomeRoutes } from "./welcome";
import { ldiRoutes } from "./ldi";
import { sdRoutes } from "./sd";
import { ticketRoutes } from "./ticket";
import { activityRoutes } from "./activities";

// ============================================
// SINGLE SOURCE OF TRUTH
// ============================================

export const ROUTES = {
  home: homeRoutes,
  auth: authRoutes,
  aavahana: aavahanaRoutes,
  trinethra: trinethraRoutes,
  mimamsaka: mimamsakaRoutes,
  niyanta: niyantaRoutes,
  profile: profileRoutes,
  dashboard: dashboardLegacyRoutes,
  admin: adminRoutes,
  ats: atsRoutes,
  crm: crmRoutes,
  finance: financeRoutes,
  virtualTour: virtualTourRoutes,
  welcome: welcomeRoutes,
  ldi: ldiRoutes,
  sd: sdRoutes,
  ticket: ticketRoutes,
  activities: activityRoutes,
} as const;

// ============================================
// PUBLIC ROUTES — SSOT
// ============================================

export const PUBLIC_ROUTES = [
  "/",
  "/aavahana",
  "/niyanta",
  "/trinethra",
  "/mimamsaka",
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify",
  "/auth/verify-code",
  "/auth/change-password",
  "/authenticate",
  "/ontology",
  "/ontology/practice",
  "/invite/accept",
  "/invite/change-password",
  "/ats",
  "/ats/apply",
  "/ats/apply/success",
  "/ats/candidate/opportunities",
  "/blog",
  "/blog/unsubscribed",
  "/experiment",
  "/niyanta/growth-charter",
  "/niyanta/growth-workflow",
  "/selection",
  "/virtual-tour/ai-adtech-prep",
  "/virtual-tour/adtech-practice",
  "/virtual-tour/design-thinking-prep",
  "/guides",
  "/hcd",
  // ⛔ Finance U5 (AC-18). Where a CLIENT lands after pressing "Stop these reminders"
  // in an overdue-invoice email. They have no PDGMS session and never will.
  // It sits OUTSIDE /finance deliberately: /finance is gated to the finance team, so a
  // Stop page under it would bounce the very person it exists for straight to a login.
  "/invoice-paused",
] as const;

export type PublicRoute = (typeof PUBLIC_ROUTES)[number];
