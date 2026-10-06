"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils";

type Section = "A" | "B" | "C";

const PILL_IDLE: Record<Section, string> = {
  A: "bg-base-200 text-base-content border-transparent hover:bg-base-300",
  B: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20",
  C: "bg-success/10 text-success border-success/20 hover:bg-success/20",
};

const PILL_SELECTED: Record<Section, string> = {
  A: "bg-primary text-primary-content border-primary",
  B: "bg-warning text-warning-content border-warning",
  C: "bg-success text-success-content border-success",
};

interface SvgPillProps {
  label: string;
  onClick: () => void;
  section?: Section;
  selected?: boolean;
  className?: string;
}

export function SvgPill({
  label,
  onClick,
  section = "A",
  selected = false,
  className,
}: SvgPillProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.93 }}
      className={cn(
        "border rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-150 min-h-9",
        selected ? PILL_SELECTED[section] : PILL_IDLE[section],
        className,
      )}
    >
      {label}
    </motion.button>
  );
}
