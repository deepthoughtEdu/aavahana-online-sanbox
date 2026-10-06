import { UserRole } from "./types";

export const aavahanaRoutes = {
  dashboard: {
    _: "/aavahana/dashboard",
    _config: { title: "Dashboard", description: "Main dashboard overview" },
  },

  dailyPlan: {
    _: "/aavahana/daily-plan",
    _config: {
      title: "Daily Plan",
      requiredRoles: [UserRole.MEMBER, UserRole.ADMIN, UserRole.MANAGER],
      redirectTo: "/aavahana/dashboard",
      description: "Create and manage daily plans",
    },
  },

  learning: {
    _: "/aavahana/learning",
    _config: {
      title: "Learning",
      requiredRoles: [UserRole.MEMBER, UserRole.ADMIN, UserRole.MANAGER],
      redirectTo: "/aavahana/dashboard",
      description: "Your open suggestion and what you did with past ones",
    },
  },

  dailyReport: {
    _: "/aavahana/daily-report",
    _config: {
      title: "Daily Report",
      requiredRoles: [UserRole.MEMBER, UserRole.ADMIN, UserRole.MANAGER],
      redirectTo: "/aavahana/dashboard",
      description: "View daily activity reports",
    },
  },

  weeklyPlan: {
    _: "/aavahana/weekly-plan",
    _config: {
      title: "Weekly Plan",
      description: "View your weekly plan and deliverables",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
    },

    input: {
      _: "/aavahana/weekly-plan/input",
      _config: {
        title: "Plan Your Week",
        description: "Create and input your weekly plan",
        requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
      },
    },
  },

  weeklyPlanV2: {
    _: "/aavahana/weekly-plan-v2",
    _config: {
      title: "Weekly Plan",
      description: "Reflect on last week, plan this one — with AI assist",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
    },
  },

  weeklyReport: {
    _: "/aavahana/weekly-report",
    _config: {
      title: "Weekly Report",
      description: "Review your weekly accomplishments",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
    },
  },

  timetable: {
    _: "/aavahana/timetable",
    _config: {
      title: "AI Timetable",
      description: "Visual time blocking and schedule optimization",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
    },
  },

  analytics: {
    _: "/aavahana/analytics",
    _config: {
      title: "Analytics",
      description: "Time tracking, deliverable progress, and productivity insights",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
    },
  },

  monthlyPlan: {
    _: "/aavahana/monthly-plan",
    _config: {
      title: "Monthly Plan",
      description: "Deliverables, IP goals, and KPI targets for the month",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
    },
  },

  monthlyReport: {
    _: "/aavahana/monthly-report",
    _config: {
      title: "Monthly Report",
      description: "Comprehensive monthly achievements, KPIs, and growth tracking",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
    },
  },

  careerRunrate: {
    _: "/aavahana/career-runrate",
    _config: {
      title: "Career Runrate",
      description: "Planned, actual, and projected career trajectory",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
    },
  },

  leadershipPortfolio: {
    _: "/aavahana/leadership-portfolio",
    _config: {
      title: "Leadership Portfolio",
      description: "6-section leadership portfolio with LLM narrative",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
    },
  },

  feedback: {
    _: "/aavahana/feedback",
    _config: {
      title: "Feedback",
      description: "Bidirectional L1\u2194L2 feedback scoring",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
    },
  },

  engagementScore: {
    _: "/aavahana/engagement-score",
    _config: {
      title: "Engagement Score",
      description: "Usage-based participation score",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
    },
  },

  ip: {
    _: "/aavahana/ip",
    _config: {
      title: "IP & MyZone",
      description: "Intellectual property browser and commit tracker",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
    },
  },

  eventLoop: {
    _: "/aavahana/event-loop",
    _config: {
      title: "Event Loop",
      description: "Live sprint operations — tasks, tickets, and sprint health",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
    },
  },

  hvt: {
    _: "/aavahana/hvt",
    _config: {
      title: "High-Value Tests",
      description: "View experiments in your programs",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
    },

    _param: "experimentId",
    _paramPath: "/aavahana/hvt/[experimentId]",
    _paramConfig: {
      title: "Experiment Detail",
      description: "View experiment details",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
    },

    ideas: {
      _: "/aavahana/hvt/ideas",
      _config: {
        title: "My Experiment Ideas",
        description: "View your submitted experiment ideas",
        requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
      },

      new: {
        _: "/aavahana/hvt/ideas/new",
        _config: {
          title: "Submit Experiment Idea",
          description: "Suggest a new experiment for your program",
          requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
        },
      },
    },
  },

  communityQuiz: {
    _: "/aavahana/community-quiz",
    _config: {
      title: "Community Quiz",
      description: "Conceptual clarity through interpretation — group video quiz",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
    },

    _param: "quizId",
    _paramPath: "/aavahana/community-quiz/[quizId]",
    _paramConfig: {
      title: "Quiz Detail",
      description: "View quiz details and progress",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
    },

    manage: {
      _: "/aavahana/community-quiz/[quizId]/manage",
      _config: {
        title: "Manage Quiz",
        description: "Moderator panel for quiz management",
        requiredRoles: [UserRole.ADMIN, UserRole.MANAGER],
      },
    },

    respond: {
      _: "/aavahana/community-quiz/[quizId]/respond",
      _config: {
        title: "Respond",
        description: "Answer subjective questions",
        requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
      },
    },

    mcq: {
      _: "/aavahana/community-quiz/[quizId]/mcq",
      _config: {
        title: "MCQ Round",
        description: "Answer multiple-choice questions",
        requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
      },
    },

    scores: {
      _: "/aavahana/community-quiz/[quizId]/scores",
      _config: {
        title: "Scores",
        description: "View quiz scores",
        requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
      },
    },

    analytics: {
      _: "/aavahana/community-quiz/[quizId]/analytics",
      _config: {
        title: "Analytics",
        description: "Bait susceptibility analysis",
        requiredRoles: [UserRole.ADMIN, UserRole.MANAGER],
      },
    },
  },

  test: {
    _: "/aavahana/test",
    _config: {
      title: "Test Page",
      requiredRoles: [UserRole.ADMIN],
      redirectTo: "/aavahana/dashboard",
      description: "Testing and development page",
    },
  },

  examples: {
    _: "/aavahana/examples",
    _config: {
      title: "Examples",
      description: "UI component examples",
    },
  },

  intelligence: {
    _: "/aavahana/intelligence",
    _config: {
      title: "My Constraints",
      description: "Constraints detected from your plans and reports, with suggested improvements",
    },
  },
} as const;
