export const niyantaRoutes = {
  home: {
    _: "/niyanta",
    _config: {
      title: "Talking Documents",
      description: "Niyanta talking documents",
    },
  },

  create: {
    _: "/niyanta/create",
    _config: {
      title: "Create Document",
      description: "Create a new talking document",
    },
  },

  eventLoop: {
    _: "/niyanta/event-loop",
    _config: {
      title: "Event Loop",
      description: "Sprint event loop with L3 escalation approvals",
    },
  },

  aiShell: {
    _: "/niyanta/ai-shell",
    _config: {
      title: "AI Shell",
      description: "Conversational AI over your program context",
    },
  },

  growthCharter: {
    _: "/niyanta/growth-charter",
    _config: {
      title: "Growth Charter",
      description: "EBITDA bridge and growth charter overview",
    },
  },

  growthWorkflow: {
    _: "/niyanta/growth-workflow",
    _config: {
      title: "Growth Workflow",
      description: "Interactive growth workflow explorer",
    },
  },

  growthCharterDeal: {
    _: "/niyanta/growth-charter/[dealId]",
    _config: {
      title: "Growth Charter",
      description: "Node-driven growth charter for a deal",
    },
    _param: "dealId",
    _paramPath: "/niyanta/growth-charter/[dealId]",
  },

  growthWorkflowInstance: {
    _: "/niyanta/growth-workflow/[workflowId]",
    _config: {
      title: "Growth Workflow",
      description: "Node-driven growth workflow viewer",
    },
    _param: "workflowId",
    _paramPath: "/niyanta/growth-workflow/[workflowId]",
  },

  workshop: {
    _: "/niyanta/workshop/[workshopId]",
    _config: {
      title: "Workshop",
      description: "Workshop overview with workflow instances",
    },
    _param: "workshopId",
    _paramPath: "/niyanta/workshop/[workshopId]",
  },

  workshopScore: {
    _: "/niyanta/workshop/[workshopId]/workflow/[workflowId]/score",
    _config: {
      title: "Workshop Scoring",
      description: "Score W-nodes for a workflow during workshop",
    },
  },

  _param: "id",
  _paramPath: "/niyanta/[id]",
  _paramConfig: {
    title: "Document Viewer",
    description: "View and interact with a talking document",
  },
} as const;
