// src/lib/hooks/use-notifications.ts
import { useEffect, useCallback, useRef } from "react";
import { useAtom, useSetAtom } from "jotai";
import {
  notificationStateAtom,
  markAsReadAtom,
  markAllAsReadAtom,
  deleteNotificationAtom,
  clearAllNotificationsAtom,
  setNotificationsAtom,
} from "@/lib/store/notifications";
import { NotificationService } from "@/lib/services";
import { isError } from "@/lib/api/client";
import { logger } from "@/lib/managers/logger";
import { ConnectionState } from "@/types";

/**
 * ============================================
 * USE NOTIFICATIONS HOOK
 * ============================================
 * Manages notification state and history loading
 */

export interface UseNotificationsOptions {
  uid: number | null;
  enabled?: boolean;
  autoLoadHistory?: boolean;
}

export function useNotifications(options: UseNotificationsOptions) {
  const { uid, enabled = true, autoLoadHistory = true } = options;

  const [state] = useAtom(notificationStateAtom);
const markAsRead = useSetAtom(markAsReadAtom);
  const markAllAsRead = useSetAtom(markAllAsReadAtom);
  const deleteNotification = useSetAtom(deleteNotificationAtom);
  const clearAllNotifications = useSetAtom(clearAllNotificationsAtom);
  const setNotifications = useSetAtom(setNotificationsAtom);

  const historyLoadedRef = useRef(false);

  /**
   * Load notification history from backend
   */
  const loadHistory = useCallback(async () => {
    if (!uid || historyLoadedRef.current) return;

    try {
      logger.info("[useNotifications] Loading notification history");
      const result = await NotificationService.getHistory({ limit: 50 });

      if (!isError(result)) {
        setNotifications(result.notifications);
        historyLoadedRef.current = true;
        logger.info("[useNotifications] Loaded notification history", {
          count: result.notifications.length,
        });
      }
    } catch (error) {
      logger.error("[useNotifications] Failed to load history", error);
    }
  }, [uid, setNotifications]);

  /**
   * Mark notification as read (with API call)
   */
  const markNotificationAsRead = useCallback(
    async (notificationId: string) => {
      try {
        markAsRead(notificationId);
        const result = await NotificationService.markAsRead(notificationId);

        if (isError(result)) {
          logger.warn("[useNotifications] Failed to mark as read on server", result);
        }
      } catch (error) {
        logger.error("[useNotifications] Error marking as read", error);
      }
    },
    [markAsRead]
  );

  /**
   * Mark all notifications as read (with API call)
   */
  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      markAllAsRead();
      const result = await NotificationService.markAllAsRead();

      if (isError(result)) {
        logger.warn("[useNotifications] Failed to mark all as read on server", result);
      }
    } catch (error) {
      logger.error("[useNotifications] Error marking all as read", error);
    }
  }, [markAllAsRead]);

  /**
   * Delete notification (with API call)
   */
  const deleteNotificationById = useCallback(
    async (notificationId: string) => {
      try {
        deleteNotification(notificationId);
        const result = await NotificationService.deleteNotification(notificationId);

        if (isError(result)) {
          logger.warn("[useNotifications] Failed to delete on server", result);
        }
      } catch (error) {
        logger.error("[useNotifications] Error deleting notification", error);
      }
    },
    [deleteNotification]
  );

  /**
   * Clear all notifications (with API call)
   */
  const clearAll = useCallback(async () => {
    try {
      clearAllNotifications();
      const result = await NotificationService.clearAll();

      if (isError(result)) {
        logger.warn("[useNotifications] Failed to clear all on server", result);
      }
    } catch (error) {
      logger.error("[useNotifications] Error clearing all", error);
    }
  }, [clearAllNotifications]);

  /**
   * Load history when uid is available
   */
  useEffect(() => {
    if (uid && enabled && autoLoadHistory) {
      loadHistory();
    }

    return () => {
      historyLoadedRef.current = false;
    };
  }, [uid, enabled, autoLoadHistory, loadHistory]);

  return {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    connectionState: state.connectionState,
    error: state.error,
    isConnected: state.connectionState === ConnectionState.CONNECTED,
    isConnecting: state.connectionState === ConnectionState.CONNECTING,

    // Actions
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    deleteNotification: deleteNotificationById,
    clearAll,
    loadHistory,
  };
}
