// src/config/modules.ts
/**
 * The nav module registry: one entry per product that owns a sidebar.
 *
 * Replaces the 15-branch `pathname.startsWith()` if-chain that used to live in
 * AuthProvider.tsx:115-182. Everything that needs to answer "which product is this
 * page part of, and what does it contain" reads this — the Sidebar, the command
 * palette, and (later) an app launcher.
 *
 * ⟐ NOT the same map as `src/lib/analytics/modules.ts`, which exports a function
 * already called `resolveModule` (hence `resolveNavModule` here). That one covers every
 * URL segment including chromeless surfaces (auth, blog, guides, legal, prospect) so
 * Clarity can attribute a pageview; this one covers only surfaces that own a sidebar.
 * They are deliberately not derived from each other. `src/config/__tests__/modules.test.ts`
 * asserts their keys stay aligned, which is what keeps a third map from being written.
 *
 * ⚠️ `visible` IS DISPLAY FILTERING. IT HIDES LINKS, IT DOES NOT PROTECT PAGES. Every
 * predicate below mirrors a real gate and names it in a comment. See the warning block
 * on `NavAccess` in src/types/shared/nav.types.ts for where enforcement actually lives.
 */
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Award,
  Brain,
  Briefcase,
  Compass,
  Crown,
  Eye,
  Gauge,
  Headset,
  Inbox,
  Layers,
  LayoutGrid,
  Lightbulb,
  MessageCircle,
  PenTool,
  Receipt,
  Search,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Workflow,
} from "lucide-react";

import type { MenuItem } from "@/types";
import type { NavAccess } from "@/types/shared/nav.types";
import { isPublicRoute } from "@/config/routes";
import {
  aavahanaMenuItems,
  activitiesMenuItems,
  adminMenuItems,
  atsCandidateMenuItems,
  atsDesignerMenuItems,
  atsRecruiterMenuItems,
  bdVoiceMenuItems,
  bdMeetingsMenuItems,
  crmMenuItems,
  financeMenuItems,
  garudavegaMenuItems,
  kautilyaMenuItems,
  ldiMenuItems,
  mimamsakaMenuItems,
  niyantaMenuItems,
  niyantaGrowthMenuItems,
  researchMenuItems,
  sdMenuItems,
  socraticAiMenuItems,
  ticketMenuItems,
  trinethraMenuItems,
  virtualTourMenuItems,
  welcomeMenuItems,
} from "@/config/menu";

// ============================================
// TYPES
// ============================================

export type ModuleId =
  | "aavahana"
  | "bd-voice"
  | "bd-meetings"
  | "welcome"
  | "virtual-tour"
  | "admin"
  | "ats"
  | "ats-designer"
  | "ats-recruiter"
  | "kautilya"
  | "mimamsaka"
  | "niyanta"
  | "niyanta-beta"
  | "director"
  | "trinethra"
  | "payroll"
  | "ticket"
  | "crm"
  | "finance"
  | "ldi"
  | "sd"
  | "research"
  | "socratic-ai"
  | "activities"
  | "garudavega";

/**
 * Only the four stems that actually exist in src/styles/theme.css:151-170. A union
 * rather than `string`, so a typo is a type error instead of a dead CSS variable.
 */
export type ModuleThemeKey = "aavahana" | "trinethra" | "mimamsaka" | "niyanta";

/** Runtime inputs a module may need to shape its own menu. Pure data, no hooks. */
export interface ModuleRuntimeCtx {
  tourDay: { currentDay: number; totalDays: number } | null;
}

export interface ModuleDef {
  id: ModuleId;
  /** Sidebar module name and palette group header. Existing strings preserved verbatim. */
  label: string;
  /** One line. Palette subtitle today, launcher card body later. */
  tagline: string;
  icon: LucideIcon;
  /** Every path prefix this module owns. Authoring order is irrelevant, see resolveNavModule. */
  prefixes: readonly string[];
  /** Where the module opens from the palette. Must not be a PUBLIC_ROUTES entry. */
  home: string;
  /** The nav tree the Sidebar renders. May be shared by reference across modules. */
  menu: readonly MenuItem[];
  /** Display-only visibility. Omitted means every authenticated user sees it. NOT SECURITY. */
  visible?: (access: NavAccess) => boolean;
  /** Per-module runtime menu shaping. Must stay pure. Only virtual-tour uses it today. */
  filterMenu?: (menu: readonly MenuItem[], ctx: ModuleRuntimeCtx) => MenuItem[];
  /** CSS custom-property stem. No colour value ever lives in TypeScript. */
  themeKey?: ModuleThemeKey;
  /** Keep out of the palette's Modules group and out of a future launcher grid. */
  hidden?: boolean;
  /** Analytics key when it differs from `id` — all three ATS defs map to "ats". */
  analyticsKey?: string;
}

// ============================================
// THE REGISTRY
// ============================================

export const MODULES: readonly ModuleDef[] = [
  {
    id: "aavahana",
    label: "Aavahana",
    tagline: "Your daily and weekly rhythm",
    icon: Gauge,
    prefixes: ["/aavahana"],
    // /aavahana itself is a PUBLIC marketing page, so home points at the dashboard.
    home: "/aavahana/dashboard",
    menu: aavahanaMenuItems,
    themeKey: "aavahana",
  },
  {
    id: "trinethra",
    label: "Trinethra",
    tagline: "Supervise your team's execution",
    icon: Eye,
    prefixes: ["/trinethra"],
    home: "/trinethra/supervisor",
    menu: trinethraMenuItems,
    themeKey: "trinethra",
  },
  {
    // People Ops rides the Trinethra (manager) sidebar so the payroll tab shell stays
    // reachable and highlighted from the manager surface. Sharing `menu` by reference
    // is deliberate: giving it its own menu would put the same paths in two menus,
    // which is how /niyanta/growth-* ended up duplicated across two of them.
    id: "payroll",
    label: "People Ops",
    tagline: "Payroll, leave policy and people configuration",
    icon: Receipt,
    prefixes: ["/payroll"],
    home: "/payroll",
    menu: trinethraMenuItems,
    // ⟷ src/app/payroll/layout.tsx uses usePermission().isManager(), which reads
    //    privileges.isManager on the SELECTED org and does NOT include isAdmin.
    //    Mirror it exactly — `userRole === MANAGER` would disagree, because
    //    userRoleAtom collapses isAdmin over isManager.
    visible: (a) => a.privileges.isManager,
  },
  {
    // CRM v2's call-led surface. Ahead of "/crm" is irrelevant — resolveNavModule is
    // longest-prefix-wins — but the prefix must be the full path because "/beta" alone
    // would also capture BD Meetings, which gets its own entry when it moves.
    //
    // ⚠️ Until 2026-09-22 this path was in NO module, so it fell through to the Aavahana
    // default: a caller got the daily-report sidebar over the dialler. That absence is why
    // the surface grew twelve hand-written link rows of its own (Tarun).
    id: "bd-voice",
    label: "BD Voice",
    tagline: "The calling desk — accounts, the work list and the week",
    icon: Headset,
    prefixes: ["/beta/crm/bd-voice"],
    home: "/beta/crm/bd-voice",
    menu: bdVoiceMenuItems,
    // Analytics resolves on the FIRST segment, so every /beta page tags as "beta".
    // That is true and deliberate for the beta; the tripwire in modules.test.ts needs it stated.
    analyticsKey: "beta",
    // Not advertised in the palette's module list: it is reachable only with the crmBeta
    // flag, and the gate is the server's, not this line. Display only.
    hidden: true,
  },
  {
    // CRM v2's meeting-led surface, the half Pioneer runs on. Its own entry rather than a shared
    // "/beta/crm" prefix: the two surfaces exist BECAUSE the motions differ, so one sidebar over
    // both would undo the split (Tarun, 2026-09-05).
    //
    // ⚠️ Added 2026-09-22 after seeing the screen: this path was in no module, so a marketing head
    // got the Aavahana daily-report sidebar over his customers. The bd-voice entry above predicted
    // exactly this ("BD Meetings, which gets its own entry when it moves") and it was still missed,
    // because nobody had opened the page.
    id: "bd-meetings",
    label: "BD Meetings",
    tagline: "The meeting-led desk — the room, the documents and the verdicts",
    icon: Inbox,
    prefixes: ["/beta/crm/bd-meetings"],
    home: "/beta/crm/bd-meetings",
    menu: bdMeetingsMenuItems,
    // Same as bd-voice: analytics resolves on the first segment, so every /beta page tags "beta".
    analyticsKey: "beta",
    // Reachable only with the crmBeta flag, and that gate is the server's, not this line.
    hidden: true,
  },
  {
    id: "crm",
    label: "CRM",
    tagline: "Pipeline, outreach and demand generation",
    icon: Target,
    prefixes: ["/crm"],
    home: "/crm",
    menu: crmMenuItems,
  },
  {
    id: "niyanta",
    label: "Niyanta",
    tagline: "Talking documents and growth workflows",
    icon: Workflow,
    prefixes: ["/niyanta"],
    // /niyanta is a PUBLIC route (the talking-documents marketing page).
    home: "/niyanta/create",
    // Growth only. Everything else in Niyanta is unfinished, and a customer
    // reaching their own Growth Space should not be offered links into it.
    // The full sidebar lives on the /niyanta/beta module below.
    menu: niyantaGrowthMenuItems,
    themeKey: "niyanta",
  },
  {
    // Same module, full sidebar, reached deliberately. PREFIX_INDEX sorts by
    // length so "/niyanta/beta" is tested before "/niyanta" and wins.
    id: "niyanta-beta",
    label: "Niyanta Beta",
    tagline: "Everything in Niyanta, including what is not finished",
    icon: Workflow,
    prefixes: ["/niyanta/beta"],
    home: "/niyanta/beta",
    menu: niyantaMenuItems,
    themeKey: "niyanta",
    hidden: true,
  },
  {
    // Director rides the Niyanta sidebar, same arrangement as People Ops on Trinethra.
    // The four /director routes are already Niyanta menu entries ("Where are we",
    // Unified Inbox, Adoption, Team Portfolios), so pointing at that menu keeps them
    // reachable AND lets the active one highlight.
    id: "director",
    label: "Director",
    tagline: "Cross-team rollups, inbox and portfolios",
    icon: Star,
    prefixes: ["/director"],
    home: "/director",
    menu: niyantaMenuItems,
  },
  {
    id: "mimamsaka",
    label: "Mimamsaka",
    tagline: "Programme execution and diagnostics",
    icon: Layers,
    prefixes: ["/mimamsaka"],
    // /mimamsaka is a PUBLIC route.
    home: "/mimamsaka/explore",
    menu: mimamsakaMenuItems,
    themeKey: "mimamsaka",
  },
  {
    id: "kautilya",
    label: "Kautilya",
    tagline: "Strategy briefs and buying-decision views",
    icon: Crown,
    prefixes: ["/kautilya"],
    home: "/kautilya/dashboard",
    menu: kautilyaMenuItems,
  },
  {
    id: "ats-designer",
    label: "ATS Designer",
    tagline: "Design hiring processes and round templates",
    icon: PenTool,
    prefixes: ["/ats/designer"],
    home: "/ats/designer",
    menu: atsDesignerMenuItems,
    analyticsKey: "ats",
  },
  {
    id: "ats-recruiter",
    label: "ATS Recruiter",
    tagline: "Run opportunities and review applications",
    icon: Briefcase,
    prefixes: ["/ats/recruiter"],
    home: "/ats/recruiter",
    menu: atsRecruiterMenuItems,
    analyticsKey: "ats",
  },
  {
    id: "ats",
    label: "ATS",
    tagline: "Your applications and selection rounds",
    icon: Award,
    // Bare /ats is a PUBLIC landing page, but the prefix is still owned here so deep
    // candidate routes resolve. Longest-prefix-wins means the two defs above win their
    // own paths regardless of the order these appear in.
    prefixes: ["/ats", "/ats/candidate"],
    home: "/ats/candidate",
    menu: atsCandidateMenuItems,
    analyticsKey: "ats",
  },
  {
    id: "virtual-tour",
    label: "Virtual Tour",
    tagline: "Observer programme: daily context, drills and journal",
    icon: Compass,
    prefixes: ["/virtual-tour"],
    home: "/virtual-tour/dashboard",
    menu: virtualTourMenuItems,
    // Day-gated entries unlock as the observer progresses; minDay === -1 means "final
    // day only". Lifted unchanged from AuthProvider.tsx:119-127. It takes tourDay as an
    // ARGUMENT rather than reading tourDayAtom, which keeps this module React-free and
    // jotai-free so the palette and the tests can call it too — and means the palette
    // can never surface a day-locked page the sidebar is hiding.
    filterMenu: (menu, { tourDay }) =>
      menu.filter((item) => {
        if (item.minDay == null) return true;
        if (!tourDay) return false;
        const threshold = item.minDay === -1 ? tourDay.totalDays : item.minDay;
        return tourDay.currentDay >= threshold;
      }),
  },
  {
    id: "welcome",
    label: "Welcome",
    tagline: "New fellow onboarding",
    icon: Sparkles,
    prefixes: ["/welcome"],
    home: "/welcome",
    menu: welcomeMenuItems,
  },
  {
    id: "ticket",
    label: "Support Tickets",
    tagline: "Raise and resolve support tickets",
    icon: Headset,
    // /ticket-agent and /ticket-commandcenter are siblings, not children, of /ticket.
    // The old raw startsWith("/ticket") caught them by accident; they are explicit here,
    // matching how src/lib/analytics/modules.ts:66-68 already declares them.
    prefixes: ["/ticket", "/ticket-agent", "/ticket-commandcenter"],
    home: "/ticket",
    menu: ticketMenuItems,
  },
  {
    id: "finance",
    label: "Finance",
    tagline: "Contracts, clients and invoicing",
    icon: Activity,
    prefixes: ["/finance"],
    home: "/finance",
    menu: financeMenuItems,
    // ⟷ src/app/finance/layout.tsx via useFinanceRole(), which now reads the same
    //    navAccessAtom.orgRoles set this does. The link and the gate cannot disagree.
    visible: (a) => a.isPlatformAdmin || a.hasOrgRole("finance") || a.hasOrgRole("finance_viewer"),
  },
  {
    id: "admin",
    label: "Admin",
    tagline: "Org setup, people, enablers and programmes",
    icon: LayoutGrid,
    prefixes: ["/admin"],
    home: "/admin",
    menu: adminMenuItems,
    // ⚠️ NO LAYOUT GATE EXISTS for /admin. This hides the link only; the pages
    //    themselves are protected by their backend endpoints.
    visible: (a) => a.privileges.isAdmin || a.isPlatformAdmin,
  },
  {
    id: "sd",
    label: "Socratic Dialogue",
    tagline: "Dialogue sessions and facilitation",
    icon: MessageCircle,
    prefixes: ["/sd"],
    home: "/sd",
    menu: sdMenuItems,
  },
  {
    // A separate product from /sd — see src/lib/analytics/modules.ts:63 and :65, which
    // have carried them as two distinct keys since it was written.
    id: "socratic-ai",
    label: "Socratic AI",
    tagline: "AI-led Socratic dialogue",
    icon: Brain,
    prefixes: ["/socratic-ai"],
    home: "/socratic-ai",
    menu: socraticAiMenuItems,
  },
  {
    id: "ldi",
    label: "LDI Portal",
    tagline: "Learning and development reflections",
    icon: Sparkles,
    prefixes: ["/ldi"],
    home: "/ldi",
    menu: ldiMenuItems,
  },
  {
    id: "research",
    label: "Research",
    tagline: "Market research canvases and runs",
    icon: Search,
    prefixes: ["/research"],
    home: "/research",
    menu: researchMenuItems,
  },
  {
    id: "activities",
    label: "Activities",
    tagline: "Session activities and attendance",
    icon: TrendingUp,
    prefixes: ["/activities"],
    // Ungated at module level: /activities/my is open to any org member. The admin
    // surfaces carry `roles` on the menu items AND requiredRoles in
    // src/config/routes/activities.ts, which is what actually enforces them.
    home: "/activities/my",
    menu: activitiesMenuItems,
  },
  {
    id: "garudavega",
    label: "Garudavega",
    tagline: "Idea pipeline",
    icon: Lightbulb,
    prefixes: ["/garudavega"],
    home: "/garudavega",
    menu: garudavegaMenuItems,
    // ⟷ src/app/garudavega/layout.tsx uses usePermission(): isAdmin() || isManager().
    visible: (a) => a.privileges.isAdmin || a.privileges.isManager,
    // One owner's private pipeline. Reachable, but not advertised as a product.
    hidden: true,
  },
];

// ============================================
// RESOLUTION
// ============================================

/**
 * Longest prefix wins. Precomputed once at module load so authoring order in MODULES is
 * irrelevant and the "/ats/designer must be tested before /ats" class of bug cannot
 * recur — which is exactly the fragility the old if-chain carried.
 */
const PREFIX_INDEX: readonly { prefix: string; module: ModuleDef }[] = MODULES
  .flatMap((m) => m.prefixes.map((prefix) => ({ prefix, module: m })))
  .sort((a, b) => b.prefix.length - a.prefix.length);

/** Everything unmatched keeps rendering the Aavahana sidebar, as it always has. */
export const DEFAULT_MODULE: ModuleDef = MODULES.find((m) => m.id === "aavahana")!;

/**
 * ⟐ Named `resolveNavModule`, not `resolveModule` — `src/lib/analytics/modules.ts`
 * already owns that name and both are reachable through path aliases.
 */
export function resolveNavModule(pathname: string): ModuleDef | null {
  for (const entry of PREFIX_INDEX) {
    // Segment-boundary match, NOT raw startsWith: "/atsdraft" must not be captured by
    // the "/ats" prefix, and "/trinethra-anything" must not be captured by "/trinethra".
    if (pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`)) {
      return entry.module;
    }
  }
  return null;
}

export function resolveNavModuleOrDefault(pathname: string): ModuleDef {
  return resolveNavModule(pathname) ?? DEFAULT_MODULE;
}

export function getModule(id: ModuleId): ModuleDef {
  const found = MODULES.find((m) => m.id === id);
  if (!found) throw new Error(`Unknown nav module: ${id}`);
  return found;
}

/**
 * Modules this user can see, minus the ones that opt out of being advertised.
 * Unused by the sidebar and palette (which walk MODULES directly so they can index
 * pages too); this is the seam an app launcher grid would map over.
 */
export function visibleModules(access: NavAccess): ModuleDef[] {
  return MODULES.filter((m) => !m.hidden && (!m.visible || m.visible(access)));
}

/** Resolves a module's menu, applying any runtime shaping it declares. */
export function resolveModuleMenu(
  module: ModuleDef,
  ctx: ModuleRuntimeCtx
): MenuItem[] {
  return module.filterMenu ? module.filterMenu(module.menu, ctx) : [...module.menu];
}

// ============================================
// CHROME
// ============================================

/**
 * Client-facing Growth Space carries its own header and sidebar, so the global app
 * chrome must not wrap it. Trailing slash is load-bearing and matches AuthProvider's
 * original check: bare /growth is the prospect landing and keeps the chrome.
 */
const CHROMELESS_PREFIXES = ["/growth/"] as const;

export function isChromelessRoute(pathname: string): boolean {
  return CHROMELESS_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** True only where the module sidebar, AppHeader and command palette should exist. */
export function hasAppChrome(pathname: string): boolean {
  return !isPublicRoute(pathname) && !isChromelessRoute(pathname);
}
