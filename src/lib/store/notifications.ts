// src/lib/store/notifications.ts
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type {
  Notification,
  NotificationState,
} from "@/types";
import { ConnectionState } from "@/types";

/**
 * ============================================
 * NOTIFICATION STATE ATOM
 * ============================================
 * Stores notification state with localStorage persistence
 */

const defaultNotificationState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  connectionState: ConnectionState.INITIALIZED,
  error: null,
  // iOS Safari tabs can have window without the Notification API. This store
  // loads with AuthProvider, so an unguarded read prevents the whole app opening.
  pushPermission: typeof window !== 'undefined' && typeof window.Notification !== 'undefined'
    ? window.Notification.permission
    : 'default',
  pushSubscribed: false,
};

export const notificationStateAtom = atomWithStorage<NotificationState>(
  "notifications",
  defaultNotificationState,
  undefined,
  { getOnInit: true }
);

/**
 * ============================================
 * DERIVED ATOMS
 * ============================================
 */

/**
 * Get all notifications
 */
export const notificationsAtom = atom((get) => get(notificationStateAtom).notifications);

/**
 * Get unread notification count
 */
export const unreadCountAtom = atom((get) => get(notificationStateAtom).unreadCount);

/**
 * Get connection state
 */
export const connectionStateAtom = atom((get) => get(notificationStateAtom).connectionState);

/**
 * Get connection error
 */
export const connectionErrorAtom = atom((get) => get(notificationStateAtom).error);

/**
 * Get push permission status
 */
export const pushPermissionAtom = atom((get) => get(notificationStateAtom).pushPermission);

/**
 * Check if push is subscribed
 */
export const pushSubscribedAtom = atom((get) => get(notificationStateAtom).pushSubscribed);

/**
 * Check if connected
 */
export const isConnectedAtom = atom(
  (get) => get(notificationStateAtom).connectionState === ConnectionState.CONNECTED
);

/**
 * ============================================
 * ACTION ATOMS (Write-only)
 * ============================================
 */

/**
 * Add a new notification
 */
const MAX_NOTIFICATIONS = 100;

export const addNotificationAtom = atom(
  null,
  (get, set, notification: Notification) => {
    const state = get(notificationStateAtom);
    const notifications = [notification, ...state.notifications].slice(0, MAX_NOTIFICATIONS);
    const unreadCount = notifications.filter(n => !n.read).length;

    set(notificationStateAtom, {
      ...state,
      notifications,
      unreadCount,
    });
  }
);

/**
 * Mark a notification as read
 */
export const markAsReadAtom = atom(
  null,
  (get, set, notificationId: string) => {
    const state = get(notificationStateAtom);
    const notifications = state.notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    const unreadCount = notifications.filter(n => !n.read).length;
    
    set(notificationStateAtom, {
      ...state,
      notifications,
      unreadCount,
    });
  }
);

/**
 * Mark all notifications as read
 */
export const markAllAsReadAtom = atom(
  null,
  (get, set) => {
    const state = get(notificationStateAtom);
    const notifications = state.notifications.map(n => ({ ...n, read: true }));
    
    set(notificationStateAtom, {
      ...state,
      notifications,
      unreadCount: 0,
    });
  }
);

/**
 * Delete a notification
 */
export const deleteNotificationAtom = atom(
  null,
  (get, set, notificationId: string) => {
    const state = get(notificationStateAtom);
    const notifications = state.notifications.filter(n => n.id !== notificationId);
    const unreadCount = notifications.filter(n => !n.read).length;
    
    set(notificationStateAtom, {
      ...state,
      notifications,
      unreadCount,
    });
  }
);

/**
 * Clear all notifications
 */
export const clearAllNotificationsAtom = atom(
  null,
  (get, set) => {
    const state = get(notificationStateAtom);
    set(notificationStateAtom, {
      ...state,
      notifications: [],
      unreadCount: 0,
    });
  }
);

/**
 * Set connection state
 */
export const setConnectionStateAtom = atom(
  null,
  (get, set, connectionState: ConnectionState) => {
    const state = get(notificationStateAtom);
    set(notificationStateAtom, {
      ...state,
      connectionState,
      error: connectionState === ConnectionState.CONNECTED ? null : state.error,
    });
  }
);

/**
 * Set connection error
 */
export const setConnectionErrorAtom = atom(
  null,
  (get, set, error: string | null) => {
    const state = get(notificationStateAtom);
    set(notificationStateAtom, {
      ...state,
      error,
    });
  }
);

/**
 * Set push permission
 */
export const setPushPermissionAtom = atom(
  null,
  (get, set, pushPermission: NotificationPermission) => {
    const state = get(notificationStateAtom);
    set(notificationStateAtom, {
      ...state,
      pushPermission,
    });
  }
);

/**
 * Set push subscription status
 */
export const setPushSubscribedAtom = atom(
  null,
  (get, set, pushSubscribed: boolean) => {
    const state = get(notificationStateAtom);
    set(notificationStateAtom, {
      ...state,
      pushSubscribed,
    });
  }
);

/**
 * Set notifications list (for history load)
 */
export const setNotificationsAtom = atom(
  null,
  (get, set, notifications: Notification[]) => {
    const state = get(notificationStateAtom);
    const unreadCount = notifications.filter(n => !n.read).length;
    
    set(notificationStateAtom, {
      ...state,
      notifications,
      unreadCount,
    });
  }
);
