"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils";
import { MacroMicroPicker } from "../Act2Story/MacroMicroPicker";
import type { Dictionary, MacroMicroSelection } from "../data/types";

const FEELING_STYLES: Record<string, { border: string; bg: string; text: string; emoji: string }> = {
  energized: { border: "border-success", bg: "bg-success/15", text: "text-success", emoji: "⚡" },
  good: { border: "border-success/60", bg: "bg-success/10", text: "text-success", emoji: "😊" },
  neutral: { border: "border-base-300", bg: "bg-base-200/50", text: "text-base-content/60", emoji: "😐" },
  drained: { border: "border-warning", bg: "bg-warning/15", text: "text-warning", emoji: "😮‍💨" },
  overwhelmed: { border: "border-error/80", bg: "bg-error/10", text: "text-error", emoji: "😰" },
};

interface FeelingPickerProps {
  dictionary: Dictionary;
  selection: MacroMicroSelection | null;
  onSelect: (selection: MacroMicroSelection) => void;
}

export function FeelingPicker({ dictionary, selection, onSelect }: FeelingPickerProps) {
  const macroId = selection?.macroId ?? null;
  const style = macroId ? FEELING_STYLES[macroId] : null;

  return (
    <div
      className={cn(
        "rounded-xl border-2 p-4 transition-all duration-500",
        style ? `${style.border} ${style.bg}` : "border-transparent bg-transparent"
      )}
    >
      <MacroMicroPicker
        dictionary={dictionary}
        label="How are you feeling?"
        selection={selection}
        onSelect={onSelect}
      />

      {/* Feeling echo — the system reflects your feeling back */}
      <AnimatePresence>
        {selection?.microLabel && style && (
          <motion.div
            initial={{ opacity: 0, y: 12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 12, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-3 flex items-center gap-2"
          >
            <span className="text-xl">{style.emoji}</span>
            <span className={cn("text-sm font-semibold", style.text)}>
              {selection.microLabel}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
