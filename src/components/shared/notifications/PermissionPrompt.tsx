// src/components/notifications/PermissionPrompt.tsx
"use client";

import { useState } from "react";
import { useWebPush } from "@/lib/hooks/shared/use-web-push";
import { BellIcon, CloseIcon } from "@/components/shared/icons";
import { clsx } from "clsx";

/**
 * ============================================
 * PERMISSION PROMPT COMPONENT
 * ============================================
 * Prompts user to enable browser push notifications
 */

interface PermissionPromptProps {
  uid: number | null;
  vapidPublicKey?: string;
}

export function PermissionPrompt({ uid, vapidPublicKey }: PermissionPromptProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const { shouldShowPrompt, subscribe, isLoading } = useWebPush({
    uid,
    enabled: !!uid,
    vapidPublicKey,
  });

  // Don't show if dismissed, not needed, or already handling
  if (isDismissed || !shouldShowPrompt) {
    return null;
  }

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      setIsDismissed(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <div className="card bg-white shadow-xl border border-base-300">
        <div className="card-body p-4">
          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="btn btn-xs btn-ghost btn-circle absolute top-2 right-2"
            aria-label="Dismiss"
          >
            <CloseIcon size="sm" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-primary/10 rounded-full">
              <BellIcon size="lg" className="text-primary" />
            </div>
          </div>

          {/* Content */}
          <h3 className="text-lg font-semibold text-center mb-2">
            Enable Notifications
          </h3>
          <p className="text-sm text-neutral text-center mb-4">
            Stay updated with real-time notifications even when you&apos;re not on this page.
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="btn btn-sm btn-ghost flex-1"
              disabled={isLoading}
            >
              Maybe Later
            </button>
            <button
              onClick={handleEnable}
              className={clsx(
                "btn btn-sm btn-primary flex-1",
                isLoading && "loading"
              )}
              disabled={isLoading}
            >
              {isLoading ? "Enabling..." : "Enable"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
