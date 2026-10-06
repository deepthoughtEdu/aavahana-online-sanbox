// src/components/notifications/NotificationBell.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useAtom } from "jotai";
import { connectionStateAtom } from "@/lib/store/notifications";
import { BellIcon } from "@/components/shared/icons";
import { NotificationPanel } from "./NotificationPanel";
import { ConnectionState } from "@/types";
import { usePdgmsUnreadCount } from "@/lib/hooks/shared/use-pdgms-notifications";
import { clsx } from "clsx";

/**
 * ============================================
 * NOTIFICATION BELL COMPONENT
 * ============================================
 * Displays notification icon with unread count badge
 * Opens notification panel on click
 */

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [connectionState] = useAtom(connectionStateAtom);

  // Use the PDGMS backend unread count (polled every 60s) — the backend count
  // is the source of truth for the badge.
  const { data: unreadData } = usePdgmsUnreadCount();
  const unreadCount = unreadData?.count ?? 0;
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  /**
   * Close dropdown on escape key
   */
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={togglePanel}
        className={clsx(
          "btn btn-ghost btn-circle relative",
          isOpen && "btn-active"
        )}
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <BellIcon size="md" className="w-6 h-6" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-error text-error-content text-xs font-bold">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}

        {/* Connection Status Indicator */}
        {isConnecting && (
          <span className="absolute bottom-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-warning"></span>
          </span>
        )}
        
        {!isConnected && !isConnecting && (
          <span 
            className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-base-300"
            title="Disconnected"
          ></span>
        )}
      </button>

      {/* Notification Panel Dropdown */}
      {isOpen && (
        <NotificationPanel onClose={() => setIsOpen(false)} />
      )}
    </div>
  );
}
