"use client";

import React from "react";

type Section = "A" | "B" | "C";

const SECTION_COLOR: Record<Section, string> = {
  A: "text-primary",
  B: "text-warning",
  C: "text-success",
};

interface AvatarGlyphProps {
  section: Section;
}

/**
 * 24×24 compass rose glyph for section A system bubbles.
 * B = ship's wheel, C = sextant (future).
 */
export function AvatarGlyph({ section }: AvatarGlyphProps) {
  const color = SECTION_COLOR[section];

  if (section === "A") {
    return (
      <svg
        width={24}
        height={24}
        viewBox="0 0 24 24"
        className={`shrink-0 ${color}`}
        aria-hidden="true"
      >
        {/* Outer ring */}
        <circle cx={12} cy={12} r={10} fill="none" stroke="currentColor" strokeWidth={1} opacity={0.3} />
        {/* N point — thicker/taller */}
        <polygon points="12,2 10,9 14,9" fill="currentColor" opacity={0.8} />
        {/* S point */}
        <polygon points="12,22 10,15 14,15" fill="currentColor" opacity={0.4} />
        {/* E point */}
        <polygon points="22,12 15,10 15,14" fill="currentColor" opacity={0.4} />
        {/* W point */}
        <polygon points="2,12 9,10 9,14" fill="currentColor" opacity={0.4} />
        {/* Center dot */}
        <circle cx={12} cy={12} r={1.5} fill="currentColor" opacity={0.6} />
      </svg>
    );
  }

  // B and C placeholders — simple dot for now, replaced when B1/C1 are built
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      className={`shrink-0 ${color}`}
      aria-hidden="true"
    >
      <circle cx={12} cy={12} r={4} fill="currentColor" opacity={0.4} />
    </svg>
  );
}
