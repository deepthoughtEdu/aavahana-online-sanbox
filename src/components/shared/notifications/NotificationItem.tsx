// src/components/notifications/NotificationItem.tsx
"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useNotifications } from "@/lib/hooks/shared/use-notifications";
import { useAuth } from "@/lib/hooks/shared/use-auth";
import {
  Notification,
  NotificationType,
} from "@/types";
import {
  InfoIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  XCircleIcon,
  TrashIcon,
} from "@/components/shared/icons";
import { ignoreTextSelection } from "@/utils/shared/selection.utils";
import { clsx } from "clsx";
import moment from "moment";

/**
 * ============================================
 * NOTIFICATION ITEM COMPONENT
 * ============================================
 * Individual notification in the list
 */

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
}

/**
 * Get icon for notification type
 */
function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.SUCCESS:
      return <CheckCircleIcon size="md" className="text-success" />;
    case NotificationType.ERROR:
      return <XCircleIcon size="md" className="text-error" />;
    case NotificationType.WARNING:
      return <AlertCircleIcon size="md" className="text-warning" />;
    case NotificationType.INFO:
    default:
      return <InfoIcon size="md" className="text-info" />;
  }
}

/**
 * Get relative time string
 */
function getRelativeTime(timestamp: number): string {
  return moment(timestamp).fromNow();
}

export function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { markAsRead, deleteNotification } = useNotifications({
    uid: user?.uid ?? null,
    enabled: !!user,
  });

  const handleClick = async () => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate if action URL exists
    if (notification.actionUrl) {
      onClose();
      router.push(notification.actionUrl);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(notification.id);
  };

  return (
    <div
      className={clsx(
        "flex items-start gap-3 p-4 border-b border-base-300 hover:bg-base-200 transition-colors cursor-pointer group",
        !notification.read && "bg-white/50"
      )}
      onClick={ignoreTextSelection(handleClick)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-1">
        {notification.icon ? (
          <Image
            src={notification.icon}
            alt=""
            width={24}
            height={24}
            className="rounded-full"
          />
        ) : (
          getNotificationIcon(notification.type)
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4
              className={clsx(
                "text-sm font-semibold truncate",
                !notification.read && "font-bold"
              )}
            >
              {notification.title}
            </h4>
            <p className="text-sm text-neutral mt-1 line-clamp-2">
              {notification.message}
            </p>
            <p className="text-xs text-[var(--dt-textDim)] mt-1">
              {getRelativeTime(notification.timestamp)}
            </p>
          </div>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="btn btn-xs btn-ghost btn-circle opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            aria-label="Delete notification"
          >
            <TrashIcon size="sm" />
          </button>
        </div>

        {/* Unread indicator */}
        {!notification.read && (
          <div className="w-2 h-2 rounded-full bg-primary absolute left-2 top-1/2 -translate-y-1/2" />
        )}
      </div>
    </div>
  );
}
