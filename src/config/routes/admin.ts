export const adminRoutes = {
  home: {
    _: "/admin",
    _config: {
      title: "Admin",
      description: "PDGMS organization administration",
    },
  },

  setup: {
    _: "/admin/setup",
    _config: {
      title: "Org Setup Wizard",
      description: "Configure your organization before onboarding users",
    },
    _param: "step",
    _paramPath: "/admin/setup/[step]",
    _paramConfig: {
      title: "Setup Step",
      description: "Organization setup step",
    },
  },

  onboarding: {
    _: "/admin/onboarding",
    _config: {
      title: "User Onboarding",
      description: "Manage user onboarding progress",
    },
    _param: "userId",
    _paramPath: "/admin/onboarding/[userId]",
    _paramConfig: {
      title: "User Onboarding",
      description: "Individual user onboarding tracker",
    },
  },

  enablers: {
    _: "/admin/enablers",
    _config: {
      title: "Enablers",
      description: "Manage organizational enablers and tools",
    },
  },

  programs: {
    _: "/admin/programs",
    _config: {
      title: "Programs",
      description: "Manage programs across the organization",
    },
  },

  observers: {
    _: "/admin/observers",
    _config: {
      title: "Observer Invites",
      description: "Invite and manage guest observers",
      requiredRoles: ["manager", "admin"],
    },
    _param: "eid",
    _paramPath: "/admin/observers/[eid]",
    _paramConfig: {
      title: "Observer Detail",
      description: "Deep view of an observer's tour progress",
      requiredRoles: ["manager", "admin"],
    },

    cohort: {
      _: "/admin/observers/cohort",
      _config: {
        title: "Cohort Dashboard",
        description: "Overview of all active observers",
        requiredRoles: ["manager", "admin"],
      },
    },

    content: {
      _: "/admin/observers/content",
      _config: {
        title: "Content Library",
        description: "Manage tour case studies and content",
        requiredRoles: ["manager", "admin"],
      },
    },

    templates: {
      _: "/admin/observers/templates",
      _config: {
        title: "Feedback Templates",
        description: "Manage Gemini feedback prompt templates",
        requiredRoles: ["manager", "admin"],
      },
    },

    cohorts: {
      _: "/admin/observers/cohorts",
      _config: {
        title: "Manage Cohorts",
        description: "Create and manage observer cohorts",
        requiredRoles: ["manager", "admin"],
      },
    },

    review: {
      _: "/admin/observers/review",
      _config: {
        title: "Observer Review",
        description: "Dropdown-based observer deep view review",
        requiredRoles: ["manager", "admin"],
      },
    },
  },

  fellows: {
    _: "/admin/fellows",
    _config: {
      title: "Fellow Invites",
      description: "Invite and manage fellows and employees",
      requiredRoles: ["manager", "admin"],
    },
  },

  organisations: {
    _: "/admin/organisations",
    _config: {
      title: "Organisations",
      description: "Create and manage organisations on the platform",
      requiredRoles: ["admin"],
    },
    _param: "orgId",
    _paramPath: "/admin/organisations/[orgId]",
    _paramConfig: {
      title: "Organisation Members",
      description: "Manage organisation members and roles",
      requiredRoles: ["admin"],
    },
  },

  crmInvites: {
    _: "/admin/crm-invites",
    _config: {
      title: "CRM Prospect Invites",
      description: "Invite CRM contacts to access the platform",
      requiredRoles: ["manager", "admin"],
    },
  },

  groups: {
    _: "/admin/groups",
    _config: {
      title: "Groups",
      description: "Organize employees into groups and mini-groups",
      requiredRoles: ["manager", "admin"],
    },
  },

  ubsConfig: {
    _: "/admin/ubs-config",
    _config: {
      title: "UBS Configuration",
      description: "Configure engagement drill weights per group",
      requiredRoles: ["manager", "admin"],
    },
  },
} as const;

export const payrollRoutes = {
  home: {
    _: "/payroll",
    _config: {
      title: "Team Attendance",
      description: "View team attendance summaries",
      requiredRoles: ["manager", "admin"],
    },
  },

  dashboard: {
    _: "/payroll/dashboard",
    _config: {
      title: "Payroll Dashboard",
      description: "Compute and review monthly payroll",
      requiredRoles: ["manager", "admin"],
    },
  },

  config: {
    _: "/payroll/config",
    _config: {
      title: "Payroll Config",
      description: "Configure payroll method, currency, and attendance settings",
      requiredRoles: ["manager", "admin"],
    },
  },

  access: {
    _: "/payroll/access",
    _config: {
      title: "Access Grants",
      description: "Grant scoped attendance and payroll viewing permissions",
      requiredRoles: ["manager", "admin"],
    },
  },
} as const;
