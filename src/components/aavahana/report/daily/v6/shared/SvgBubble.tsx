"use client";

import React, { type ReactNode } from "react";
import { cn } from "@/utils";

type Section = "A" | "B" | "C";
type Variant = "system" | "user";

/* ── Section colour mappings (Tailwind classes only) ── */

const SECTION_BG: Record<Section, string> = {
  A: "bg-primary/10 border-primary/20",
  B: "bg-warning/10 border-warning/20",
  C: "bg-success/10 border-success/20",
};

const SECTION_TAIL: Record<Section, string> = {
  A: "text-primary/10",
  B: "text-warning/10",
  C: "text-success/10",
};

const SECTION_ACCENT: Record<Section, string> = {
  A: "text-primary",
  B: "text-warning",
  C: "text-success",
};

/* ── SVG tail paths (10×14 viewBox) ── */
const TAIL_LEFT = "M 10,0 C 8,3 3,6 0,14 Q 5,10 10,9 Z";
const TAIL_RIGHT = "M 0,0 C 2,3 7,6 10,14 Q 5,10 0,9 Z";

interface SvgBubbleProps {
  children: ReactNode;
  section?: Section;
  variant?: Variant;
  avatarGlyph?: ReactNode;
  className?: string;
}

export function SvgBubble({
  children,
  section = "A",
  variant = "system",
  avatarGlyph,
  className,
}: SvgBubbleProps) {
  const isSystem = variant === "system";
  const showGlyph = isSystem && avatarGlyph;

  /* Bubble body + tail (always the same structure) */
  const bubbleContent = (
    <div className="relative">
      <div
        className={cn(
          "relative border px-5 py-3 text-sm leading-relaxed",
          isSystem
            ? cn("rounded-2xl rounded-tl-sm", SECTION_BG[section])
            : "rounded-2xl rounded-tr-sm bg-primary border-primary/30 text-primary-content",
        )}
      >
        {isSystem && (
          <svg
            className={cn(
              "absolute left-[3px] top-3 bottom-3 w-[3px]",
              SECTION_ACCENT[section],
            )}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <rect width="3" height="100%" rx="1.5" fill="currentColor" />
          </svg>
        )}
        <div className={isSystem ? "pl-2" : ""}>{children}</div>
      </div>

      <svg
        className={cn(
          "absolute w-[10px] h-[14px]",
          isSystem
            ? cn("-left-[5px] bottom-2", SECTION_TAIL[section])
            : "-right-[5px] bottom-2 text-primary",
        )}
        viewBox="0 0 10 14"
        aria-hidden="true"
      >
        <path d={isSystem ? TAIL_LEFT : TAIL_RIGHT} fill="currentColor" />
      </svg>
    </div>
  );

  if (showGlyph) {
    return (
      <div
        className={cn(
          "flex items-start gap-2 max-w-[85%]",
          className,
        )}
      >
        <div className="mt-3 shrink-0">{avatarGlyph}</div>
        <div className="flex-1 min-w-0">{bubbleContent}</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        isSystem ? "max-w-[85%]" : "max-w-[85%] ml-auto",
        className,
      )}
    >
      {bubbleContent}
    </div>
  );
}
