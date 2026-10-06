// src/components/guards/RouteGuard.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/shared/use-auth';
import { usePermission } from '@/lib/hooks/shared/use-permission';
import { RouteGuardProps } from '@/types';
import { isPublicRoute } from '@/config/routes';
import { SpinnerIcon, BuildingIcon, WarningIcon, InfoIcon, MailIcon, RefreshIcon, LockIcon, HomeIcon, ArrowLeftIcon } from '@/components/shared/icons';
import { Button } from '../Button';
import { IconBox } from '../IconBox';
import { logger } from '@/lib/managers/logger';


export function RouteGuard({ children, requiredRoles, redirectTo }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading, hasRole, user } = useAuth();
  const { isAdmin, isManager } = usePermission();
  const isPublic = isPublicRoute(pathname);
  // Prevent redirect loops
  const hasRedirected = useRef(false);

  // Debug RouteGuard state when relevant values change (avoids calling isAdmin/isManager on every render)
  useEffect(() => {
    logger.debug('RouteGuard state', {
      isAuthenticated,
      loading,
      hasRole,
      user,
      isAdmin: isAdmin(),
      isManager: isManager(),
    });
  }, [isAuthenticated, loading, hasRole, user, isAdmin, isManager]);

  useEffect(() => {
    // Reset redirect flag when pathname changes
    hasRedirected.current = false;
  }, [pathname]);

  useEffect(() => {
    // Wait for auth to load
    if (loading) return;

    // Skip public routes
    if (isPublic) return;

    // Redirect unauthenticated users (only once)
    if (!isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      // Small delay to show the redirect message
      setTimeout(() => {
        // Redirect to login with return URL
        const returnUrl = encodeURIComponent(pathname);
        router.push(`/auth/login?redirect=${returnUrl}`);
      }, 1500);
      return;
    }

    // Check for organization requirement
    if (isAuthenticated && user && (!user.organizations || user.organizations.length === 0)) {
      // User has no org - stay on page but show error
      return;
    }

    if (redirectTo && requiredRoles && isAuthenticated && !hasRole(requiredRoles) && !hasRedirected.current) {
      hasRedirected.current = true;
      router.push(redirectTo);
      return;
    }

  }, [isAuthenticated, loading, pathname, isPublic, router, requiredRoles, hasRole, user, redirectTo]);

  // Public routes need no auth and MUST render on the server (crawlable content,
  // no loading-spinner gate). This makes AEO/marketing pages server-render their
  // body into the HTML instead of waiting for client-side auth to resolve.
  if (isPublic) {
    return <>{children}</>;
  }

  //  CHECK LOADING FIRST - before anything else
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

  //  ONLY show this after loading is complete
  // Show redirect message for unauthenticated users on protected routes
  if (!isAuthenticated && !isPublic) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-6 bg-base-200 z-50">
        <div className="card w-full max-w-md bg-white">
          <div className="card-body items-center text-center">
            <IconBox
              icon={<LockIcon size="xl" color="info" />}
              size='lg'
              shape='rounded'
              className='p-6 mb-4'
            />

            <h2 className="card-title text-2xl mb-2">Authentication Required!</h2>
            <p className="text-neutral mb-6">
              You need to be logged in to access this page. Redirecting you to the login page...
            </p>

            <div className="alert alert-info text-sm mb-6">
              <InfoIcon className='text-white' />
              <span className='text-white'>Please sign in to continue</span>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-center gap-2">
                <SpinnerIcon size="sm" color="info" />
                <span className="text-xs text-[var(--dt-textDim)]">Redirecting to login...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if authenticated but no organizations (skip public routes like /invite)
  if (!isPublic && isAuthenticated && user && (!user.organizations || user.organizations.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-base-200">
        <div className="card w-full max-w-md bg-white shadow-xl">
          <div className="card-body items-center text-center">
            <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mb-4">
              <BuildingIcon size="xl" color="warning" />
            </div>

            <h2 className="card-title text-2xl mb-2">No Organization Found</h2>
            <p className="text-neutral mb-6">
              You are not associated with any organization yet. Please contact your administrator to get access.
            </p>

            <div className="alert alert-info text-sm mb-6">
              <InfoIcon />
              <span>Your account is active, but needs organization assignment.</span>
            </div>

            <div className="card-actions flex-col w-full gap-2">
              <Button
                className="w-full"
                onClick={() =>
                (window.location.href =
                  "mailto:support@deepthought.education?subject=Organization Access Request")
                }
                iconBefore={<MailIcon />}
              >
                Contact Support
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => router.push("/login")}
                iconBefore={<RefreshIcon />}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if user doesn't have required role
  if (requiredRoles && isAuthenticated && !hasRole(requiredRoles)) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-base-200">
        <div className="card w-full max-w-md bg-white shadow-xl">
          <div className="card-body items-center text-center">
            <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mb-4">
              <LockIcon size="xl" color="error" />
            </div>

            <h2 className="card-title text-2xl mb-2">Access Denied</h2>
            <p className="text-neutral mb-6">
              You don&apos;t have permission to access this page. Please contact your administrator if you believe this is an error.
            </p>

            <div className="alert alert-warning text-sm mb-6">
              <WarningIcon />
              <span>Required role: {Array.isArray(requiredRoles) ? requiredRoles.join(', ') : requiredRoles}</span>
            </div>

            <div className="card-actions flex-col w-full gap-2">
              <Button
                className="w-full"
                onClick={() => router.push(redirectTo ?? "/aavahana/dashboard")}
                iconBefore={<HomeIcon />}
              >
                Go to Dashboard
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => router.back()}
                iconBefore={<ArrowLeftIcon />}
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  //  Public routes or authenticated users - render children
  return <>{children}</>;
}