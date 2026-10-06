// src/lib/hooks/shared/use-redirect-authenticated.ts
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "./use-auth";
import { ROUTES } from "@/config/routes";

// Session-scoped memory of the last route visited outside /auth/*. Lets the
// auth-page guard send an already-logged-in visitor back to the module they
// came from (e.g. /mimamsaka) instead of dumping everyone into Aavahana.
const LAST_PATH_KEY = "dt:last-path";

/**
 * Record the current route as the "return to" target for the auth-page
 * guard. Mount once at app root (AuthProvider). Auth routes are skipped so
 * bouncing through /auth/login never overwrites where the user came from.
 */
export function useRememberLastPath(): void {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/auth")) return;
    try {
      sessionStorage.setItem(LAST_PATH_KEY, pathname);
    } catch {
      // Storage unavailable (private mode quota etc.) — guard falls back to default.
    }
  }, [pathname]);
}

function getLastPath(): string | null {
  try {
    return sessionStorage.getItem(LAST_PATH_KEY);
  } catch {
    return null;
  }
}

/**
 * Redirect already-authenticated users away from auth pages (login/signup).
 *
 * isAuthenticated comes from the server-verified session query (since the
 * auth-refactor, useAuth runs /api/auth/session on public routes too, so the
 * app knows you're signed in even on /auth/login). Gated on mounted to avoid an
 * SSR/client hydration mismatch (server always renders signed-out).
 *
 * Target resolution: ?invite token first, then ?redirect, then the last
 * non-auth route this tab visited (so arriving from /mimamsaka returns to
 * /mimamsaka, not Aavahana), then the default landing route.
 * If the cookie is actually dead the session query 401s, isAuthenticated stays
 * false, and the form renders — no redirect, no bounce.
 *
 * @returns true while the redirect is in flight — render a spinner, not the form.
 */
export function useRedirectIfAuthenticated(): boolean {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const shouldRedirect = mounted && isAuthenticated;

  useEffect(() => {
    if (!shouldRedirect) return;

    const inviteToken = searchParams.get("invite");
    let target = inviteToken
      ? `/invite/accept/${inviteToken}`
      : (searchParams.get("redirect") ??
        getLastPath() ??
        ROUTES.aavahana.dailyPlan._);
    target = decodeURIComponent(target);

    // Only allow same-origin path redirects ("/x" but not "//evil.com").
    if (!target.startsWith("/") || target.startsWith("//")) {
      target = ROUTES.aavahana.dailyPlan._;
    }

    router.replace(target);
  }, [shouldRedirect, router, searchParams]);

  return shouldRedirect;
}
