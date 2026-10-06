// src/lib/hooks/use-auth.ts
import React, { useEffect, useCallback, useRef } from "react";
import { useAtom } from "jotai";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, usePathname } from "next/navigation";
import { authAtom, selectedOrgAtom, selectedDeptAtom, userRoleAtom, ticketRoleAtom, currentProgramsAtom } from "@/lib/store/auth";
import { setApiContext, clearApiContext, clearCsrfToken, isError } from "@/lib/api/client";
import { UserRole } from "@/types";
import { matchesRole } from "@/lib/auth/role-match";
import { clearAllCookies } from "@/utils";
import { useApi } from "./use-api";
import { AuthService, EmployeeService } from "@/lib/services";
import { logger } from "@/lib/managers/logger";
import { isPublicRoute } from "@/config/routes";


// Routes where a user may be authenticated but in a transitional state
// (no org, no employment, pending setup). Auth errors on these routes
// must NOT trigger a hard clear — the session is valid, just incomplete.
const TRANSITIONAL_ROUTE_PREFIXES = [
  "/invite/",
  "/onboarding/",
  "/org-setup/",
];

function isTransitionalRoute(pathname: string): boolean {
  return TRANSITIONAL_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [auth, setAuth] = useAtom(authAtom);
  const [selectedOrg] = useAtom(selectedOrgAtom);
  const [selectedDept] = useAtom(selectedDeptAtom);
  const [userRole] = useAtom(userRoleAtom);
  const [ticketRole] = useAtom(ticketRoleAtom);
  const [currentPrograms, setCurrentPrograms] = useAtom(currentProgramsAtom);

  const authErrorHandledRef = useRef(false);
  const prevUserIdRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);
  const isPublic = isPublicRoute(pathname);

  // Eagerly sync apiContext from the persisted Jotai atom so that queries
  // firing on mount already have the org header. The useEffect below is
  // too late — it runs after mount, but TanStack Query fires during mount.
  if (auth.isAuthenticated && auth.selectedOrgId) {
    setApiContext("organizationId", auth.selectedOrgId);
  }
  if (auth.user?.uid) {
    setApiContext("uid", String(auth.user.uid));
  }

  // Soft clear: reset atoms only — session cookie stays intact.
  // Use for transitional states (no org yet, pending setup, invite flow).
  const softClearAuth = useCallback(() => {
    authErrorHandledRef.current = true;
    setAuth(prev => ({ ...prev, loading: false }));
  }, [setAuth]);

  // Hard clear: wipe everything — cookies, storage, caches, atoms.
  // Use for genuine logout or expired/invalid sessions.
  const clearAuthState = useCallback(
    (redirect: boolean = false) => {
      // Do NOT reset authErrorHandledRef here. clearAuthState() calls
      // queryClient.clear(), which would re-enable + refetch the session query;
      // resetting the guard would let an auth error immediately re-trigger this
      // same path → "Maximum update depth exceeded" infinite loop. The guard is
      // reset on navigation (the pathname effect below) and on full reload at
      // login, which is the correct time to re-check the session.
      prevUserIdRef.current = null;
      isInitializedRef.current = false;

      clearAllCookies();
      clearApiContext();
      clearCsrfToken();
      queryClient.clear();

      setAuth({
        user: null,
        selectedOrgId: null,
        selectedDeptId: null,
        selectedProgramId: null,
        isAuthenticated: false,
        loading: false,
      });
      setCurrentPrograms([]);

      if (redirect) {
        router.push("/auth/login");
      }
    },
    [queryClient, setAuth, setCurrentPrograms, router]
  );

  // Reset the auth-error guard on navigation so each route re-checks the session.
  useEffect(() => {
    authErrorHandledRef.current = false;
  }, [pathname]);

  // Fetch user profile
  const {
    data: userResult,
    isLoading,
    error: queryError,
  } = useApi({
    queryFn: AuthService.me,
    queryKey: ["auth", "me"],
    retry: false,
    retryOnMount: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    // Run on EVERY route, including public ones (/, /auth/login, landing pages).
    // The app must know whether you're signed in even on public pages so it can
    // redirect you off /auth/login and show signed-in UI on the landing page.
    // Cached (staleTime Infinity, shared key) → still one request per session.
    enabled: !authErrorHandledRef.current,
  });

  // Fetch employee record (eid + programs) once org context is ready
  const { data: employeeResult } = useApi({
    queryFn: EmployeeService.getMe,
    queryKey: ["employee-me", auth.selectedOrgId],
    retry: false,
    retryOnMount: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    enabled: auth.isAuthenticated && !!auth.selectedOrgId && !pathname.startsWith("/invite/"),
  });

  const hasError = queryError ? true : false;

  // Get uid for stable memoization
  const userUid =
    userResult && !isError(userResult) ? userResult.user?.uid : null;

  const user = React.useMemo(() => {
    if (!userResult || isError(userResult)) return null;

    const userData = userResult.user || userResult;
    return {
      ...userData,
      organizations: userData.organizations || [],
      employments: userData.employments || [],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userUid]);

  // Centralized auth state management.
  // auth-refactor Steps 4+5: the /api/auth/session query (AuthService.me) is the
  // SINGLE source of truth — no localStorage('verified') flag, no
  // hasSessionCookie() gate. This runs on EVERY route so isAuthenticated is known
  // on public pages too (login redirect, signed-in landing UI); only PROTECTED
  // routes trigger a hard clear + redirect on failure.
  useEffect(() => {
    // Auth error (no valid session).
    // On a PUBLIC route (/, /auth/login, landing pages) or a TRANSITIONAL route
    // (invite/onboarding — session valid but incomplete), settle as logged-out
    // WITHOUT wiping cookies or redirecting: the user is already somewhere they
    // are allowed to be. Only a protected route triggers the hard clear+redirect.
    if (hasError && !authErrorHandledRef.current) {
      if (isPublic || isTransitionalRoute(pathname)) {
        softClearAuth();
        return;
      }
      logger.error("Auth error, clearing session", queryError);
      authErrorHandledRef.current = true;
      // Clear state only; AuthProvider owns the redirect (it preserves returnUrl).
      clearAuthState(false);
      return;
    }

    // Session query still in flight.
    if (isLoading) {
      if (!auth.loading) {
        setAuth((prev) => ({ ...prev, loading: true }));
      }
      return;
    }

    // Session resolved with a user → authenticated.
    if (user?.uid && !authErrorHandledRef.current) {
      const userId = user.uid;
      const defaultOrgId = user.organizations?.[0]?.orgId || null;
      const defaultDeptId = user.membership?.department || null;

      // Only update if user changed or this is first load
      if (prevUserIdRef.current !== userId) {
        // Reset stale per-user request headers before stamping the new user so
        // user-A's uid/org/eid can never ride under user-B's session.
        clearApiContext();
        prevUserIdRef.current = userId as number;

        setAuth((prev) => {
          const newSelectedOrgId = prev.selectedOrgId || defaultOrgId;
          const newSelectedDeptId = prev.selectedDeptId || defaultDeptId;
          return {
            user,
            selectedOrgId: newSelectedOrgId,
            selectedDeptId: newSelectedDeptId,
            selectedProgramId: prev.selectedProgramId,
            isAuthenticated: true,
            loading: false,
          };
        });

        setApiContext("uid", String(userId));

        if (defaultOrgId) {
          setApiContext("organizationId", defaultOrgId);
        }

        if (defaultDeptId) {
          setApiContext("departmentId", defaultDeptId);
        }
      } else if (!isInitializedRef.current) {
        if (auth.loading) {
          setAuth((prev) => ({ ...prev, loading: false }));
        }
      }

      isInitializedRef.current = true;
    } else if (!isLoading && !user && !hasError) {
      if (auth.loading || !isInitializedRef.current) {
        setAuth((prev) => ({ ...prev, loading: false }));
        isInitializedRef.current = true;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, isLoading, hasError, isPublic, pathname]);

  // Sync API context with selected org, department, and eid
  useEffect(() => {
    if (auth.isAuthenticated && auth.selectedOrgId) {
      setApiContext("organizationId", auth.selectedOrgId);

      // Derive eid from session employments for this org
      const employment = auth.user?.employments?.find(e => e.orgId === auth.selectedOrgId);
      if (employment?.eid != null) {
        setApiContext("eid", String(employment.eid));
      } else {
        setApiContext("eid", null);
      }
    }

    if (auth.isAuthenticated && auth.selectedDeptId) {
      setApiContext("departmentId", auth.selectedDeptId);
    } else {
      setApiContext("departmentId", null);
    }
  }, [auth.selectedOrgId, auth.selectedDeptId, auth.isAuthenticated, auth.user?.employments]);

  // Process employee record → populate programs + auto-select first program
  useEffect(() => {
    if (!employeeResult || isError(employeeResult)) return;
    const programs = employeeResult.programs || [];
    setCurrentPrograms(programs);
    if (programs.length > 0) {
      setAuth((prev) => ({
        ...prev,
        selectedProgramId: prev.selectedProgramId || programs[0].id,
      }));
    }
  }, [employeeResult, setCurrentPrograms, setAuth]);

  const logoutMutation = useMutation({
    mutationFn: () => AuthService.logout(),
    onSuccess: () => {
      clearAuthState(false);
    },
    onSettled: () => {
      router.push("/auth/login");
    },
  });

  const switchOrg = useCallback(
    (orgId: string) => {
      setAuth((prev) => ({ ...prev, selectedOrgId: orgId, selectedDeptId: null, selectedProgramId: null }));
      setCurrentPrograms([]);
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] !== "users",
      });
    },
    [setAuth, setCurrentPrograms, queryClient]
  );

  const switchDept = useCallback(
    (deptId: string | null) => {
      setAuth((prev) => ({ ...prev, selectedDeptId: deptId }));
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] !== "users",
      });
    },
    [setAuth, queryClient]
  );

  const switchProgram = useCallback(
    (programId: string) => {
      setAuth((prev) => ({ ...prev, selectedProgramId: programId }));
    },
    [setAuth]
  );

  // Delegates to the shared matcher so the nav layer (navAccessAtom) and these 61
  // call sites can never drift. Semantics unchanged: flat OR, no hierarchy.
  const hasRole = useCallback(
    (roles: UserRole | UserRole[]) => matchesRole(roles, { userRole, ...ticketRole }),
    [userRole, ticketRole]
  );

  const selectedProgram = currentPrograms.find(p => p.id === auth.selectedProgramId) || currentPrograms[0] || null;
  const eid = auth.user?.employments?.find(e => e.orgId === auth.selectedOrgId)?.eid ?? null;

  return {
    user: auth.user,
    selectedOrg,
    selectedDept,
    selectedProgram,
    eid,
    currentPrograms,
    isAuthenticated: auth.isAuthenticated,
    loading: auth.loading || isLoading,
    userRole,
    hasRole,
    logout: logoutMutation.mutate,
    switchOrg,
    switchDept,
    switchProgram,
  };
}
