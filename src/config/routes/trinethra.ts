import { UserRole } from "./types";

export const trinethraRoutes = {
  home: {
    _: "/trinethra",
    _config: {
      title: "Supervisor Dashboard",
      description: "Trinethra supervisor overview",
    },
  },

  supervisor: {
    _: "/trinethra/supervisor",
    _config: {
      title: "Supervisor Dashboard",
      description: "Monitor team performance, insights, and direct report activity",
    },

    // Member detail — keyed by eid (SSOT A35; supersedes the contract's [uid]).
    _param: "eid",
    _paramPath: "/trinethra/supervisor/[eid]",
    _paramConfig: {
      title: "Member Detail",
      description: "Health breakdown, score trend, claims, and coaching for one team member",
    },
  },

  dailyReports: {
    _: "/trinethra/daily-reports",
    _config: {
      title: "Daily Reports",
      description: "Org-wide daily report browse and CSV export",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER],
      redirectTo: "/trinethra/supervisor",
    },
  },

  feedback: {
    _: "/trinethra/feedback",
    _config: {
      title: "Feedback",
      description: "Cross-layer feedback and scoring across L1, L2, and L3",
    },
  },

  leaves: {
    _: "/trinethra/leaves",
    _config: {
      title: "Leave Approvals",
      description: "Pending leave requests from your team awaiting decision",
    },
  },

  compliance: {
    _: "/trinethra/compliance",
    _config: {
      title: "Report Compliance",
      description: "Track report submission across the team and escalate non-compliance",
    },
  },

  eventLoop: {
    _: "/trinethra/event-loop",
    _config: {
      title: "Event Loop",
      description: "Live sprint operations — monitor team tasks, tickets, and sprint health",
    },
  },

  hvt: {
    _: "/trinethra/hvt",
    _config: {
      title: "HVT Experiments",
      description: "High-value test experiments",
    },

    ideas: {
      _: "/trinethra/hvt/ideas",
      _config: {
        title: "My Ideas",
        description: "Experiment ideas submitted by you",
      },

      new: {
        _: "/trinethra/hvt/ideas/new",
        _config: {
          title: "Suggest Experiment",
          description: "Submit a new experiment idea",
        },
      },
    },

    _param: "experimentId",
    _paramPath: "/trinethra/hvt/[experimentId]",
    _paramConfig: {
      title: "Experiment Detail",
      description: "View experiment details",
    },
  },

  intelligence: {
    _: "/trinethra/intelligence",
    _config: {
      title: "Constraint Intelligence",
      description: "Detected organizational constraints across your team, ranked by severity",
    },
  },

  insights: {
    _: "/trinethra/insights",
    _config: {
      title: "Management Insights",
      description: "Team and organization health reports assembled from detected signals",
    },
  },

  comms: {
    _: "/trinethra/comms",
    _config: {
      title: "Communication Center",
      description: "Escalations, employee ideas, and recognition in one unified view",
    },
  },
} as const;
