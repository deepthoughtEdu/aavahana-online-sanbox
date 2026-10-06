"use client";

import React, { type ReactNode } from "react";
import { cn } from "@/utils";

type Section = "A" | "B" | "C";
type Variant = "system" | "user";

/* ── Section colour tokens ── */

const SYSTEM_BG: Record<Section, string> = {
  A: "bg-base-200 text-base-content",
  B: "bg-warning/15 text-base-content",
  C: "bg-success/15 text-base-content",
};

const USER_BG = "bg-primary text-primary-content";

const AVATAR_BG: Record<Section, string> = {
  A: "bg-primary text-primary-content",
  B: "bg-warning text-warning-content",
  C: "bg-success text-success-content",
};

/* ── Section avatar icons (single char, no SVG) ── */
const AVATAR_ICON: Record<Section, string> = {
  A: "◈",
  B: "◉",
  C: "◎",
};

interface SvgBubbleProps {
  children: ReactNode;
  section?: Section;
  variant?: Variant;
  /** Kept for API compatibility — ignored, avatar is rendered internally */
  avatarGlyph?: ReactNode;
  className?: string;
}

export function SvgBubble({
  children,
  section = "A",
  variant = "system",
  className,
}: SvgBubbleProps) {
  const isSystem = variant === "system";

  if (isSystem) {
    return (
      <div className={cn("flex items-end gap-2 max-w-[85%]", className)}>
        {/* Avatar circle */}
        <div
          className={cn(
            "shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold select-none mb-0.5",
            AVATAR_BG[section],
          )}
          aria-hidden="true"
        >
          {AVATAR_ICON[section]}
        </div>

        {/* Bubble */}
        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm leading-relaxed",
            SYSTEM_BG[section],
          )}
        >
          {children}
        </div>
      </div>
    );
  }

  /* User bubble — right-aligned, no avatar */
  return (
    <div className={cn("flex justify-end max-w-[85%] ml-auto", className)}>
      <div
        className={cn(
          "px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed",
          USER_BG,
        )}
      >
        {children}
      </div>
    </div>
  );
}
