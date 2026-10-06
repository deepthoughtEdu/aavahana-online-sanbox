import { UserRole } from "./types";

export const homeRoutes = {
  _: "/",
  _config: { title: "Home", description: "Landing page", requiresOrg: false },
} as const;

export const authRoutes = {
  login: {
    _: "/auth/login",
    _config: {
      title: "Login",
      requiresOrg: false,
      description: "User login page",
    },
  },
  signup: {
    _: "/auth/signup",
    _config: {
      title: "Sign Up",
      requiresOrg: false,
      description: "User registration page",
    },
  },
  forgotPassword: {
    _: "/auth/forgot-password",
    _config: {
      title: "Forgot Password",
      requiresOrg: false,
      description: "Password recovery page",
    },
  },
  resetPassword: {
    _: "/auth/reset-password",
    _config: {
      title: "Reset Password",
      requiresOrg: false,
      description: "Password reset page",
    },
  },
  verify: {
    _: "/auth/verify",
    _config: {
      title: "Verify Account",
      requiresOrg: false,
      description: "Account verification page",
    },
  },
  verifyCode: {
    _: "/auth/verify-code",
    _config: {
      title: "Verify Code",
      requiresOrg: false,
      description: "Code verification page",
    },
  },
} as const;

export const profileRoutes = {
  // Canonical profile URL is now the Aavahana → Leaves profile page (the only
  // profile-shaped surface in the app). `/profile` itself still resolves via
  // src/app/profile/page.tsx, which redirects here for backwards compatibility.
  _: "/aavahana/leaves/profile",
  _config: {
    title: "Profile",
    requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
    description: "User profile and settings",
  },
} as const;

/** Aavahana (L1) — all employee-facing routes */
export const aavahanaRoutes = {
  dashboard: { _: "/aavahana/dashboard", _config: { title: "Dashboard" } },

  plan: {
    daily: { _: "/aavahana/plan/daily", _config: { title: "Daily Plan" } },
    weekly: { _: "/aavahana/plan/weekly", _config: { title: "Weekly Plan" } },
    monthly: { _: "/aavahana/plan/monthly", _config: { title: "Monthly Plan" } },
  },

  report: {
    daily: { _: "/aavahana/report/daily", _config: { title: "Daily Report" } },
    weekly: { _: "/aavahana/report/weekly", _config: { title: "Weekly Report" } },
    monthly: { _: "/aavahana/report/monthly", _config: { title: "Monthly Report" } },
  },

  eventLoop: { _: "/aavahana/event-loop", _config: { title: "Event Loop" } },
  ip: { _: "/aavahana/ip", _config: { title: "Intellectual Property" } },
  kpis: { _: "/aavahana/kpis", _config: { title: "KPIs" } },
  timetable: { _: "/aavahana/timetable", _config: { title: "Timetable" } },
  timesheets: { _: "/aavahana/timesheets", _config: { title: "Timesheets" } },
  analytics: { _: "/aavahana/analytics", _config: { title: "Analytics" } },
  careerRunrate: { _: "/aavahana/career-runrate", _config: { title: "Career Runrate" } },
  leadershipPortfolio: { _: "/aavahana/leadership-portfolio", _config: { title: "Leadership Portfolio" } },
  healthScore: { _: "/aavahana/health-score", _config: { title: "Health Score" } },
  ubs: { _: "/aavahana/ubs", _config: { title: "UBS" } },
  hvt: { _: "/aavahana/hvt", _config: { title: "HVT Tracker" } },
  feedback: { _: "/aavahana/feedback", _config: { title: "Feedback" } },
} as const;

/** Legacy route aliases (kept for backward compat during migration) */
export const dashboardLegacyRoutes = {
  _: "/aavahana/dashboard",
  _config: { title: "Dashboard", description: "Main dashboard overview" },

  users: {
    _: "/dashboard/users",
    _config: {
      title: "User Management",
      requiredRoles: [UserRole.ADMIN],
      redirectTo: "/aavahana/dashboard",
      description: "Manage organization users",
    },
  },

} as const;
