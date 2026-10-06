export const mimamsakaRoutes = {
  home: {
    _: "/mimamsaka",
    _config: {
      title: "Programs Home",
      description: "Mimamsaka programs overview",
    },
  },

  explore: {
    _: "/mimamsaka/explore",
    _config: {
      title: "Explore Programs",
      description: "Explore available programs",
    },
  },

  program: {
    intake: {
      _: "/mimamsaka/program/intake",
      _config: {
        title: "Program Intake",
        description: "Create a new program",
      },
    },

    _param: "name",
    _paramPath: "/mimamsaka/program/[name]",
    _paramConfig: {
      title: "Program Details",
      description: "View program details",
    },

    attention: {
      _: "/mimamsaka/program/[name]/attention",
      _config: {
        title: "Attention Surface",
        description: "Program attention surface",
      },
    },

    eventLoop: {
      _: "/mimamsaka/program/[name]/event-loop",
      _config: {
        title: "Event Loop",
        description: "Program event loop",
      },
    },

    alignment: {
      _: "/mimamsaka/program/[name]/alignment",
      _config: {
        title: "Alignment",
        description: "Program alignment and presentation",
      },
    },

    sketches: {
      _: "/mimamsaka/program/[name]/sketches",
      _config: {
        title: "Flow Sketch",
        description: "Flow sketches belonging to this program",
      },
    },

    sprintReview: {
      _: "/mimamsaka/program/[name]/sprint-review",
      _config: {
        title: "Sprint Review",
        description: "Program sprint review",
      },
    },

    hvt: {
      _: "/mimamsaka/program/[name]/hvt",
      _config: {
        title: "HVT Experiments",
        description: "Program experiment tracker",
      },

      _param: "experimentId",
      _paramPath: "/mimamsaka/program/[name]/hvt/[experimentId]",
      _paramConfig: {
        title: "Experiment Detail",
        description: "View experiment details",
      },
    },

    verification: {
      _: "/mimamsaka/program/[name]/verification",
      _config: {
        title: "Verification Queue",
        description: "Review and verify L1 framework claims",
      },
    },

    qaDashboard: {
      _: "/mimamsaka/program/[name]/qa-dashboard",
      _config: {
        title: "QA Dashboard",
        description: "Spec quality and QA gate status",
      },
    },

    constraints: {
      _: "/mimamsaka/program/[name]/constraints",
      _config: {
        title: "Constraint Routing",
        description: "Triage and route constraint signals",
      },
    },

    reports: {
      _: "/mimamsaka/program/[name]/reports",
      _config: {
        title: "Reports",
        description: "L1 report compliance and summaries",
      },
    },

    feedback: {
      _: "/mimamsaka/program/[name]/feedback",
      _config: {
        title: "Feedback & Scoring",
        description: "Rubric-based scoring and supervisor feedback",
      },
    },

    members: {
      _: "/mimamsaka/program/[name]/members",
      _config: {
        title: "Members & Handover",
        description: "Program membership and handover management",
      },
    },

    diagnostics: {
      _: "/mimamsaka/program/[name]/diagnostics",
      _config: {
        title: "Program Diagnostics",
        description: "Constraint heatmaps, cycle time, and spec chains",
      },
    },

    notifications: {
      _: "/mimamsaka/program/[name]/notifications",
      _config: {
        title: "Notifications",
        description: "Notification rules and preferences",
      },
    },

    planCascade: {
      _: "/mimamsaka/program/[name]/plan-cascade",
      _config: {
        title: "Plan Cascade",
        description: "Weekly and daily basket management",
      },
    },

    charter: {
      _: "/mimamsaka/program/[name]/charter",
      _config: {
        title: "Growth Charter",
        description: "Program growth charter document",
      },
    },

    workflows: {
      _: "/mimamsaka/program/[name]/workflows",
      _config: {
        title: "Growth Workflows",
        description: "Program growth workflow documents",
      },

      _param: "slug",
      _paramPath: "/mimamsaka/program/[name]/workflows/[slug]",
      _paramConfig: {
        title: "Workflow Detail",
        description: "View growth workflow details",
      },
    },
  },

  hvt: {
    _: "/mimamsaka/hvt",
    _config: {
      title: "HVT Explorer",
      description: "Cross-program experiment portfolio",
    },
  },

  sketches: {
    _: "/mimamsaka/sketches",
    _config: {
      title: "Flow Sketches",
      description: "Think a program through as a flowchart before it starts",
    },
    detail: {
      _paramPath: "/mimamsaka/sketches/[id]",
      _config: {
        title: "Flow Sketch",
        description: "Write the program as lines and read it back as a flowchart",
      },
    },
  },
} as const;
