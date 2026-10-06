// src/lib/hooks/shared/use-socket.ts
//
// Initialises the Socket.IO connection for the authenticated user and
// bridges live events into the Jotai notification store and TanStack Query cache.
//
// Mount ONCE in NotificationProvider — not in individual components.
//
// Events handled:
//   connect                  → ConnectionState.CONNECTED
//   disconnect               → ConnectionState.DISCONNECTED / FAILED
//   connect_error            → ConnectionState.FAILED
//   event:new_notification   → addNotificationAtom (NodeBB native push)
//   event:pdgms.notification → invalidate inbox cache + increment unread count

"use client";

import { useEffect } from "react";
import { useSetAtom, useAtomValue } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/shared/use-auth";
import { socketManager } from "@/lib/socket/socket.manager";
import {
  addNotificationAtom,
  setConnectionStateAtom,
  setConnectionErrorAtom,
  connectionStateAtom,
} from "@/lib/store/notifications";
import { ConnectionState, NotificationType } from "@/types";
import { logger } from "@/lib/managers/logger";
import type { Notification, PdgmsNotification } from "@/types";

// Shape of NodeBB's event:new_notification payload
interface NodeBBRawNotification {
  nid?: string;
  from?: number;
  bodyShort?: string;
  bodyLong?: string;
  path?: string;
  image?: string;
  datetime?: number;
}

export function useSocket(): { connectionState: ConnectionState } {
  const { isAuthenticated, selectedOrg } = useAuth();
  const orgId = selectedOrg?.orgId;

  const queryClient = useQueryClient();
  const setConnectionState = useSetAtom(setConnectionStateAtom);
  const setConnectionError = useSetAtom(setConnectionErrorAtom);
  const addNotification = useSetAtom(addNotificationAtom);
  const connectionState = useAtomValue(connectionStateAtom);

  // Connect/reconnect when auth state or org changes
  useEffect(() => {
    if (!isAuthenticated || !socketManager) return;

    setConnectionState(ConnectionState.CONNECTING);

    let cancelled = false;

    // ── Connection lifecycle ───────────────────────────────────────────────

    const onConnect = () => {
      logger.info("[useSocket] Connected", { orgId });
      setConnectionState(ConnectionState.CONNECTED);
      setConnectionError(null);
    };

    const onDisconnect = (reason: string) => {
      logger.warn("[useSocket] Disconnected", { reason, orgId });
      setConnectionState(
        reason === "io server disconnect"
          ? ConnectionState.FAILED
          : ConnectionState.DISCONNECTED
      );
    };

    const onConnectError = (err: Error) => {
      logger.error("[useSocket] Connection error", { message: err.message });
      setConnectionState(ConnectionState.FAILED);
      setConnectionError(err.message);
    };

    // ── NodeBB native notification push ────────────────────────────────────
    const onNewNotification = (raw: NodeBBRawNotification) => {
      if (!raw?.nid) return;
      logger.debug("[useSocket] Received event:new_notification", { nid: raw.nid });

      const notification: Notification = {
        id: String(raw.nid),
        uid: raw.from ?? 0,
        title: raw.bodyShort ?? "",
        message: raw.bodyLong ?? "",
        type: NotificationType.INFO,
        timestamp: raw.datetime ?? Date.now(),
        read: false,
        actionUrl: raw.path,
        icon: raw.image,
      };
      addNotification(notification);
    };

    // ── PDGMS persisted notification ───────────────────────────────────────
    const onPdgmsNotification = (notification: PdgmsNotification) => {
      if (!notification?.id) return;
      logger.info("[useSocket] Received event:pdgms.notification", {
        id: notification.id,
        type: notification.type,
      });

      queryClient.setQueryData<{ items: PdgmsNotification[]; total: number; page: number; perPage: number }>(
        ["shared", "pdgms-notifications", "inbox", 1, 20],
        (old) => {
          if (!old) return old;
          const alreadyExists = old.items.some((n) => n.id === notification.id);
          if (alreadyExists) return old;
          return {
            ...old,
            items: [notification, ...old.items],
            total: old.total + 1,
          };
        }
      );

      queryClient.setQueryData<{ count: number }>(
        ["shared", "pdgms-notifications", "unread-count"],
        (old) => ({ count: (old?.count ?? 0) + 1 })
      );
    };

    const bindListeners = (socket: import("socket.io-client").Socket) => {
      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket.on("connect_error", onConnectError);
      socket.on("event:new_notification", onNewNotification);
      socket.on("event:pdgms.notification", onPdgmsNotification);

      if (socket.connected) {
        onConnect();
      }
    };

    const unbindListeners = (socket: import("socket.io-client").Socket) => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("event:new_notification", onNewNotification);
      socket.off("event:pdgms.notification", onPdgmsNotification);
    };

    let activeSocket: import("socket.io-client").Socket | null = null;

    socketManager.connect(orgId).then((socket) => {
      if (cancelled) return;
      activeSocket = socket;
      bindListeners(socket);
    }).catch((err) => {
      if (cancelled) return;
      const msg = err instanceof Error ? err.message : String(err);
      logger.error("[useSocket] Failed to initialise socket", { msg });
      setConnectionState(ConnectionState.FAILED);
      setConnectionError(msg);
    });

    return () => {
      cancelled = true;
      if (activeSocket) {
        unbindListeners(activeSocket);
      }
    };
  // Re-run only when auth state or the selected org changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, orgId]);

  // Disconnect cleanly on logout
  useEffect(() => {
    if (!isAuthenticated && socketManager) {
      logger.info("[useSocket] User unauthenticated — closing socket");
      socketManager.disconnect();
      setConnectionState(ConnectionState.CLOSED);
    }
  }, [isAuthenticated, setConnectionState]);

  return { connectionState };
}
