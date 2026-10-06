import { UserRole } from "./types";

export const sdRoutes = {
  home: {
    _: "/sd",
    _config: {
      title: "Socratic Dialogues",
      description: "Saturday Fellow Sessions — collaborative dialogue and reflection",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
    },
  },

  session: {
    _param: "sessionId",
    _paramPath: "/sd/[sessionId]",
    _paramConfig: {
      title: "SD Session",
      description: "Live session — canvas, moderation, and coaching",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
    },
  },

  admin: {
    _: "/sd/admin",
    _config: {
      title: "SD Admin",
      description: "Engagement analytics and mediocrity detection",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER],
    },
  },
} as const;
