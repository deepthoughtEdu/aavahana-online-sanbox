"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils";

interface PillOption {
  id: string;
  label: string;
}

interface PillSelectorProps {
  options: PillOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  size?: "sm" | "md";
  /** Highlight a specific pill (e.g. paired navigation) without selecting it */
  highlightId?: string | null;
  /** Accessible label for the group of pills */
  ariaLabel?: string;
}

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const pillVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.85 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function PillSelector({
  options,
  selectedId,
  onSelect,
  size = "md",
  highlightId,
  ariaLabel,
}: PillSelectorProps) {
  return (
    <motion.div
      className="flex flex-wrap gap-2"
      variants={containerVariants}
      initial="hidden"
      animate="show"
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const isSelected = opt.id === selectedId;
        const isHighlighted = opt.id === highlightId;
        return (
          <motion.button
            key={opt.id}
            type="button"
            variants={pillVariants}
            whileTap={{ scale: 0.88 }}
            onClick={() => onSelect(opt.id)}
            layout
            role="radio"
            aria-checked={isSelected}
            className={cn(
              "min-h-[44px] min-w-[44px] rounded-full px-4 py-2 font-medium",
              size === "sm" ? "text-xs" : "text-sm",
              isSelected
                ? "bg-primary text-primary-content shadow-lg shadow-primary/30 ring-2 ring-primary/20 ring-offset-2 ring-offset-base-100"
                : isHighlighted
                  ? "border-2 border-primary/50 bg-primary/10 text-primary"
                  : "border border-base-300 bg-base-100 text-base-content active:bg-base-200",
            )}
            animate={
              isSelected
                ? { scale: [1.18, 0.95, 1], transition: { duration: 0.35, ease: [0.34, 1.1, 0.64, 1] } }
                : undefined
            }
          >
            {opt.label}
          </motion.button>
        );
      })}
    </motion.div>
  );
}
