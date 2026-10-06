"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PillSelector } from "../shared/PillSelector";
import type { Dictionary, MacroMicroSelection } from "../data/types";

interface MacroMicroPickerProps {
  dictionary: Dictionary;
  label: string;
  selection: MacroMicroSelection | null;
  onSelect: (selection: MacroMicroSelection) => void;
  /** Highlight a specific macro pill (e.g. paired navigation) */
  highlightMacroId?: string | null;
}

export function MacroMicroPicker({
  dictionary,
  label,
  selection,
  onSelect,
  highlightMacroId,
}: MacroMicroPickerProps) {
  const selectedMacro = selection?.macroId ?? null;
  const selectedMicro = selection?.microId ?? null;
  const microOptions = selectedMacro ? (dictionary.micro[selectedMacro] ?? []) : [];

  function handleMacroSelect(macroId: string) {
    const macro = dictionary.macro.find((m) => m.id === macroId);
    if (!macro) return;
    onSelect({ macroId, macroLabel: macro.label, microId: "", microLabel: "" });
  }

  function handleMicroSelect(microId: string) {
    const macro = dictionary.macro.find((m) => m.id === selectedMacro);
    const micro = microOptions.find((m) => m.id === microId);
    if (!macro || !micro) return;
    onSelect({
      macroId: macro.id,
      macroLabel: macro.label,
      microId: micro.id,
      microLabel: micro.label,
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="text-sm font-semibold text-base-content"
      >
        {label}
      </motion.p>

      <PillSelector
        options={dictionary.macro}
        selectedId={selectedMacro}
        onSelect={handleMacroSelect}
        highlightId={highlightMacroId}
        size="md"
      />

      <AnimatePresence mode="wait">
        {selectedMacro && microOptions.length > 0 && (
          <motion.div
            key={selectedMacro}
            initial={{ opacity: 0, height: 0, scaleY: 0.8 }}
            animate={{ opacity: 1, height: "auto", scaleY: 1 }}
            exit={{ opacity: 0, height: 0, scaleY: 0.8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{ originY: 0 }}
          >
            <PillSelector
              options={microOptions}
              selectedId={selectedMicro}
              onSelect={handleMicroSelect}
              size="sm"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
