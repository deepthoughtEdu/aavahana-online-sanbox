"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils";

type Section = "A" | "B" | "C";

const SECTION_CLASSES: Record<
  Section,
  { bg: string; border: string; text: string; hover: string }
> = {
  A: {
    bg: "bg-primary/5",
    border: "border-primary/30",
    text: "text-primary",
    hover: "hover:bg-primary/15",
  },
  B: {
    bg: "bg-warning/5",
    border: "border-warning/30",
    text: "text-warning",
    hover: "hover:bg-warning/15",
  },
  C: {
    bg: "bg-success/5",
    border: "border-success/30",
    text: "text-success",
    hover: "hover:bg-success/15",
  },
};

interface SvgPillProps {
  label: string;
  onClick: () => void;
  section?: Section;
  className?: string;
}

export function SvgPill({
  label,
  onClick,
  section = "A",
  className,
}: SvgPillProps) {
  const s = SECTION_CLASSES[section];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative border rounded-full px-5 py-2 text-sm font-medium transition-colors",
        s.bg,
        s.border,
        s.text,
        s.hover,
        className,
      )}
    >
      {/* SVG dot indicator */}
      <svg
        className="inline-block mr-2 -mt-px"
        width="6"
        height="6"
        viewBox="0 0 6 6"
        aria-hidden="true"
      >
        <circle cx="3" cy="3" r="3" fill="currentColor" />
      </svg>
      {label}
    </motion.button>
  );
}
