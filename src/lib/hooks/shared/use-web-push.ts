// src/lib/hooks/use-web-push.ts
import { useEffect, useCallback, useState } from "react";
import { useSetAtom } from "jotai";
import { setPushPermissionAtom, setPushSubscribedAtom } from "@/lib/store/notifications";
import { NotificationService } from "@/lib/services";
import { isError } from "@/lib/api/client";
import { logger } from "@/lib/managers/logger";
import { PushSubscriptionData } from "@/types";
import toast from "react-hot-toast";

/**
 * ============================================
 * USE WEB PUSH HOOK
 * ============================================
 * Manages browser push notification permissions and subscriptions
 */

export interface UseWebPushOptions {
  uid: number | null;
  enabled?: boolean;
  vapidPublicKey?: string;
}

/**
 * Convert base64 string to Uint8Array for VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * A VAPID public key is an uncompressed P-256 point: 65 bytes starting with 0x04.
 * Catching a malformed key here turns an opaque browser InvalidAccessError into
 * a named cause (the usual one is a stale key in the deploy environment).
 */
function isValidVapidKey(base64String: string): boolean {
  try {
    const bytes = urlBase64ToUint8Array(base64String);
    return bytes.length === 65 && bytes[0] === 4;
  } catch {
    return false;
  }
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function useWebPush(options: UseWebPushOptions) {
  const { uid, enabled = true, vapidPublicKey } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const setPushPermission = useSetAtom(setPushPermissionAtom);
  const setPushSubscribed = useSetAtom(setPushSubscribedAtom);

  /**
   * Check if push notifications are supported
   */
  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window;

    setIsSupported(supported);

    if (supported) {
      const currentPermission = Notification.permission;
      setPermission(currentPermission);
      setPushPermission(currentPermission);
    }

    logger.info("[useWebPush] Push support check", {
      supported,
      permission: supported ? Notification.permission : "N/A",
    });
  }, [setPushPermission]);

  /**
   * Check existing subscription status
   */
  useEffect(() => {
    if (!isSupported || !enabled) return;

    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        const subscribed = subscription !== null;
        setIsSubscribed(subscribed);
        setPushSubscribed(subscribed);

        logger.info("[useWebPush] Subscription status", { subscribed });
      } catch (error) {
        logger.error("[useWebPush] Error checking subscription", error);
      }
    };

    checkSubscription();
  }, [isSupported, enabled, setPushSubscribed]);

  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      toast.error("Push notifications are not supported in this browser");
      return "denied";
    }

    if (permission === "granted") {
      return "granted";
    }

    try {
      setIsLoading(true);
      logger.info("[useWebPush] Requesting notification permission");

      const result = await Notification.requestPermission();
      setPermission(result);
      setPushPermission(result);

      if (result === "granted") {
        logger.info("[useWebPush] Permission granted");
      } else if (result === "denied") {
        logger.warn("[useWebPush] Permission denied");
        toast.error("Notification permission denied");
      } else {
        logger.info("[useWebPush] Permission dismissed");
      }

      return result;
    } catch (error) {
      logger.error("[useWebPush] Error requesting permission", error);
      toast.error("Failed to request notification permission");
      return "denied";
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission, setPushPermission]);

  /**
   * Subscribe to push notifications
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error("Push notifications are not supported");
      return false;
    }

    if (!uid) {
      logger.warn("[useWebPush] Cannot subscribe without uid");
      return false;
    }

    if (!vapidPublicKey) {
      logger.error("[useWebPush] VAPID public key not provided");
      toast.error("Push notification configuration missing");
      return false;
    }

    if (!isValidVapidKey(vapidPublicKey)) {
      logger.error("[useWebPush] VAPID public key is malformed", {
        length: vapidPublicKey.length,
        prefix: vapidPublicKey.slice(0, 8),
      });
      toast.error("Push notification key is invalid — contact support");
      return false;
    }

    try {
      setIsLoading(true);

      // Request permission if not granted
      if (permission !== "granted") {
        const result = await requestPermission();
        if (result !== "granted") {
          return false;
        }
      }

      logger.info("[useWebPush] Subscribing to push notifications");

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // A subscription minted under a previous VAPID key blocks re-subscribing
      // with the current one. Drop it first so a key rotation self-heals.
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        logger.info("[useWebPush] Dropping existing subscription before re-subscribe");
        await existing.unsubscribe();
      }

      // Subscribe to push manager
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      // Convert subscription to our format
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
          auth: arrayBufferToBase64(subscription.getKey("auth")),
        },
      };

      // Send subscription to backend
      const result = await NotificationService.registerPushSubscription({
        uid,
        subscription: subscriptionData,
      });

      if (isError(result)) {
        throw new Error("Failed to register subscription with backend");
      }

      setIsSubscribed(true);
      setPushSubscribed(true);
      toast.success("Push notifications enabled!");

      logger.info("[useWebPush] Successfully subscribed to push notifications");
      return true;
    } catch (error) {
      logger.error("[useWebPush] Error subscribing to push", error);
      const reason = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to enable push notifications: ${reason}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, uid, vapidPublicKey, permission, requestPermission, setPushSubscribed]);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !uid) {
      return false;
    }

    try {
      setIsLoading(true);
      logger.info("[useWebPush] Unsubscribing from push notifications");

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();

        // Notify backend
        await NotificationService.unregisterPushSubscription({
          uid,
          endpoint: subscription.endpoint,
        });
      }

      setIsSubscribed(false);
      setPushSubscribed(false);
      toast.success("Push notifications disabled");

      logger.info("[useWebPush] Successfully unsubscribed from push notifications");
      return true;
    } catch (error) {
      logger.error("[useWebPush] Error unsubscribing from push", error);
      toast.error("Failed to disable push notifications");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, uid, setPushSubscribed]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    canRequestPermission: isSupported && permission === "default",
    shouldShowPrompt: isSupported && permission === "default" && !isSubscribed,

    // Actions
    requestPermission,
    subscribe,
    unsubscribe,
  };
}
