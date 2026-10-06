import { logger } from "@/lib/managers/logger";

// src/config/constants.ts (Updated with login route)
export const MICROSERVICES = {
  api: process.env.NODEBB_URL || "https://api.deepthought.education",
} as const;

// Security: Service token MUST always be provided via environment variable
// No fallback token provided to force proper environment configuration
function getServiceToken(): string {
  const token = process.env.NODEBB_SERVICE_TOKEN;
  
  if (!token) {
    const errorMsg = "❌ CRITICAL: NODEBB_SERVICE_TOKEN environment variable is required. Please set it in your .env file.";
    
    // Allow build to proceed without token (it's not needed at build time)
    // Token will be required at runtime when API calls are made
    if (typeof window === 'undefined' && process.env.NEXT_PHASE === 'phase-production-build') {
      logger.warn("⚠️ Building without NODEBB_SERVICE_TOKEN - ensure it's set at runtime");
      return ''; // Return empty string during build
    }
    
    if (process.env.NODE_ENV === "production") {
      // In production runtime, fail fast - don't allow the app to run without proper config
      logger.error(errorMsg);
      throw new Error(errorMsg);
    } else {
      // In development, throw error to force developers to set up environment properly
      logger.error(errorMsg);
      logger.error("Please copy .env.example to .env.local and set NODEBB_SERVICE_TOKEN");
      throw new Error(errorMsg);
    }
  }
  
  return token;
}

export const MICROSERVICES_TOKEN = {
  get api(): string {
    return getServiceToken();
  },
};

export const API_ENDPOINTS = {
  LOGIN: "/api/v3/utilities/login",
  LOGOUT: "/api/v3/utilities/logout",
  CATEGORIES: "/api/v3/categories",
  TOPICS: "/api/v3/topics",
  USERS: "/api/v3/users",
  CONFIG: "/api/v3/config",
  RECENT: "/api/v3/recent",
} as const;

export const COOKIE_CONFIG = {
  secure: process.env.NODE_ENV === "production",
  // NOTE: httpOnly must be false to allow client-side cookie reading via hasSessionCookie()/getCookie()
  // The session cookie (express.sid) is set by the backend with httpOnly, but we need to read it
  // client-side for authentication state checks. XSS protection is provided by CSP headers.
  httpOnly: false,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 60, // 60 days
};

// NodeBB uses express.sid for session
export const COOKIE_MAPS: Record<string, string> = {
  session: "express.sid",
};

export const COOKIE_MAPS_REVERSE = Object.fromEntries(
  Object.entries(COOKIE_MAPS).map(([k, v]) => [v, k])
);

export const LEAVE_CONSTANTS = {
  CEO_UID: 90,
  MAX_LEAVES_FOR_CEO_APPROVAL: 3,
  DEFAULT_WORKING_HOURS: {
    from: "11:00",
    to: "21:00",
  },
} as const;

export const LEAVE_REASONS = [
  "Medical Reasons",
  "Personal issues",
  "Emergency",
  "Vacation",
  "Family event",
  "Other",
] as const;

export const LEAVE_STATUS_COLORS = {
  Pending: "warning",
  Accepted: "success",
  Rejected: "error",
  Modified: "warning",
  Canceled: "error",
} as const;

export const LEAVE_STATUS_ICONS = {
  Pending: "⏳",
  Accepted: "✓",
  Rejected: "✗",
  Modified: "⚠",
  Canceled: "✗",
} as const;

export const DATE_FORMATS = {
  date: "YYYY-MM-DD",
  time: "HH:mm",
  dateTime: "YYYY-MM-DD HH:mm",
  displayDate: "DD MMM YYYY",
  displayDateTime: "DD MMM YYYY, hh:mm A",
  displayTime: "hh:mm A",
} as const;
