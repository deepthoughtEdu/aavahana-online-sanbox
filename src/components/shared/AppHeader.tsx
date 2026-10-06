// src/components/shared/AppHeader.tsx
"use client";

import { useEffect, useState } from "react";
import { useSetAtom } from "jotai";
import { useAuth } from "@/lib/hooks/shared/use-auth";
import { NotificationBell } from "@/components/shared/notifications";
import { SearchIcon } from "@/components/shared/icons";
import { commandPaletteOpenAtom } from "@/lib/store/ui";
import { commandPaletteStyles } from "@/utils/shared/design.utils";

interface AppHeaderProps {
  moduleName?: string;
}

export function AppHeader({ moduleName }: AppHeaderProps) {
  const { user } = useAuth();
  const openPalette = useSetAtom(commandPaletteOpenAtom);
  const [isMac, setIsMac] = useState(false);

  // AppHeader only renders past AuthProvider's isMounted gate, so there is no server
  // pass for this to mismatch against.
  useEffect(() => {
    setIsMac(/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent));
  }, []);

  const greeting = getGreeting();
  const firstName = user?.username?.split(" ")[0] ?? "";

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-base-300">
      <div className="flex items-center justify-between h-14 px-6">
        {/* Left: Greeting & context */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-black truncate">
              {greeting}{firstName ? `, ${firstName}` : ""}
            </h2>
            {moduleName && (
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary">
                {moduleName}
              </p>
            )}
          </div>
        </div>

        {/* Right: Search + Notifications */}
        <div className="flex items-center gap-1">
          {/* Command palette trigger. Wide enough to show the shortcut on desktop,
              collapsed to the icon on mobile where there is no keyboard to hint at. */}
          <button
            className={commandPaletteStyles.trigger}
            aria-label="Search (Command K)"
            aria-keyshortcuts="Meta+K Control+K"
            onClick={() => openPalette(true)}
          >
            <SearchIcon size="sm" />
            <span className="text-sm">Search</span>
            <kbd className="kbd kbd-xs">{isMac ? "⌘K" : "Ctrl K"}</kbd>
          </button>
          <button
            className={commandPaletteStyles.triggerMobile}
            aria-label="Search"
            onClick={() => openPalette(true)}
          >
            <SearchIcon size="sm" />
          </button>

          {/* Notification bell */}
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
