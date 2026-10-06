// src/components/providers/NotificationProvider.tsx
"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/hooks/shared/use-auth";
import { useNotifications } from "@/lib/hooks/shared/use-notifications";
import { useSocket } from "@/lib/hooks/shared/use-socket";
import { PermissionPrompt } from "@/components/shared/notifications";
import { logger } from "@/lib/managers/logger";
import { registerServiceWorker } from "@/utils/shared/service-worker.utils";

/**
 * ============================================
 * NOTIFICATION PROVIDER
 * ============================================
 * Initializes notifications when user is authenticated
 * Manages lifecycle tied to authentication
 */

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user, isAuthenticated } = useAuth();

  // Initialize notifications for authenticated users
  useNotifications({
    uid: user?.uid ?? null,
    enabled: isAuthenticated,
    autoLoadHistory: true,
  });

  // Open Socket.IO connection to NodeBB for real-time notification delivery
  useSocket();

  // Get VAPID public key from environment
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  // Register service worker on mount
  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      logger.info("[NotificationProvider] User authenticated, notifications enabled", {
        uid: user.uid,
      });
    }
  }, [isAuthenticated, user]);

  return (
    <>
      {children}
      
      {/* Show permission prompt for authenticated users */}
      {isAuthenticated && user && (
        <PermissionPrompt
          uid={user.uid}
          vapidPublicKey={vapidPublicKey}
        />
      )}
    </>
  );
}
