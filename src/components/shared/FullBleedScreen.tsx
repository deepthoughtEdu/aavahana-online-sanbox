"use client";

import React from "react";
import { cn } from "@/utils";

interface FullBleedScreenProps {
  children: React.ReactNode;
  /** Extra classes for the inner scroll container (e.g. padding). */
  className?: string;
  /** Overlay background. Defaults to the app content background. */
  bgClassName?: string;
}

/**
 * Fills the app content area — below the sticky app header (h-14) and to the
 * right of the sidebar (w-76 on lg) — as a fixed overlay with its own internal
 * scroll. This removes the outer page scrollbar so a screen feels full-bleed
 * within the shell, without covering the header or the sidebar.
 *
 * Use for focused, single-purpose screens (plans, reports, wizards). Content
 * that must scroll simply scrolls inside; the shell chrome stays put.
 */
export function FullBleedScreen({
  children,
  className,
  bgClassName = "bg-base-200",
}: FullBleedScreenProps) {
  // Hold the page still underneath. Without this the wheel keeps scrolling the
  // page behind the overlay — the background slides while this screen sits
  // fixed. The padding replaces the scrollbar's width so nothing shifts sideways
  // when it disappears.
  React.useEffect(() => {
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 top-14 z-20 flex flex-col overflow-hidden lg:left-76",
        bgClassName,
      )}
    >
      {/* overscroll-contain stops a scroll that reaches the end here from
          continuing into whatever is behind. */}
      <div className={cn("flex-1 overflow-y-auto overscroll-contain", className)}>
        {children}
      </div>
    </div>
  );
}
