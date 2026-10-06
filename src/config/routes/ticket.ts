import { UserRole } from "./types";

export const ticketRoutes = {
  home: {
    _: "/ticket",
    _config: {
      title: "Support Tickets",
      description: "Raise and track support tickets",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
    },
  },

  detail: {
    _param: "id",
    _paramPath: "/ticket/[id]",
    _paramConfig: {
      title: "Ticket Detail",
      description: "View ticket details and conversation",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
    },
  },

  agent: {
    _: "/ticket-agent",
    _config: {
      title: "Agent Queue",
      description: "Resolve assigned support tickets",
      requiredRoles: [UserRole.ADMIN, UserRole.TICKET_AGENT, UserRole.TICKET_ADMIN],
    },
  },

  commandCenter: {
    _: "/ticket-commandcenter",
    _config: {
      title: "Ticket Command Center",
      description: "Ticket resolution analytics and oversight",
      requiredRoles: [UserRole.ADMIN, UserRole.TICKET_ADMIN],
    },
  },
} as const;
