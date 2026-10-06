// src/components/notifications/NotificationPanel.tsx
"use client";

/**
 * NotificationPanel
 *
 * Dropdown panel showing the PDGMS backend-persisted notification inbox.
 * Uses paginated REST data from the backend.
 */
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { PdgmsNotification } from "@/types";
import { isError } from "@/lib/api/client";
import { NotificationService } from "@/lib/services/shared/notification.service";
import { usePdgmsInbox } from "@/lib/hooks/shared/use-pdgms-notifications";
import { logger } from "@/lib/managers/logger";
import { EmptyState } from "@/components/shared/EmptyState";
import { BellIcon } from "@/components/shared/icons";
import { PdgmsNotificationItem } from "./PdgmsNotificationItem";

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const [page, setPage] = useState(1);
  // Accumulated items across all pages — prevents "Load more" replacing the list.
  const [allItems, setAllItems] = useState<PdgmsNotification[]>([]);
  const queryClient = useQueryClient();

  // `items` is the notification array itself — useApi already unwrapped the
  // backend's { items, total, page, perPage } envelope, and the count lives on
  // `pagination`.
  const { data: items, pagination, isLoading, isFetching, error } = usePdgmsInbox(page);

  // Append new page items; replace entirely on page 1 (handles refetch after mark-all-read).
  useEffect(() => {
    if (items) {
      if (page === 1) {
        setAllItems(items);
      } else {
        setAllItems((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          return [...prev, ...items.filter((n) => !existingIds.has(n.id))];
        });
      }
    }
  }, [items, page]);

  // Reconcile the bell badge with reality when the panel opens. If the inbox
  // is genuinely empty for page 1 but the badge cache still holds a stale
  // unread count, clear it so the user doesn't see a "phantom" badge with
  // nothing behind it.
  useEffect(() => {
    if (page === 1 && items && items.length === 0) {
      queryClient.setQueryData(
        ["shared", "pdgms-notifications", "unread-count"],
        { count: 0 }
      );
    }
  }, [items, page, queryClient]);

  const hasMore = pagination?.next.active ?? false;
  const isLoadingMore = isFetching && page > 1;

  /** Mark all read — optimistically clears the badge then calls the API. */
  const handleMarkAllRead = async () => {
    // Optimistically zero the badge.
    queryClient.setQueryData(
      ["shared", "pdgms-notifications", "unread-count"],
      { count: 0 }
    );

    const result = await NotificationService.markAllPdgmsRead();
    if (isError(result)) {
      logger.warn("[NotificationPanel] markAllPdgmsRead failed", result);
    }

    // Refetch from page 1 to reflect updated readAt values.
    setPage(1);
    await queryClient.invalidateQueries({
      queryKey: ["shared", "pdgms-notifications", "inbox"],
    });
  };

  const unreadCount = allItems.filter((n) => n.readAt === null).length;

  return (
    <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Notification list */}
      <div className="max-h-[32rem] overflow-y-auto">
        {isLoading && (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            Loading…
          </div>
        )}

        {error && !isLoading && (
          <div className="px-4 py-8 text-center text-sm text-red-500">
            Failed to load notifications.
          </div>
        )}

        {!isLoading && !error && allItems.length === 0 && (
          <div className="px-4 py-8">
            <EmptyState
              icon={<BellIcon size="xl" />}
              title="No notifications"
              subtitle="You're all caught up!"
            />
          </div>
        )}

        {!isLoading && !error && allItems.map((notification) => (
          <PdgmsNotificationItem
            key={notification.id}
            notification={notification}
            onClose={onClose}
          />
        ))}

        {/* Pagination footer */}
        {hasMore && !isLoading && (
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={isLoadingMore}
            className="w-full px-4 py-3 text-center text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors border-t border-gray-100 disabled:opacity-50"
          >
            {isLoadingMore ? "Loading…" : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
}
