import { UserRole } from "./types";

export const welcomeRoutes = {
  home: {
    _: "/welcome",
    _config: {
      title: "Welcome",
      description: "New fellow onboarding welcome page",
      requiredRoles: [UserRole.USER, UserRole.MEMBER, UserRole.ADMIN, UserRole.MANAGER],
      redirectTo: "/auth/login",
    },
  },

  progress: {
    _: "/welcome/progress",
    _config: {
      title: "Onboarding Progress",
      description: "Track your onboarding steps",
      requiredRoles: [UserRole.USER, UserRole.MEMBER, UserRole.ADMIN, UserRole.MANAGER],
      redirectTo: "/welcome",
    },
  },

  fellowship: {
    _: "/welcome/fellowship",
    _config: {
      title: "Fellowship",
      description: "Explore the DeepThought Fellowship",
      requiredRoles: [UserRole.USER, UserRole.MEMBER, UserRole.ADMIN, UserRole.MANAGER],
      redirectTo: "/welcome",
    },
  },

  caseFiles: {
    _: "/welcome/case-files",
    _config: {
      title: "Case Files",
      description: "Transformation case studies",
      requiredRoles: [UserRole.USER, UserRole.MEMBER, UserRole.ADMIN, UserRole.MANAGER],
      redirectTo: "/welcome",
    },
  },

  testimonials: {
    _: "/welcome/testimonials",
    _config: {
      title: "Testimonials",
      description: "Industry leader testimonials",
      requiredRoles: [UserRole.USER, UserRole.MEMBER, UserRole.ADMIN, UserRole.MANAGER],
      redirectTo: "/welcome",
    },
  },

  heritage: {
    _: "/welcome/heritage",
    _config: {
      title: "Heritage",
      description: "The Sciensation heritage",
      requiredRoles: [UserRole.USER, UserRole.MEMBER, UserRole.ADMIN, UserRole.MANAGER],
      redirectTo: "/welcome",
    },
  },

  leadership: {
    _: "/welcome/leadership",
    _config: {
      title: "Leadership",
      description: "Meet the DeepThought team",
      requiredRoles: [UserRole.USER, UserRole.MEMBER, UserRole.ADMIN, UserRole.MANAGER],
      redirectTo: "/welcome",
    },
  },
} as const;
