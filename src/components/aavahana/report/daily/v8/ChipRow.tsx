"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils";

export type ChipAccent = "primary" | "error" | "success" | "info";

const ACCENT_SELECTED: Record<ChipAccent, string> = {
  primary: "border-primary bg-primary text-primary-content shadow-sm shadow-primary/25",
  error: "border-error bg-error text-error-content shadow-sm shadow-error/25",
  success: "border-success bg-success text-success-content shadow-sm shadow-success/25",
  info: "border-info bg-info text-info-content shadow-sm shadow-info/25",
};

const ACCENT_HOVER: Record<ChipAccent, string> = {
  primary: "hover:border-primary/50 hover:text-primary",
  error: "hover:border-error/50 hover:text-error",
  success: "hover:border-success/50 hover:text-success",
  info: "hover:border-info/50 hover:text-info",
};

export interface ChipOption {
  id: string;
  label: string;
  /** Small prefix rendered before the label (emoji, ★, count badge…). */
  prefix?: React.ReactNode;
}

interface ChipRowBase {
  options: ChipOption[];
  accent?: ChipAccent;
  size?: "sm" | "md";
  className?: string;
}

interface ChipRowSingle extends ChipRowBase {
  multiple?: false;
  selectedId: string | null;
  /** Tapping the selected chip again deselects (passes null). */
  onPick: (option: ChipOption | null) => void;
}

interface ChipRowMultiple extends ChipRowBase {
  multiple: true;
  selectedIds: string[];
  /** Tapping toggles the chip in or out of the selection. */
  onToggle: (option: ChipOption) => void;
}

type ChipRowProps = ChipRowSingle | ChipRowMultiple;

/**
 * A wrapping row of tappable pill chips — the core input of the v8 report.
 *
 * Single-select by default: one tap selects, tapping the same chip again clears
 * the pick. Pass `multiple` for questions where several answers are true at
 * once, and each tap toggles one chip.
 */
export function ChipRow(props: ChipRowProps) {
  const { options, accent = "primary", size = "md", className } = props;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((o) => {
        const selected = props.multiple
          ? props.selectedIds.includes(o.id)
          : o.id === props.selectedId;
        return (
          <motion.button
            key={o.id}
            type="button"
            layout
            whileTap={{ scale: 0.94 }}
            onClick={() =>
              props.multiple
                ? props.onToggle(o)
                : props.onPick(selected ? null : o)
            }
            aria-pressed={selected}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors duration-150",
              size === "md" ? "px-3.5 py-1.5 text-sm" : "px-2.5 py-1 text-xs",
              selected
                ? ACCENT_SELECTED[accent]
                : cn(
                    "border-base-300 bg-base-100 text-base-content/70",
                    ACCENT_HOVER[accent],
                  ),
            )}
          >
            {o.prefix != null && <span aria-hidden>{o.prefix}</span>}
            <span>{o.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
