export const atsRoutes = {
  home: {
    _: "/ats",
    _config: { title: "ATS", requiresOrg: false },
  },

  apply: {
    _param: "oppId",
    _paramPath: "/ats/apply/[oppId]",
    _paramConfig: { title: "Apply", requiresOrg: false },
    success: {
      _: "/ats/apply/success",
      _config: { title: "Application Submitted", requiresOrg: false },
    },
  },

  consent: {
    _: "/ats/consent",
    _config: { title: "Consent", requiresOrg: false },
  },

  candidate: {
    dashboard: {
      _: "/ats/candidate",
      _config: { title: "Candidate Dashboard", requiresOrg: false },
    },
    opportunities: {
      _: "/ats/candidate/opportunities",
      _config: { title: "Browse Opportunities", requiresOrg: false },
      _param: "oppId",
      _paramPath: "/ats/candidate/opportunities/[oppId]",
      _paramConfig: { title: "Opportunity Details", requiresOrg: false },
    },
    applications: {
      _param: "appId",
      _paramPath: "/ats/candidate/applications/[appId]",
      _paramConfig: { title: "Application Progress", requiresOrg: false },
      rounds: {
        _param: "roundId",
        _paramPath: "/ats/candidate/applications/[appId]/rounds/[roundId]",
        _paramConfig: { title: "Round Submission", requiresOrg: false },
      },
      leaderboard: {
        _: "/ats/candidate/applications/[appId]/leaderboard",
        _config: { title: "Leaderboard", requiresOrg: false },
      },
    },
  },

  designer: {
    dashboard: {
      _: "/ats/designer",
      _config: { title: "Designer Dashboard", requiresOrg: false },
    },
    templates: {
      _: "/ats/designer/templates",
      _config: { title: "Round Templates", requiresOrg: false },
      create: {
        _: "/ats/designer/templates/create",
        _config: { title: "Create Template", requiresOrg: false },
      },
      _param: "templateId",
      _paramPath: "/ats/designer/templates/[templateId]",
      _paramConfig: { title: "Edit Template", requiresOrg: false },
    },
    processes: {
      _: "/ats/designer/processes",
      _config: { title: "Selection Processes", requiresOrg: false },
      create: {
        _: "/ats/designer/processes/create",
        _config: { title: "Create Process", requiresOrg: false },
      },
      _param: "processId",
      _paramPath: "/ats/designer/processes/[processId]",
      _paramConfig: { title: "Process Builder", requiresOrg: false },
    },
  },

  recruiter: {
    dashboard: {
      _: "/ats/recruiter",
      _config: { title: "Recruiter Dashboard", requiresOrg: false },
    },
    opportunities: {
      _: "/ats/recruiter/opportunities",
      _config: { title: "Opportunities", requiresOrg: false },
      create: {
        _: "/ats/recruiter/opportunities/create",
        _config: { title: "Create Opportunity", requiresOrg: false },
      },
      _param: "oppId",
      _paramPath: "/ats/recruiter/opportunities/[oppId]",
      _paramConfig: { title: "Opportunity Details", requiresOrg: false },
      applications: {
        _: "/ats/recruiter/opportunities/[oppId]/applications",
        _config: { title: "Review Applications", requiresOrg: false },
        _param: "appId",
        _paramPath: "/ats/recruiter/opportunities/[oppId]/applications/[appId]",
        _paramConfig: { title: "Candidate Review", requiresOrg: false },
      },
      leaderboard: {
        _: "/ats/recruiter/opportunities/[oppId]/leaderboard",
        _config: { title: "Admin Leaderboard", requiresOrg: false },
      },
    },
  },
} as const;
