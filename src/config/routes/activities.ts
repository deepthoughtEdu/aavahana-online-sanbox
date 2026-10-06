export const activityRoutes = {
  home: {
    _: "/activities",
    _config: {
      title: "Session Activities",
      requiresOrg: true,
      requiredRoles: ["admin"] as const,
    },
  },

  // Participant entry — static path must be configured so it is matched before the
  // dynamic /activities/[sessionId] (admin-only) pattern. Any org member may view.
  mySessions: {
    _: "/activities/my",
    _config: {
      title: "My Sessions",
      requiresOrg: true,
    },
  },

  // Supervisor roll-up. Previously unconfigured, which meant getRouteConfig fell through
  // to the dynamic /activities/[sessionId] pattern below and gated it as admin-only by
  // coincidence. Stated explicitly here so a reordering of `patterns` in
  // config/routes/helpers.ts cannot silently un-gate it. Admin-only matches the
  // behaviour that was already in effect — widening it to managers is a product call.
  supervisor: {
    _: "/activities/supervisor",
    _config: {
      title: "Supervisor View",
      requiresOrg: true,
      requiredRoles: ["admin"] as const,
    },
  },

  detail: {
    _: "/activities/[sessionId]",
    _config: {
      title: "Session Detail",
      requiresOrg: true,
      requiredRoles: ["admin"] as const,
    },
    _param: "sessionId",
    _paramPath: "/activities/[sessionId]",
    _paramConfig: {
      title: "Session Detail",
      requiresOrg: true,
      requiredRoles: ["admin"] as const,
    },
  },

  participate: {
    _: "/activities/[sessionId]/participate",
    _config: {
      title: "Participate",
      requiresOrg: true,
    },
    _param: "sessionId",
    _paramPath: "/activities/[sessionId]/participate",
    _paramConfig: {
      title: "Participate",
      requiresOrg: true,
    },
  },

  compliance: {
    _: "/activities/[sessionId]/compliance",
    _config: {
      title: "Compliance Report",
      requiresOrg: true,
      requiredRoles: ["admin"] as const,
    },
    _param: "sessionId",
    _paramPath: "/activities/[sessionId]/compliance",
    _paramConfig: {
      title: "Compliance Report",
      requiresOrg: true,
      requiredRoles: ["admin"] as const,
    },
  },
} as const;
