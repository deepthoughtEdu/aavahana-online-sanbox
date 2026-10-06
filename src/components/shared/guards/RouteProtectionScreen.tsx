// src/components/providers/RouteProtectionScreen.tsx
"use client";

import { useRouter } from 'next/navigation';
import { Button } from '../Button';
import { IconBox } from '../IconBox';
import {
  SpinnerIcon,
  LockIcon,
  BuildingIcon,
  WarningIcon,
  InfoIcon,
  MailIcon,
  RefreshIcon,
  HomeIcon,
  ArrowLeftIcon,
} from '../icons';

type ProtectionType = 'unauthenticated' | 'no-organization' | 'insufficient-role';

interface RouteProtectionScreenProps {
  type: ProtectionType;
  requiredRoles?: string[];
  redirectTo?: string;
}

export function RouteProtectionScreen({
  type,
  requiredRoles,
  redirectTo,
}: RouteProtectionScreenProps) {
  const router = useRouter();

  // ============================================
  // UNAUTHENTICATED
  // ============================================
  if (type === 'unauthenticated') {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-6 bg-base-200 z-50">
        <div className="card w-full max-w-md bg-white shadow-2xl">
          <div className="card-body items-center text-center">
            <IconBox
              icon={<LockIcon size="xl" color="info" />}
              size="lg"
              shape="rounded"
              className="p-6 mb-4"
            />

            <h2 className="card-title text-2xl mb-2">Authentication Required</h2>
            <p className="text-neutral mb-6">
              You need to be logged in to access this page. Redirecting you to the login page...
            </p>

            <div className="alert alert-info text-sm mb-6">
              <InfoIcon className="text-white" />
              <span className="text-white">Please sign in to continue</span>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              <SpinnerIcon size="sm" color="info" />
              <span className="text-xs text-[var(--dt-textDim)]">Redirecting to login...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // NO ORGANIZATION
  // ============================================
  if (type === 'no-organization') {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-base-200">
        <div className="card w-full max-w-md bg-white shadow-xl">
          <div className="card-body items-center text-center">
            <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mb-4">
              <BuildingIcon size="xl" color="warning" />
            </div>

            <h2 className="card-title text-2xl mb-2">No Organization Found</h2>
            <p className="text-neutral mb-6">
              You are not associated with any organization yet. Please contact your administrator
              to get access.
            </p>

            <div className="alert alert-info text-sm mb-6">
              <InfoIcon />
              <span>Your account is active, but needs organization assignment.</span>
            </div>

            <div className="card-actions flex-col w-full gap-2">
              <Button
                className="w-full"
                onClick={() => {
                  window.location.href =
                    'mailto:support@deepthought.education?subject=Organization Access Request';
                }}
                iconBefore={<MailIcon />}
              >
                Contact Support
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => router.push('/auth/login')}
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

  // ============================================
  // INSUFFICIENT ROLE
  // ============================================
  if (type === 'insufficient-role') {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-base-200">
        <div className="card w-full max-w-md bg-white shadow-xl">
          <div className="card-body items-center text-center">
            <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mb-4">
              <LockIcon size="xl" color="error" />
            </div>

            <h2 className="card-title text-2xl mb-2">Access Denied</h2>
            <p className="text-neutral mb-6">
              You don&apos;t have permission to access this page. Please contact your
              administrator if you believe this is an error.
            </p>

            {requiredRoles && requiredRoles.length > 0 && (
              <div className="alert alert-warning text-sm mb-6">
                <WarningIcon />
                <span>Required role: {requiredRoles.join(', ')}</span>
              </div>
            )}

            <div className="card-actions flex-col w-full gap-2">
              <Button
                className="w-full"
                onClick={() => router.push(redirectTo || '/aavahana/dashboard')}
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

  // Fallback (should never reach here)
  return null;
}