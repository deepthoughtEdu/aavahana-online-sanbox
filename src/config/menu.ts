// src/config/menu.ts
import { MenuItem, UserRole } from "@/types";
import {
  NotepadText,
  Gauge,
  CalendarDays,
  CalendarOff,
  TrendingUp,
  Star,
  Layers,
  Compass,
  // Factory,  // ⏸️ used only by the hidden crm-bridge group below
  FileInput,
  FileText,
  FilePlus,
  FlaskConical,
  UserCheck,
  LayoutDashboard,
  RefreshCw,
  MonitorDot,
  Settings,
  Zap,
  Terminal,
  ClipboardList,
  PenTool,
  Workflow,
  Briefcase,
  Award,
  Users,
  Building2,
  Receipt,
  Activity,
  GitPullRequest,
  Map,
  HeartPulse,
  BarChart3,
  Brain,
  Eye,
  Target,
  Package,
  Shield,
  Sparkles,
  Crown,
  MessageCircle,
  Ticket,
  Headset,
  Inbox,
  Megaphone,
  Search,
  LayoutGrid,
  Lightbulb,
  Gamepad2,
} from "lucide-react";

// ============================================
// AAVAHANA MODULE MENU
// ============================================

export const aavahanaMenuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/aavahana/dashboard",
  },
  {
    id: "daily-cadence",
    label: "Daily Cadence",
    icon: NotepadText,
    children: [
      {
        id: "daily-plan",
        label: "Daily Plan",
        path: "/aavahana/daily-plan",
      },
      {
        id: "daily-report",
        label: "Daily Report",
        path: "/aavahana/daily-report",
      },
      {
        id: "learning",
        label: "Learning",
        path: "/aavahana/learning",
      },
    ],
  },
  {
    id: "weekly-cadence",
    label: "Weekly Cadence",
    icon: CalendarDays,
    children: [
      {
        id: "weekly-plan-input",
        label: "Plan Your Week",
        path: "/aavahana/weekly-plan/input",
      },
      {
        id: "weekly-plan",
        label: "Weekly Plan",
        path: "/aavahana/weekly-plan",
      },
      {
        id: "weekly-report",
        label: "Weekly Report",
        path: "/aavahana/weekly-report",
      },
      {
        id: "weekly-timetable",
        label: "AI Timetable",
        path: "/aavahana/timetable",
      },
      {
        id: "weekly-analytics",
        label: "Analytics",
        path: "/aavahana/analytics",
      },
    ],
  },
  {
    id: "event-loop",
    label: "Event Loop",
    advanced: true,
    icon: RefreshCw,
    path: "/aavahana/event-loop",
  },
  {
    id: "my-ideas",
    label: "My Ideas",
    advanced: true,
    icon: Lightbulb,
    path: "/aavahana/my-ideas",
  },
  {
    id: "leaves",
    label: "Leaves",
    icon: CalendarOff,
    children: [
      {
        id: "leaves-home",
        label: "Leave Management",
        path: "/aavahana/leaves",
      },
      {
        id: "leaves-profile",
        label: "My Profile",
        path: "/aavahana/leaves/profile",
      },
      {
        id: "leaves-attendance",
        label: "My Attendance",
        path: "/aavahana/leaves/attendance",
      },
      {
        id: "leaves-holidays",
        label: "Holidays",
        path: "/aavahana/leaves/holidays",
      },
      // Leave *approvals* moved to Trinethra (L2 supervisor act) — see
      // /trinethra/leaves. Aavahana keeps only employee-facing leave surfaces.
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    children: [
      {
        id: "settings-ai-coach",
        label: "AI Coach",
        path: "/aavahana/settings/ai-coach",
      },
      {
        id: "settings-privacy",
        label: "Privacy",
        path: "/aavahana/settings/privacy",
      },
    ],
  },
  {
    id: "pdgms-growth",
    label: "Growth & Performance",
    icon: TrendingUp,
    children: [
      {
        id: "monthly-plan",
        label: "Monthly Plan",
        path: "/aavahana/monthly-plan",
      },
      {
        id: "monthly-report",
        label: "Monthly Report",
        path: "/aavahana/monthly-report",
      },
      {
        id: "kpis",
        label: "KPIs",
        path: "/aavahana/kpis",
      },
      {
        id: "career-runrate",
        label: "Career Runrate",
        path: "/aavahana/career-runrate",
      },
      {
        id: "leadership-portfolio",
        label: "Leadership Portfolio",
        path: "/aavahana/leadership-portfolio",
      },
    ],
  },
  {
    id: "pdgms-people",
    label: "People & IP",
    advanced: true,
    icon: Star,
    children: [
      {
        id: "feedback",
        label: "Feedback",
        path: "/aavahana/feedback",
      },
      {
        id: "ubs",
        label: "Engagement Score",
        path: "/aavahana/engagement-score",
      },
      {
        id: "ip",
        label: "IP & MyZone",
        path: "/aavahana/ip",
      },
    ],
  },
  {
    id: "hvt",
    label: "HVT",
    icon: FlaskConical,
    children: [
      {
        id: "hvt-viewer",
        label: "Experiments",
        path: "/aavahana/hvt",
      },
      {
        id: "hvt-ideas",
        label: "My Experiment Ideas",
        path: "/aavahana/hvt/ideas",
      },
      {
        id: "hvt-submit-idea",
        label: "Suggest Experiment",
        path: "/aavahana/hvt/ideas/new",
      },
    ],
  },
  {
    id: "community-quiz",
    label: "Community Quiz",
    icon: Brain,
    path: "/aavahana/community-quiz",
  },
  {
    id: "hcd",
    label: "Human Capital",
    icon: Target,
    path: "/aavahana/hcd",
  },
  {
    id: "hcd-operator-run",
    label: "Operator's Run",
    icon: Gamepad2,
    path: "/aavahana/hcd/skill-path",
  },
  {
    id: "dependency-curve",
    label: "Dependency Curve",
    advanced: true,
    icon: TrendingUp,
    path: "/aavahana/hcd/dependency-curve",
  },
  {
    id: "quota-rollup",
    label: "Fellow Quotas",
    advanced: true,
    icon: Users,
    path: "/aavahana/hcd/quota-rollup",
  },
  {
    id: "intelligence",
    label: "My Constraints",
    advanced: true,
    icon: Brain,
    path: "/aavahana/intelligence",
  },
];

// ============================================
// LDI PORTAL MODULE MENU
// ============================================

export const ldiMenuItems: MenuItem[] = [
  {
    id: "ldi-portal",
    label: "LDI Portal",
    icon: Sparkles,
    path: "/ldi",
  },
  {
    id: "ldi-history",
    label: "My Reflections",
    icon: Brain,
    path: "/ldi/history",
  },
];

// ============================================
// SD (SOCRATIC DIALOGUES) MODULE MENU
// ============================================

export const sdMenuItems: MenuItem[] = [
  {
    id: "sd-sessions",
    label: "Sessions",
    icon: MessageCircle,
    path: "/sd",
  },
  {
    id: "sd-admin",
    label: "Admin",
    icon: Shield,
    path: "/sd/admin",
  },
];

// ============================================
// KAUTILYA MODULE MENU (V4 Strategy)
// ============================================

export const kautilyaMenuItems: MenuItem[] = [
  {
    id: "kautilya-home",
    label: "Kautilya Home",
    icon: Crown,
    path: "/kautilya",
  },
  {
    id: "kautilya-dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/kautilya/dashboard",
  },
  // V4 visibility into the growth deliverables (V5 reaches these via Niyanta;
  // both buying-decision layers must see them). Pages are deal/workflow pickers.
  {
    id: "kautilya-growth",
    label: "Growth",
    icon: TrendingUp,
    children: [
      {
        id: "kautilya-growth-charter",
        label: "Growth Charter",
        path: "/niyanta/growth-charter",
      },
      {
        id: "kautilya-growth-workflow",
        label: "Growth Workflow",
        path: "/niyanta/growth-workflow",
      },
    ],
  },
];

// ============================================
// MIMAMSAKA MODULE MENU
// ============================================

export const mimamsakaMenuItems: MenuItem[] = [
  {
    id: "programs-home",
    label: "Programs Home",
    icon: Layers,
    path: "/mimamsaka",
  },
  {
    id: "explore",
    label: "Explore",
    icon: Compass,
    path: "/mimamsaka/explore",
  },
  {
    id: "program-intake",
    label: "Program Intake",
    icon: FileInput,
    path: "/mimamsaka/program/intake",
  },
  {
    id: "flow-sketches",
    label: "Flow Sketches",
    icon: Workflow,
    path: "/mimamsaka/sketches",
  },
  {
    id: "hvt-explorer",
    label: "HVT Explorer",
    icon: FlaskConical,
    path: "/mimamsaka/hvt",
  },
];

// ============================================
// NIYANTA MODULE MENU
// ============================================

// Only the Growth section is finished, so /niyanta shows only that. The rest of
// Niyanta's links are still reachable, but from /niyanta/beta, which exists so the
// unfinished pages can be worked on without being advertised to a customer who
// clicks into their own Growth Space.
export const niyantaGrowthMenuItems: MenuItem[] = [
  {
    id: "growth",
    label: "Growth",
    icon: TrendingUp,
    children: [
      {
        id: "growth-charter",
        label: "Growth Charter",
        path: "/niyanta/growth-charter",
      },
      {
        id: "growth-workflow",
        label: "Growth Workflow",
        path: "/niyanta/growth-workflow",
      },
      {
        id: "workshop",
        label: "Workshop",
        path: "/niyanta/workshop",
      },
    ],
  },
];

/** The full Niyanta sidebar. Served on /niyanta/beta and on the Director routes. */
export const niyantaMenuItems: MenuItem[] = [
  {
    id: "talking-documents",
    label: "Talking Documents",
    icon: FileText,
    path: "/niyanta",
  },
  {
    id: "create-document",
    label: "Create Document",
    icon: FilePlus,
    path: "/niyanta/create",
  },
  {
    id: "growth",
    label: "Growth",
    icon: TrendingUp,
    children: [
      {
        id: "growth-charter",
        label: "Growth Charter",
        path: "/niyanta/growth-charter",
      },
      {
        id: "growth-workflow",
        label: "Growth Workflow",
        path: "/niyanta/growth-workflow",
      },
      {
        id: "workshop",
        label: "Workshop",
        path: "/niyanta/workshop",
      },
    ],
  },
  {
    id: "event-loop",
    label: "Event Loop",
    icon: RefreshCw,
    path: "/niyanta/event-loop",
  },
  {
    id: "ai-shell",
    label: "AI Shell",
    icon: Terminal,
    path: "/niyanta/ai-shell",
  },
  {
    id: "director-rollup",
    label: "Where are we",
    icon: Eye,
    path: "/director",
  },
  {
    id: "director-inbox",
    label: "Unified Inbox",
    icon: Inbox,
    path: "/director/inbox",
  },
  {
    id: "director-adoption",
    label: "Adoption",
    icon: Gauge,
    path: "/director/adoption",
  },
  {
    id: "director-portfolios",
    label: "Team Portfolios",
    icon: Award,
    path: "/director/portfolios",
  },
  {
    // Moved off the Aavahana (employee) menu. Garudavega is the owner's own
    // decision pipeline and is private until a PURSUE (garudavega-prd.md §44);
    // it sat in the employee sidebar because ideas here used to feed the
    // portfolio tally. They don't any more — Improvement Objects do — so the
    // reason it was there is gone. The sidebar only hides links, so the route
    // itself is gated in app/garudavega/layout.tsx.
    id: "garudavega",
    label: "Garudavega",
    icon: Lightbulb,
    path: "/garudavega",
  },
];

// ============================================
// TRINETHRA MODULE MENU
// ============================================

export const trinethraMenuItems: MenuItem[] = [
  {
    id: "supervisor",
    label: "Supervisor Dashboard",
    icon: MonitorDot,
    path: "/trinethra/supervisor",
  },
  {
    id: "team-reporting",
    label: "Team Reporting",
    icon: BarChart3,
    path: "/trinethra/team-reporting",
  },
  {
    id: "escalations",
    label: "Escalations",
    icon: Shield,
    path: "/trinethra/escalations",
  },
  {
    id: "intelligence",
    label: "Constraint Intelligence",
    icon: Brain,
    path: "/trinethra/intelligence",
  },
  {
    id: "insights",
    label: "Management Insights",
    icon: BarChart3,
    path: "/trinethra/insights",
  },
  {
    id: "comms",
    label: "Communication Center",
    icon: MessageCircle,
    path: "/trinethra/comms",
  },
  {
    id: "team-ai",
    label: "Team AI Analysis",
    icon: Sparkles,
    path: "/trinethra/team-ai",
  },
  {
    id: "daily-reports",
    label: "Daily Reports",
    icon: FileText,
    path: "/trinethra/daily-reports",
    // Manager / admin only — Sidebar respects MenuItem.roles for filtering.
    roles: [UserRole.MANAGER, UserRole.ADMIN],
  },
  {
    id: "feedback",
    label: "Feedback",
    icon: UserCheck,
    path: "/trinethra/feedback",
  },
  {
    id: "leaves",
    label: "Leave Approvals",
    icon: CalendarOff,
    path: "/trinethra/leaves",
  },
  {
    id: "payroll",
    label: "People Ops",
    icon: Briefcase,
    path: "/payroll",
    // Manager / admin only — the /payroll shell also gates on isManager, and
    // BE endpoints re-check admin/clearance from the session uid.
    roles: [UserRole.MANAGER, UserRole.ADMIN],
  },
  {
    id: "compliance",
    label: "Report Compliance",
    icon: Shield,
    path: "/trinethra/compliance",
  },
  {
    id: "event-loop",
    label: "Event Loop",
    icon: RefreshCw,
    path: "/trinethra/event-loop",
  },
  {
    id: "hvt",
    label: "HVT",
    icon: FlaskConical,
    children: [
      {
        id: "hvt-viewer",
        label: "Experiments",
        path: "/trinethra/hvt",
      },
      {
        id: "hvt-ideas",
        label: "My Experiment Ideas",
        path: "/trinethra/hvt/ideas",
      },
      {
        id: "hvt-submit-idea",
        label: "Suggest Experiment",
        path: "/trinethra/hvt/ideas/new",
      },
    ],
  },
];

// ============================================
// ADMIN MODULE MENU
// ============================================

export const adminMenuItems: MenuItem[] = [
  // The hub page and the three pages below it were reachable only by typing /admin and
  // clicking through — none of them had a menu entry.
  { id: "admin-home", label: "Admin Home", icon: LayoutGrid, path: "/admin" },
  { id: "setup", label: "Org Setup", icon: Settings, path: "/admin/setup" },
  { id: "onboarding", label: "Onboarding", icon: UserCheck, path: "/admin/onboarding" },
  { id: "people", label: "People", icon: Users, path: "/admin/people" },
  { id: "enablers", label: "Enablers", icon: Zap, path: "/admin/enablers" },
  { id: "programs", label: "Programs", icon: Layers, path: "/admin/programs" },
  {
    id: "observers",
    label: "Observers",
    icon: Eye,
    children: [
      {
        id: "observer-invites",
        label: "Send Invites",
        path: "/admin/observers",
      },
      {
        id: "observer-cohort",
        label: "Cohort Dashboard",
        path: "/admin/observers/cohort",
      },
      {
        id: "observer-content",
        label: "Content Library",
        path: "/admin/observers/content",
      },
      {
        id: "observer-templates",
        label: "Feedback Templates",
        path: "/admin/observers/templates",
      },
      {
        id: "observer-cohorts",
        label: "Manage Cohorts",
        path: "/admin/observers/cohorts",
      },
      {
        id: "observer-passkeys",
        label: "Passkeys",
        path: "/admin/observers/passkeys",
      },
      {
        id: "observer-review",
        label: "Review",
        path: "/admin/observers/review",
      },
    ],
  },
  {
    id: "crm-invites",
    label: "CRM Invites",
    icon: Users,
    path: "/admin/crm-invites",
  },
  { id: "admin-org-tree", label: "Org Tree", icon: GitPullRequest, path: "/admin/org-tree" },
  { id: "admin-organisations", label: "Organisations", icon: Building2, path: "/admin/organisations" },
  { id: "admin-byok", label: "BYOK Keys", icon: Shield, path: "/admin/byok" },
];

// ============================================
// VIRTUAL TOUR (OBSERVER) MODULE MENU
// ============================================

export const virtualTourMenuItems: MenuItem[] = [
  // ── Menu 1: Activity ──
  {
    id: "vt-dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/virtual-tour/dashboard",
  },
  {
    id: "vt-today",
    label: "Today",
    icon: CalendarDays,
    path: "/virtual-tour",
  },
  {
    id: "vt-kickstart",
    label: "Kickstart",
    icon: Zap,
    path: "/virtual-tour/kickstart",
  },
  {
    id: "vt-drills",
    label: "Drills",
    icon: Target,
    path: "/virtual-tour/drills",
  },
  {
    id: "vt-profile",
    label: "Profile",
    icon: UserCheck,
    path: "/virtual-tour/profile",
  },
  {
    id: "vt-journal",
    label: "Journal",
    icon: NotepadText,
    path: "/virtual-tour/journal",
  },
  // ── Menu 2: Context ──
  {
    id: "vt-context",
    label: "Context",
    icon: Compass,
    children: [
      {
        id: "vt-macro-context",
        label: "Macroeconomic Context",
        path: "/virtual-tour/macro-context",
      },
      {
        id: "vt-scientific-execution",
        label: "Scientific Execution",
        path: "/virtual-tour/scientific-execution",
      },
      {
        id: "vt-grid",
        label: "5×5 Grid",
        path: "/virtual-tour/grid",
      },
      {
        id: "vt-mission",
        label: "DT Mission",
        path: "/virtual-tour/mission",
      },
    ],
  },
  {
    id: "vt-pdgms-grid",
    label: "The Grid",
    icon: Layers,
    path: "/virtual-tour/pdgms-grid",
  },
  {
    id: "vt-testimonials",
    label: "Testimonials",
    icon: Star,
    path: "/virtual-tour/testimonials",
  },
  {
    id: "vt-case-files",
    label: "Case Files",
    icon: FileText,
    path: "/virtual-tour/case-files",
  },
  {
    id: "vt-heritage",
    label: "Heritage",
    icon: Shield,
    path: "/virtual-tour/heritage",
  },
  {
    id: "vt-leadership",
    label: "Leadership",
    icon: Award,
    path: "/virtual-tour/leadership",
  },
  {
    id: "vt-why-dt",
    label: "Why DT",
    icon: HeartPulse,
    path: "/virtual-tour/why-dt",
    minDay: -1,
  },
];

// ============================================
// ATS MODULE MENUS (role-specific)
// ============================================

export const atsCandidateMenuItems: MenuItem[] = [
  {
    id: "ats-candidate-dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/ats/candidate",
  },
  {
    id: "ats-my-applications",
    label: "My Applications",
    icon: ClipboardList,
    path: "/ats/candidate/applications",
  },
  {
    id: "ats-the-grid",
    label: "The Grid",
    icon: Target,
    path: "/ats/candidate/context/grid",
  },
  {
    id: "ats-carr",
    label: "CARR",
    icon: Award,
    path: "/ats/candidate/context/carr",
  },
  {
    id: "ats-testimonials",
    label: "Testimonials",
    icon: Star,
    path: "/ats/candidate/context/testimonials",
  },
  {
    id: "ats-case-files",
    label: "Case Files",
    icon: FileText,
    path: "/ats/candidate/context/case-files",
  },
  {
    id: "ats-heritage",
    label: "Heritage",
    icon: Shield,
    path: "/ats/candidate/context/heritage",
  },
  {
    id: "ats-leadership",
    label: "Leadership",
    icon: Award,
    path: "/ats/candidate/context/leadership",
  },
];

export const atsDesignerMenuItems: MenuItem[] = [
  {
    id: "ats-designer-dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/ats/designer",
  },
  {
    id: "ats-templates",
    label: "Round Templates",
    icon: PenTool,
    children: [
      {
        id: "ats-templates-list",
        label: "All Templates",
        path: "/ats/designer/templates",
      },
      {
        id: "ats-templates-create",
        label: "Create Template",
        path: "/ats/designer/templates/create",
      },
    ],
  },
  {
    id: "ats-processes",
    label: "Selection Processes",
    icon: Workflow,
    children: [
      {
        id: "ats-processes-list",
        label: "All Processes",
        path: "/ats/designer/processes",
      },
      {
        id: "ats-processes-create",
        label: "Create Process",
        path: "/ats/designer/processes/create",
      },
    ],
  },
];

export const atsRecruiterMenuItems: MenuItem[] = [
  {
    id: "ats-recruiter-dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/ats/recruiter",
  },
  {
    id: "ats-opportunities",
    label: "Opportunities",
    icon: Briefcase,
    children: [
      {
        id: "ats-opportunities-list",
        label: "All Opportunities",
        path: "/ats/recruiter/opportunities",
      },
      {
        id: "ats-opportunities-create",
        label: "Create Opportunity",
        path: "/ats/recruiter/opportunities/create",
      },
    ],
  },
  // ⏸️ No "Leaderboard" entry here. The one that used to sit at this spot pointed at
  // /ats/recruiter — the same path as the Dashboard entry above it, so it was a dead
  // duplicate. There is no /ats/recruiter/leaderboard page; the real leaderboard is
  // /ats/recruiter/opportunities/[oppId]/leaderboard and needs an oppId, so it is only
  // reachable from an opportunity.
];

// ============================================
// CRM MODULE MENU
// ============================================

/**
 * BD Voice — CRM v2's call-led surface (2026-09-22).
 *
 * ⚠️ WHY THIS EXISTS AT ALL. `/beta/crm/bd-voice` was in no module, so it fell through to the
 * Aavahana default and a caller got the daily-report sidebar over a screen that has nothing to do
 * with it. Having no sidebar of its own is why the surface grew twelve hand-written rows of links
 * across the tops of its pages, each disagreeing with the others. The app already has a navigation
 * system with hierarchy; BD Voice simply was not in it (Tarun, 2026-09-22).
 *
 * Three groups, because the twelve screens answer three different questions: what am I doing now,
 * who is doing what, and what happened.
 *
 * ⚠️ "The desk" IS NOT ROLE-GATED HERE, and the server still refuses every one of those routes
 * to an analyst (CrmRoles.requireManager). `MenuItem.roles` carries platform roles; CRM manager
 * comes from `pdgms_crm_role_grants`, which the sidebar cannot read. Same position v1's Outreach
 * menu is in today. Closing it means teaching the sidebar the CRM role, which is its own change.
 */
export const bdVoiceMenuItems: MenuItem[] = [
  {
    // ⚠️ NAMES, NOT CLEVERNESS (Tarun, 2026-09-22). The first cut called these groups "My desk",
    // "The desk" and "Look back". The first two were one word apart and meant opposite things — a
    // caller's own accounts versus the screens for running everybody's — and "Look back" was a
    // phrase invented here rather than anything the product or the team says. These name the job.
    id: "bd-voice-my-work",
    label: "My work",
    icon: Headset,
    children: [
      { id: "bd-voice-accounts", label: "Accounts", path: "/beta/crm/bd-voice" },
      { id: "bd-voice-my-week", label: "My week", path: "/beta/crm/bd-voice/my-week" },
      // ⚠️ "Spotlight" is "Assets" in v2 (Tarun, 2026-09-22). Spotlight named how the thing was
      // built; Assets names what it is for — a public page that can be handed to a customer. v1's
      // studio keeps its own name at /crm/spotlights, because the people using it today know it by
      // that and renaming a live surface under them buys nothing.
      { id: "bd-voice-assets", label: "Assets", path: "/beta/crm/bd-voice/assets" },
    ],
  },
  {
    // ⚠️ NOT ROLE-GATED HERE, and the server still refuses each of these to an analyst
    // (CrmRoles.requireManager). `MenuItem.roles` carries platform roles; CRM manager comes from
    // `pdgms_crm_role_grants`, which the sidebar cannot read. Same position v1's Outreach menu is
    // in today. Closing it means teaching the sidebar the CRM role, which is its own change.
    id: "bd-voice-team",
    label: "The team",
    icon: Users,
    children: [
      { id: "bd-voice-portfolio", label: "Portfolio", path: "/beta/crm/bd-voice/portfolio" },
      { id: "bd-voice-requests", label: "Requests", path: "/beta/crm/bd-voice/requests" },
      { id: "bd-voice-import", label: "Import", path: "/beta/crm/bd-voice/import" },
      { id: "bd-voice-team-seats", label: "Team", path: "/beta/crm/bd-voice/team" },
      { id: "bd-voice-roster", label: "Roster", path: "/beta/crm/bd-voice/roster" },
    ],
  },
  {
    id: "bd-voice-reports",
    label: "Reports",
    icon: BarChart3,
    children: [
      { id: "bd-voice-funnel", label: "Funnel", path: "/beta/crm/bd-voice/board" },
      { id: "bd-voice-coaching", label: "Coaching", path: "/beta/crm/bd-voice/coaching" },
      // ⚠️ CONSENT IS A RUNG, NOT A DESTINATION (Tarun, 2026-09-22). It sat at the top of the
      // surface beside Accounts, which made permission look like the end of the job rather than the
      // second of six stages on the way to a customer. Screen and route unchanged.
      { id: "bd-voice-consented", label: "Consented", path: "/beta/crm/bd-voice/consented" },
      { id: "bd-voice-recordings", label: "Recordings", path: "/beta/crm/bd-voice/recordings" },
    ],
  },
  // Method is configuration, not a report, and the old dialler is not part of this product at all.
  // Both stand on their own rather than being filed under a heading that does not fit them.
  { id: "bd-voice-method", label: "Method", icon: Settings, path: "/beta/crm/bd-voice/method" },
  { id: "bd-voice-v1", label: "Old dialler", icon: LayoutDashboard, path: "/crm/outreach/dialler" },
];

/**
 * BD Meetings — CRM v2's meeting-led surface.
 *
 * ⚠️ RECONSTRUCTED 2026-09-22. A parallel session added this between my read and my write of this
 * file and my write destroyed it; what follows is rebuilt from the surviving `bd-meetings` entry in
 * `src/config/modules.ts` and from the routes that exist under `src/app/beta/crm/bd-meetings/`. It
 * is not that session's original text. **Check it against what they intended before relying on it.**
 *
 * Two destinations only, because that is all the surface has: the accounts-and-verify page, and the
 * week. The room and the account open from inside those, not from the sidebar.
 */
export const bdMeetingsMenuItems: MenuItem[] = [
  {
    id: "bd-meetings-my-work",
    label: "My work",
    icon: Users,
    children: [
      { id: "bd-meetings-accounts", label: "Accounts", path: "/beta/crm/bd-meetings" },
      { id: "bd-meetings-my-week", label: "My week", path: "/beta/crm/bd-meetings/my-week" },
      { id: "bd-meetings-assets", label: "Assets", path: "/beta/crm/bd-meetings/assets" },
    ],
  },
  {
    // ⚠️ FOUR SCREENS, NOT SIX. I first put Import and Requests here too, on a grep of the READ
    // modules that found no calling references. That grep was the wrong check and Tarun caught it:
    // the coupling is in the WRITES.
    //
    //   Import  — `Books.push` moves contacts `poolStatus: 'staged'` into the bank and counts a
    //             contact as worked by `attemptCount > 0`. That is the dialler's pool, end to end.
    //             Importing a book on a meetings surface would stage people into a calling queue.
    //   Requests — its buckets are `dnd | invalid | terminal | reserve | blocked` and an
    //             allocate-again is raised when a NUMBER is wrong. A meeting has no bad number.
    //
    // What is left genuinely does not care how the next touch happens: who holds an account, what
    // can be sent, who gave permission, and where everybody is on the ladder.
    id: "bd-meetings-team",
    label: "The team",
    icon: Layers,
    children: [
      { id: "bd-meetings-portfolio", label: "Portfolio", path: "/beta/crm/bd-meetings/portfolio" },
    ],
  },
  {
    id: "bd-meetings-reports",
    label: "Reports",
    icon: BarChart3,
    children: [
      // ⚠️ The meeting-led funnel is the ONLY one of DT's three authored all the way to
      // Customer. The call funnel stops at Opportunity. So the ladder matters more on this surface
      // than on the one it was built for.
      { id: "bd-meetings-funnel", label: "Funnel", path: "/beta/crm/bd-meetings/board" },
      { id: "bd-meetings-consented", label: "Consented", path: "/beta/crm/bd-meetings/consented" },
      // ⚠️ ICP sits under Reports, not under My work, because it is not a queue: nobody works
      // through it. It answers "is this company worth the room" before an account exists, and it
      // is read once per company rather than daily.
      { id: "bd-meetings-icp", label: "ICP scores", path: "/beta/crm/bd-meetings/icp" },
      { id: "bd-meetings-icp-rubric", label: "ICP rubric", path: "/beta/crm/bd-meetings/icp/rubric" },
      // Delivery dates (2026-09-24): pushed from the yarn workbench's predictor on an org feed key.
      // Under Reports for the reason ICP is: nobody works through it as a queue; it is read to see
      // which orders are at risk.
      { id: "bd-meetings-delivery", label: "Delivery dates", path: "/beta/crm/bd-meetings/delivery" },
    ],
  },
  { id: "bd-meetings-v1", label: "Old calendar", icon: LayoutDashboard, path: "/crm/outreach/meeting-pipeline" },
];

export const crmMenuItems: MenuItem[] = [
  // ── Core: pipeline & selling ──────────────────────────────────────────────
  {
    id: "crm-dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/crm",
  },
  {
    // Outreach is now a dropdown. NavMenu renders a parent-with-children as a
    // toggle-only button (its own `path` is ignored), so the hub is whichever
    // child is first. (Shown to everyone for now — no role gating yet.)
    //
    // The entries follow the funnel in the order a contact travels it, so the
    // menu reads as the sequence of work: home → upload → bank → call → meeting → lead
    // → profile → recording. Manager screens come after that block, with the dashboard
    // and configuration last.
    id: "crm-outreach",
    label: "Outreach",
    icon: Headset,
    children: [
      // The front door first (2026-09-15).
      { id: "crm-outreach-home", label: "Outreach Home", path: "/crm/outreach" },
      // ── The funnel, in order ──
      { id: "crm-outreach-upload", label: "Contact Upload", path: "/crm/outreach/upload" },
      { id: "crm-outreach-allocation", label: "Number Bank", path: "/crm/outreach/allocation" },
      { id: "crm-outreach-dialler", label: "Agent Dialler", path: "/crm/outreach/dialler" },
      // System name: Meeting Pipeline (spec §3) — the ready-to-attend flow. Labelled as the
      // calendar of committed discussions; only a commitment puts a contact here, never a consent.
      { id: "crm-outreach-meeting-pipeline", label: "Meeting Calendar", path: "/crm/outreach/meeting-pipeline" },
      // Every lead you are responsible for and the step it is on. A member sees
      // their own, a team lead sees the org — decided server-side from the login,
      // not by hiding rows here. Consents and commitments are both leads.
      { id: "crm-leads", label: "Leads", path: "/crm/leads" },
      // The profile studio sits in the sequence right after Leads, where a rep reaches for it.
      // It was a top-level entry until 2026-09-12; restore that by moving this line back out.
      { id: "crm-outreach-spotlights", label: "Spotlights", path: "/crm/spotlights" },
      // One route with Me/Team tabs; match review lives on the Team tab, so this
      // replaces the old pair of entries (Recordings + Recording Review).
      { id: "crm-outreach-recordings", label: "Recordings", path: "/crm/outreach/recordings" },
      // ── Manager and setup ──
      { id: "crm-outreach-followups", label: "Message Follow-ups", path: "/crm/outreach/follow-ups" },
      { id: "crm-outreach-requests", label: "Allocate-Again", path: "/crm/outreach/requests" },
      { id: "crm-outreach-agents", label: "Marketing Analysts", path: "/crm/outreach/agents" },
      { id: "crm-outreach-roster", label: "Calling Roster", path: "/crm/outreach/roster" },
      // The numbers, then the settings, at the end where a manager reaches for them.
      { id: "crm-outreach-dashboard", label: "Dashboard", path: "/crm/outreach/dashboard" },
      { id: "crm-outreach-config", label: "Configuration", path: "/crm/outreach/config" },
      // ⏸️ Consent Desk entry removed 2026-09-12 (Tarun): once Leads carries every consented
      // contact the register has no job of its own. The page, route, hooks and endpoints stay;
      // /crm/outreach/consent-desk is still reachable by URL. Restore by uncommenting:
      // { id: "crm-outreach-consent-desk", label: "Consent Desk", path: "/crm/outreach/consent-desk" },
      // ⏸️ Escalations board entry removed: the per-offering summary emails replaced the board's
      // case-raising, so it no longer fills. Pages, routes and CrmEscalationCase data stay (A41);
      // /crm/outreach/escalations is still reachable by URL.
    ],
  },
  {
    id: "crm-contacts",
    label: "Contacts",
    icon: Users,
    path: "/crm/contacts",
  },
  {
    id: "crm-companies",
    label: "Companies",
    icon: Building2,
    path: "/crm/companies",
  },
  // Spotlights moved into Outreach in funnel position (after Leads) on 2026-09-12.
  {
    // Top level rather than buried under Outreach > Recordings: every caller
    // should read it, and two clicks of nesting is how a thing goes unread.
    id: "crm-what-works",
    label: "What Works",
    icon: Lightbulb,
    path: "/crm/what-works",
  },
  {
    id: "crm-scoring",
    label: "Scoring",
    icon: ClipboardList,
    path: "/crm/scoring",
  },
  {
    id: "crm-customers",
    label: "Customers",
    icon: Award,
    path: "/crm/customers",
  },
  {
    id: "crm-deals",
    label: "Pipeline",
    icon: GitPullRequest,
    path: "/crm/deals",
  },
  // ⏸️ HIDDEN 2026-08-06 on Tarun's instruction: "remove them from the menu, don't delete the
  // code." The demand/capability bridge (the seven-step funnel) is unfinished — the analysis step
  // that turns a demand into a suggestion does not exist yet, so the screens show half a product.
  // Every page, route, service and hook still works and is reachable by URL; only the nav entry is
  // gone. Restore by uncommenting this block and the `Factory` import above.
  // Plan for what completes it: pdgmsnewdb/PDGMSDocs/ToDo/demand-to-application-build-plan.md
  //
  // {
  //   id: "crm-bridge",
  //   label: "Demand ↔ Capability",
  //   icon: Factory,
  //   children: [
  //     { id: "crm-bridge-flow", label: "What do I do now", path: "/crm/flow" },
  //     { id: "crm-bridge-engagement", label: "Engagement (1-2)", path: "/crm/engagement" },
  //     { id: "crm-bridge-applications", label: "Applications (4-5)", path: "/crm/applications" },
  //     { id: "crm-bridge-capabilities", label: "Plant Capabilities", path: "/crm/capabilities" },
  //   ],
  // },
  {
    id: "crm-funnels",
    label: "Funnels",
    icon: Workflow,
    path: "/crm/funnels",
  },
  {
    id: "crm-research",
    label: "Research",
    icon: Layers,
    children: [
      { id: "crm-research-market", label: "Market (M1)", path: "/crm/market" },
      { id: "crm-research-targets", label: "Targets (M2)", path: "/crm/targets" },
    ],
  },
  {
    id: "crm-gen",
    label: "Generate",
    icon: Sparkles,
    path: "/crm/gen",
  },
  {
    id: "crm-gen-experiments",
    label: "HVT Arms",
    icon: FlaskConical,
    path: "/crm/gen/experiments",
  },
  {
    id: "crm-signals",
    label: "Signals",
    icon: Zap,
    path: "/crm/signals",
  },
  {
    id: "crm-capture",
    label: "Capture",
    icon: ClipboardList,
    path: "/crm/capture",
  },
  {
    id: "crm-tiers",
    label: "Tier Views",
    icon: Users,
    children: [
      { id: "crm-tier-v1", label: "Aavahana (V1)", path: "/crm/aavahana" },
      { id: "crm-tier-v2", label: "Trinethra (V2)", path: "/crm/trinethra" },
      { id: "crm-tier-v3", label: "Mimamsaka (V3)", path: "/crm/mimamsaka" },
      { id: "crm-tier-v4", label: "Kautilya (V4)", path: "/crm/kautilya" },
      { id: "crm-tier-v5", label: "Niyanta (V5)", path: "/crm/niyanta-crm" },
    ],
  },
  {
    id: "crm-learning",
    label: "Learning",
    icon: BarChart3,
    path: "/crm/learning",
  },
  {
    id: "crm-rhythm",
    label: "Rhythm",
    icon: RefreshCw,
    path: "/crm/rhythm",
  },
  {
    id: "crm-pms-view",
    label: "PMS",
    icon: Award,
    path: "/crm/pms-view",
  },
  {
    id: "crm-health-v2",
    label: "Health (perception)",
    icon: HeartPulse,
    path: "/crm/health-v2",
  },
  {
    id: "crm-pitches",
    label: "Pitch Engine",
    icon: Sparkles,
    children: [
      { id: "crm-pitches-list", label: "All Pitches", path: "/crm/pitches" },
      { id: "crm-pitches-new", label: "New Pitch", path: "/crm/pitches/new" },
    ],
  },
  {
    // Previously reachable only via a card on the /crm home hub — now surfaced.
    id: "crm-campaigns",
    label: "Campaigns",
    icon: Megaphone,
    path: "/crm/campaigns",
  },
  {
    // Previously reachable only via a card on the /crm home hub — now surfaced.
    id: "crm-surveys",
    label: "Surveys",
    icon: MessageCircle,
    children: [
      { id: "crm-survey-home", label: "Overview", path: "/crm/survey" },
      { id: "crm-survey-dashboard", label: "Dashboard", path: "/crm/survey/dashboard" },
      { id: "crm-survey-roles", label: "Roles", path: "/crm/survey/admin/roles" },
      { id: "crm-survey-members", label: "Members", path: "/crm/survey/admin/members" },
      { id: "crm-survey-templates", label: "Templates", path: "/crm/survey/admin/templates" },
      { id: "crm-survey-roster", label: "Account Roster", path: "/crm/survey/admin/roster" },
      { id: "crm-survey-dispatches", label: "Dispatches", path: "/crm/survey/admin/dispatches" },
      { id: "crm-survey-email", label: "Email Config", path: "/crm/survey/admin/email-config" },
    ],
  },
  {
    id: "crm-content-studio",
    label: "Content Studio",
    icon: LayoutGrid,
    path: "/crm/content-studio",
  },
  {
    id: "crm-blueprints",
    label: "Blueprints",
    icon: Map,
    children: [
      {
        id: "crm-blueprints-library",
        label: "Templates",
        path: "/crm/blueprints",
      },
      {
        id: "crm-blueprints-new",
        label: "New Blueprint",
        path: "/crm/blueprints/new",
      },
      {
        id: "crm-blueprints-accounts",
        label: "Account Blueprints",
        path: "/crm/blueprints/accounts",
      },
    ],
  },
  {
    id: "crm-experiments",
    label: "Experiments",
    icon: FlaskConical,
    path: "/crm/experiments",
  },
  // ── Insight & oversight ───────────────────────────────────────────────────
  {
    id: "crm-analytics",
    label: "Analytics",
    icon: BarChart3,
    path: "/crm/analytics",
  },
  {
    id: "crm-team",
    label: "Team",
    icon: UserCheck,
    children: [
      { id: "crm-team-performance", label: "Performance", path: "/crm/team" },
      { id: "crm-team-coaching", label: "Coaching", path: "/crm/team/coaching" },
    ],
  },
  // ── Setup & admin (kept at the bottom) ────────────────────────────────────
  {
    id: "crm-demand-chain",
    label: "Demand Chain",
    icon: Package,
    children: [
      { id: "crm-offerings", label: "Offerings", path: "/crm/admin/offerings" },
      { id: "crm-icp", label: "ICP Profiles", path: "/crm/admin/icp" },
      { id: "crm-research-canvas", label: "Research Canvas", path: "/research" },
      { id: "crm-competitors", label: "Competitors", path: "/crm/admin/competitors" },
      { id: "crm-business-context", label: "Moat & Metrics", path: "/crm/admin/business-context" },
      { id: "crm-content-identity", label: "Brand & Messaging Identity", path: "/crm/admin/content-identity" },
      { id: "crm-field-options", label: "Field Options", path: "/crm/admin/field-options" },
    ],
  },
  {
    id: "crm-nodes",
    label: "Nodes",
    icon: Layers,
    children: [
      { id: "crm-nodes-schema", label: "Node Schema", path: "/crm/admin/nodes" },
      { id: "crm-nodes-stages", label: "Funnel Stages", path: "/crm/admin/nodes/stages" },
      { id: "crm-nodes-templates", label: "Activity Templates", path: "/crm/admin/nodes/templates" },
      { id: "crm-nodes-gates", label: "Gates", path: "/crm/admin/nodes/gates" },
      { id: "crm-nodes-content-fields", label: "Companion Fields", path: "/crm/admin/nodes/content-fields" },
      { id: "crm-nodes-groups", label: "Node Groups", path: "/crm/admin/nodes/groups" },
      { id: "crm-nodes-import", label: "Import / Export", path: "/crm/admin/nodes/import" },
    ],
  },
  {
    id: "crm-admin",
    label: "Settings",
    icon: Settings,
    children: [
      { id: "crm-admin-ontology", label: "Interaction Ontology", path: "/crm/admin/ontology" },
      { id: "crm-admin-settings", label: "CRM Config", path: "/crm/admin/settings" },
    ],
  },
];

// ============================================
// WELCOME MODULE MENU (New Fellow)
// ============================================

export const welcomeMenuItems: MenuItem[] = [
  {
    id: "welcome-home",
    label: "Welcome",
    icon: Sparkles,
    path: "/welcome",
  },
  {
    id: "welcome-progress",
    label: "Onboarding Progress",
    icon: ClipboardList,
    path: "/welcome/progress",
  },
  {
    id: "welcome-fellowship",
    label: "Fellowship",
    icon: Compass,
    path: "/welcome/fellowship",
  },
  {
    id: "welcome-case-files",
    label: "Case Files",
    icon: FileText,
    path: "/welcome/case-files",
  },
  {
    id: "welcome-testimonials",
    label: "Testimonials",
    icon: Star,
    path: "/welcome/testimonials",
  },
  {
    id: "welcome-heritage",
    label: "Heritage",
    icon: Shield,
    path: "/welcome/heritage",
  },
  {
    id: "welcome-leadership",
    label: "Leadership",
    icon: Award,
    path: "/welcome/leadership",
  },
];

// ============================================
// LEGACY: Default menu items (backward compat)
// ============================================

// ============================================
// SUPPORT TICKET MODULE MENU
// ============================================

export const ticketMenuItems: MenuItem[] = [
  {
    id: "ticket-my",
    label: "My Tickets",
    icon: Ticket,
    path: "/ticket",
  },
  {
    id: "ticket-agent",
    label: "Agent Queue",
    icon: Headset,
    path: "/ticket-agent",
    roles: [UserRole.TICKET_AGENT, UserRole.TICKET_ADMIN, UserRole.ADMIN],
  },
  {
    id: "ticket-cc",
    label: "Command Center",
    icon: BarChart3,
    path: "/ticket-commandcenter",
    roles: [UserRole.TICKET_ADMIN, UserRole.ADMIN],
  },
];

// ============================================
// FINANCE MODULE MENU
// ============================================

// Access is gated in src/app/finance/layout.tsx (the live pattern), not by
// `roles` here — the Sidebar's hasRole() filter only hides the link, it does not
// protect the page. Left ungated on purpose so the two stay one decision.
export const financeMenuItems: MenuItem[] = [
  {
    id: "finance-contracts",
    label: "Contracts",
    icon: Receipt,
    path: "/finance",
  },
  {
    // U6 — who is active. Status is DERIVED here (contract dates + payment reality);
    // nobody types one. Non-payment raises at-risk and stops there.
    id: "finance-clients",
    label: "Clients",
    icon: Building2,
    path: "/finance/clients",
  },
  {
    // U6 — the `finance` org role (AC-27). The org admin grants it.
    id: "finance-access",
    label: "Access",
    icon: Shield,
    path: "/finance/access",
  },
  {
    // U7 — the module runs itself now. This is the only place a human sees that it did,
    // and the only place they see the invoices it raised and could NOT send.
    id: "finance-ops",
    label: "Ops",
    icon: Activity,
    path: "/finance/ops",
  },
];

export const menuItems: MenuItem[] = aavahanaMenuItems;

// ============================================
// RESEARCH CANVAS MODULE MENU
// ============================================

export const researchMenuItems: MenuItem[] = [
  {
    id: "research-home",
    label: "Research Canvas",
    icon: Search,
    path: "/research",
  },
];

// ============================================
// SOCRATIC AI MODULE MENU
// ============================================

// A separate product from the SD portal above (`sdMenuItems`): /sd is the Socratic
// Dialogue portal, /socratic-ai is the dialogue surface. src/lib/analytics/modules.ts
// has carried them as two distinct keys since it was written.
export const socraticAiMenuItems: MenuItem[] = [
  {
    id: "socratic-ai-home",
    label: "Socratic AI",
    icon: Brain,
    path: "/socratic-ai",
  },
];

// ============================================
// ACTIVITIES MODULE MENU
// ============================================

// The module itself is ungated — /activities/my is open to any org member. The two
// admin surfaces carry `roles` AND a matching `requiredRoles` in
// src/config/routes/activities.ts, which is what actually enforces them.
export const activitiesMenuItems: MenuItem[] = [
  {
    id: "activities-my",
    label: "My Sessions",
    icon: CalendarDays,
    path: "/activities/my",
  },
  {
    id: "activities-all",
    label: "All Sessions",
    icon: ClipboardList,
    path: "/activities",
    roles: [UserRole.ADMIN],
  },
  {
    id: "activities-supervisor",
    label: "Supervisor View",
    icon: Eye,
    path: "/activities/supervisor",
    // Admin-only to match its requiredRoles. Listing MANAGER here would show the link
    // to managers and drop them on Access Denied.
    roles: [UserRole.ADMIN],
  },
];

// ============================================
// GARUDAVEGA MODULE MENU
// ============================================

// Gated in src/app/garudavega/layout.tsx (isAdmin || isManager). Marked `hidden` on its
// ModuleDef so it stays out of the command palette's Modules group.
export const garudavegaMenuItems: MenuItem[] = [
  {
    id: "garudavega-home",
    label: "Garudavega",
    icon: Lightbulb,
    path: "/garudavega",
  },
];
