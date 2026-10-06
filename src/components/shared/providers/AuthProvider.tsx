// src/components/providers/AuthProvider.tsx
"use client";

import { useAuth } from "@/lib/hooks/shared/use-auth";
import { useRememberLastPath } from "@/lib/hooks/shared/use-redirect-authenticated";
import { Sidebar } from "@/components/shared/Sidebar";
import { usePathname, useRouter } from "next/navigation";
import { getRouteConfig, isPublicRoute, routes } from "@/config/routes"; // ← Changed here
import { useState, useEffect, useRef, useMemo } from "react";
import { useAtom, useAtomValue } from "jotai";
import { sidebarOpenAtom, sidebarOverrideAtom, tourDayAtom } from "@/lib/store/auth";
import { resolveModuleMenu, resolveNavModuleOrDefault } from "@/config/modules";
import { MenuIcon, SpinnerIcon } from "../icons";
import { RouteProtectionScreen } from "../guards/RouteProtectionScreen";
import { AppHeader } from "@/components/shared/AppHeader";
import { CommandPalette } from "@/components/shared/command-palette";
import { NotificationProvider } from "./NotificationProvider";
import { ConsentGate } from "@/components/shared/modals/ConsentGate";
import { CookieNotice } from "@/components/shared/CookieNotice";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated, user, hasRole } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const hasRedirected = useRef(false);

  const routeConfig = getRouteConfig(pathname);
  const isPublic = isPublicRoute(pathname);

  // Remember the last non-auth route so /auth/login can send an
  // already-logged-in visitor back where they came from.
  useRememberLastPath();

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset redirect flag on pathname change
  useEffect(() => {
    hasRedirected.current = false;
  }, [pathname]);

  // Handle all redirects after loading
  useEffect(() => {
    if (loading || !isMounted) return;
    if (isPublic) return;

    // Redirect unauthenticated users — cancellable (auth-refactor Step 5).
    // The timer is cleared on cleanup, so if the session query resolves to
    // authenticated before the grace period elapses, the effect re-runs, the
    // pending redirect is cancelled, and a late-arriving session is NOT bounced
    // to login (the previous uncancelled setTimeout caused that intermittent bug).
    if (!isAuthenticated && !hasRedirected.current) {
      // The query string rides along: the profile link opens /growth?tab=<section>
      // in a new window, and a reader who has to sign in first should still land
      // on the section they clicked. LoginForm already honours a query on the target.
      const returnUrl = encodeURIComponent(pathname + window.location.search);
      const timer = setTimeout(() => {
        hasRedirected.current = true;
        router.push(`${routes.auth.login()}?redirect=${returnUrl}`);
      }, 1500);
      return () => clearTimeout(timer);
    }

    // Check organization requirement
    if (
      isAuthenticated &&
      user &&
      routeConfig?.requiresOrg &&
      (!user.organizations || user.organizations.length === 0)
    ) {
      return;
    }

    // Redirect users without required roles
    if (
      isAuthenticated &&
      routeConfig?.requiredRoles &&
      !hasRole(routeConfig.requiredRoles) &&
      !hasRedirected.current
    ) {
      hasRedirected.current = true;
      router.push(routeConfig.redirectTo || routes.dashboard()); // ← Also use routes here
      return;
    }
  }, [
    loading,
    isMounted,
    isAuthenticated,
    isPublic,
    pathname,
    router,
    routeConfig,
    hasRole,
    user,
  ]);

  const tourDay = useAtomValue(tourDayAtom);
  const [sidebarOpen, setSidebarOpen] = useAtom(sidebarOpenAtom);

  // Which product owns this page, and what its sidebar contains. The 15-branch
  // pathname if-chain that used to live here is now src/config/modules.ts, so the
  // sidebar and the command palette read one registry instead of two lists that drift.
  // Must be above all early returns to satisfy Rules of Hooks.
  const navModule = resolveNavModuleOrDefault(pathname);
  const sidebarConfig = useMemo(
    () => ({
      moduleName: navModule.label,
      navItems: resolveModuleMenu(navModule, { tourDay }),
    }),
    [navModule, tourDay]
  );

  const sidebarOverride = useAtomValue(sidebarOverrideAtom);
  const effectiveSidebar = sidebarOverride ?? sidebarConfig;

  // ============================================
  // RENDER LOGIC
  // ============================================

  // Public routes server-render their content immediately, before the client
  // mount gate below. The app is otherwise client-rendered (returns null until
  // mounted), which would leave public/AEO pages with an empty server HTML body.
  // Crawlers need the content in the server HTML, so public routes bypass the gate.
  if (isPublic) {
    return (
      <>
        {children}
        <CookieNotice />
      </>
    );
  }

  // Prevent flash during SSR/initial mount
  if (!isMounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-200">
        <div className="flex flex-col items-center gap-4">
          <SpinnerIcon size="lg" color="primary" />
          <p className="text-sm text-neutral">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isPublic) {
    return <RouteProtectionScreen type="unauthenticated" />;
  }

  if (
    isAuthenticated &&
    user &&
    routeConfig?.requiresOrg &&
    (!user.organizations || user.organizations.length === 0)
  ) {
    return <RouteProtectionScreen type="no-organization" />;
  }

  // Authenticated but insufficient role
  if (
    routeConfig?.requiredRoles &&
    isAuthenticated &&
    !hasRole(routeConfig.requiredRoles)
  ) {
    return (
      <RouteProtectionScreen
        type="insufficient-role"
        requiredRoles={routeConfig.requiredRoles}
        redirectTo={routeConfig.redirectTo}
      />
    );
  }

  // Public routes - render without sidebar
  if (isPublic) {
    return (
      <>
        {children}
        <CookieNotice />
      </>
    );
  }

  // Client-facing Growth Space (/growth/[dealId]) is authenticated but renders
  // standalone — it carries its own header + sidebar (Charter / Workflows /
  // Deliverables / Proposal), so the global app chrome (module sidebar,
  // AppHeader, footer) must NOT wrap it.
  if (pathname.startsWith("/growth/")) {
    return (
      <NotificationProvider>
        <CookieNotice />
        {children}
      </NotificationProvider>
    );
  }

  // A kit session is a place you enter and leave, and every state it runs has a
  // condition the app chrome breaks. Free Play requires no audience and the
  // frame carries a greeting, a search box and an unread count. Safety requires
  // that answering honestly visibly costs nothing, and a link reading Supervisor
  // View sits beside the box they are writing in. Hook requires the moment to
  // arrive with nothing competing. None of the frame serves any state of the
  // Transformation Ontology, and by its own rule a moment that serves no state
  // comes out. The session carries its own way back.
  if (/^\/activities\/kits\/[^/]+\/\d+/.test(pathname)) {
    return (
      <NotificationProvider>
        <CookieNotice />
        {children}
      </NotificationProvider>
    );
  }

  // Protected routes - render with sidebar
  return (
    <NotificationProvider>
      {/* DPDP/GDPR first-run consent gate — self-gates on consent status + org context */}
      <ConsentGate />
      {/* DPDP/GDPR cookie transparency notice (one essential cookie, no trackers) */}
      <CookieNotice />
      <Sidebar moduleName={effectiveSidebar.moduleName} navItems={effectiveSidebar.navItems} />
      {/* Cmd/Ctrl+K navigation search. Mounted HERE, past every early return above, so it
          is absent from public routes, /growth/[dealId], the loading screen and the
          access-denied screens by construction rather than by a runtime check. */}
      <CommandPalette />

      {/* Main Content Area */}
      <div className="dt-app-shell lg:pl-76 min-h-screen bg-white flex flex-col">
        {/* Mobile Header — visible only on small screens */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-base-300 z-30 flex items-center px-4">
          {/* Opens the drawer via sidebarOpenAtom. Sidebar already owns the backdrop,
              the close button and the close-on-navigate, all off the same atom — this
              button simply had no onClick, so the sidebar was unreachable on mobile. */}
          <button
            className="btn btn-ghost btn-square btn-sm"
            aria-label="Open menu"
            aria-expanded={sidebarOpen}
            aria-controls="dt-sidebar"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon />
          </button>
          <span className="ml-3 font-bold text-lg">DeepThought</span>
        </div>

        {/* App Header — sticky top bar with notifications */}
        <div className="pt-14 lg:pt-0">
          <AppHeader moduleName={effectiveSidebar.moduleName} />
        </div>

        {/* Page Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-6 bg-base-200">
          {children}
        </div>

        {/* Footer — DPDP/GDPR privacy policy link */}
        <footer className="border-t border-base-300 bg-base-200 px-6 py-3 text-xs text-base-content/50">
          <a href="/privacy-policy" className="link" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
        </footer>
      </div>
    </NotificationProvider>
  );
}
