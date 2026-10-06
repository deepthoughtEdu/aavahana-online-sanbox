import { UserRole } from "./types";

export const ldiRoutes = {
  home: {
    _: "/ldi",
    _config: {
      title: "LDI Portal",
      description: "Leadership Development Initiative — reflection and reconstruction",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
    },
  },

  session: {
    _param: "id",
    _paramPath: "/ldi/sessions/[id]",
    _paramConfig: {
      title: "LDI Session",
      description: "Session detail — pitches and reflection",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
    },
  },

  canvas: {
    _param: "boardId",
    _paramPath: "/ldi/canvas/[boardId]",
    _paramConfig: {
      title: "Reconstruction Canvas",
      description: "Drag-and-drop reflection board",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
    },
  },

  history: {
    _: "/ldi/history",
    _config: {
      title: "My Reflections",
      description: "Past reflection boards and completion history",
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER],
    },
  },
} as const;
