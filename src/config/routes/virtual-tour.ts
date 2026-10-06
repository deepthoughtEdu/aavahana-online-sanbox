export const virtualTourRoutes = {
  home: {
    _: "/virtual-tour",
    _config: {
      title: "Virtual Tour",
      description: "Observer virtual immersion experience",
    },
  },

  inception: {
    _: "/virtual-tour/inception",
    _config: {
      title: "Inception",
      description:
        "Pre-tour gate — experience the three values (Agency, Curiosity, Vulnerability) before Day 1 unlocks",
    },
  },

  day: {
    _: "/virtual-tour/day",
    _param: "dayNumber",
    _paramPath: "/virtual-tour/day/[dayNumber]",
    _paramConfig: {
      title: "Day View",
      description: "Virtual tour day content and drills",
    },
  },

  threadBuilder: {
    _: "/virtual-tour/thread-builder",
    _config: {
      title: "Thread Builder",
      description: "Capture observations and build threads",
    },
  },

  gratitudes: {
    _: "/virtual-tour/gratitudes",
    _config: {
      title: "Gratitudes",
      description: "Daily gratitude entries with scoring",
    },
  },

  journal: {
    _: "/virtual-tour/journal",
    _config: {
      title: "Spatial Journal",
      description: "Spatial awareness and observation log",
    },
  },

  rigor: {
    _: "/virtual-tour/rigor",
    _config: {
      title: "Rigor Builder",
      description: "Statement-Reason-Rigor critical thinking",
    },
  },

  simulatedWork: {
    _: "/virtual-tour/simulated-work",
    _config: {
      title: "Simulated Work",
      description: "Role simulation exercises",
    },
  },

  kickstart: {
    _: "/virtual-tour/kickstart",
    _config: {
      title: "Kickstart",
      description: "8 activities toward servant leadership",
    },
  },

  dashboard: {
    _: "/virtual-tour/dashboard",
    _config: {
      title: "Dashboard",
      description: "Tour progress and daily drill completion",
    },
  },

  aiAdtechPrep: {
    _: "/virtual-tour/ai-adtech-prep",
    _config: {
      title: "AI AdTech Preparation",
      description:
        "Industry POV questionnaire for Amazon Advertising operations candidates",
    },
  },

  adtechPractice: {
    _: "/virtual-tour/adtech-practice",
    _config: {
      title: "AdTech Metrics Practice",
      description:
        "Numbers + Narrative practice spreadsheet for Amazon Advertising metrics",
    },
  },

  designThinkingPrep: {
    _: "/virtual-tour/design-thinking-prep",
    _config: {
      title: "Design Thinking Preparation",
      description:
        "Design thinking practice module for practitioners",
    },
  },
} as const;
