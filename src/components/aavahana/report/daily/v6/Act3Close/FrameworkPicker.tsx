"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MacroMicroPicker } from "../Act2Story/MacroMicroPicker";
import type { Dictionary, MacroMicroSelection, FrameworkSelection } from "../data/types";

interface FrameworkPickerProps {
  dictionary: Dictionary;
  selection: FrameworkSelection | null;
  onSelect: (selection: FrameworkSelection) => void;
}

export function FrameworkPicker({ dictionary, selection, onSelect }: FrameworkPickerProps) {
  const quantity = selection?.quantity ?? 1;

  function handleMacroMicroSelect(s: MacroMicroSelection) {
    // C-5: always reset quantity to 1 when framework changes
    onSelect({ ...s, quantity: 1 });
  }

  function adjustQuantity(delta: number) {
    if (!selection?.microId) return;
    const next = Math.min(10, Math.max(1, quantity + delta));
    onSelect({ ...selection, quantity: next });
  }

  return (
    <div className="flex flex-col gap-3">
      <MacroMicroPicker
        dictionary={dictionary}
        label="What did you practice today?"
        selection={selection}
        onSelect={handleMacroMicroSelect}
      />

      <AnimatePresence>
        {selection?.microId && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -12 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3"
          >
            <span className="text-sm text-base-content/70">How many times?</span>
            <div className="join">
              <motion.button
                type="button"
                disabled={quantity <= 1}
                onClick={() => adjustQuantity(-1)}
                whileTap={{ scale: 0.85 }}
                className="btn btn-sm join-item min-h-[44px] min-w-[44px]"
              >
                −
              </motion.button>
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={quantity}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.34, 1.1, 0.64, 1] }}
                  className="join-item flex min-w-[3rem] items-center justify-center border border-base-300 text-lg font-bold text-primary"
                >
                  {quantity}
                </motion.span>
              </AnimatePresence>
              <motion.button
                type="button"
                disabled={quantity >= 10}
                onClick={() => adjustQuantity(1)}
                whileTap={{ scale: 0.85 }}
                className="btn btn-sm join-item min-h-[44px] min-w-[44px]"
              >
                +
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
