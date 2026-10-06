"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useAtom, useAtomValue } from "jotai";
import { cn } from "@/utils";
import { FrameworkPicker } from "./FrameworkPicker";
import { FeelingPicker } from "./FeelingPicker";
import { reportAtom, goToStepAtom, dictionariesAtom } from "../data/atoms";
import type { FrameworkSelection, MacroMicroSelection } from "../data/types";

export function Act3Close() {
  const [state, setState] = useAtom(reportAtom);
  const [, goToStep] = useAtom(goToStepAtom);
  const dictionaries = useAtomValue(dictionariesAtom);
  const frameworks = dictionaries?.frameworks ?? { macro: [], micro: {} };
  const feelings = dictionaries?.feelings ?? { macro: [], micro: {} };
  const shouldReduceMotion = useReducedMotion(); // D-1
  const [confirmPending, setConfirmPending] = useState(false); // C-3
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canSubmit = Boolean(state.framework?.microId) && Boolean(state.feeling?.microId);

  // C-3: auto-revert confirm state after 3s
  useEffect(() => {
    if (confirmPending) {
      confirmTimerRef.current = setTimeout(() => setConfirmPending(false), 3000);
    }
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, [confirmPending]);

  function handleFrameworkSelect(fw: FrameworkSelection) {
    setState((prev) => ({ ...prev, framework: fw }));
  }

  function handleFeelingSelect(feeling: MacroMicroSelection) {
    setState((prev) => ({ ...prev, feeling }));
  }

  // C-3: 2-tap submit
  function handleSubmitClick() {
    if (!canSubmit) return;
    if (!confirmPending) {
      setConfirmPending(true);
    } else {
      setConfirmPending(false);
      goToStep("summary");
    }
  }

  // B-2: always go to tapping, user can re-skip in one tap
  function handleBack() {
    goToStep("act2_tapping");
  }

  const dur = (d: number) => (shouldReduceMotion ? 0 : d);

  return (
    <div className="flex flex-col gap-6 px-4 pb-28 pt-4">
      {/* Framework — arrives first */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: dur(0.45), ease: [0.16, 1, 0.3, 1] }}
      >
        <FrameworkPicker
          dictionary={frameworks}
          selection={state.framework}
          onSelect={handleFrameworkSelect}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: dur(0.2), duration: dur(0.4), ease: [0.16, 1, 0.3, 1] }}
        className="divider my-0"
      />

      {/* Feeling — arrives after framework */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: dur(0.45), delay: dur(0.2), ease: [0.16, 1, 0.3, 1] }}
      >
        <FeelingPicker
          dictionary={feelings}
          selection={state.feeling}
          onSelect={handleFeelingSelect}
        />
      </motion.div>

      {/* E-6: framework-to-constraint linkage */}
      {state.framework?.microId && state.constraint && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur(0.35) }}
          className="rounded-xl border border-base-200 bg-gradient-to-br from-base-100 to-base-200/30 px-4 py-4 shadow-sm"
        >
          <p className="mb-3 text-sm text-base-content/70">
            Did <span className="font-semibold text-success">{state.framework.microLabel}</span> help with your <span className="font-semibold text-warning">{state.constraint.microLabel}</span>?
          </p>
          <div className="flex gap-2">
            {(["yes", "no", "unrelated"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setState((prev) => ({ ...prev, frameworkHelpedConstraint: opt }))}
                className={cn(
                  "btn btn-sm flex-1 capitalize transition-all duration-150 active:scale-95",
                  state.frameworkHelpedConstraint === opt
                    ? "btn-primary shadow-sm shadow-primary/20"
                    : "btn-ghost border border-base-300"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Sticky submit */}
      <div className="fixed bottom-0 left-0 right-0 z-10 flex gap-2 border-t border-base-200 bg-base-100/90 px-4 py-3 backdrop-blur-md">
        <button type="button" onClick={handleBack} className="btn btn-ghost flex-1 active:scale-95">
          ← Back
        </button>
        <motion.button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmitClick}
          whileTap={canSubmit ? { scale: 0.92 } : undefined}
          animate={
            canSubmit && !confirmPending && !shouldReduceMotion
              ? { scale: [1, 1.06, 1] }
              : { scale: 1 }
          }
          transition={
            canSubmit && !confirmPending && !shouldReduceMotion
              ? { scale: { repeat: Infinity, duration: 2, ease: "easeInOut" } }
              : {}
          }
          className={cn(
            "btn flex-1",
            confirmPending
              ? "btn-warning shadow-lg shadow-warning/30"
              : canSubmit
                ? "btn-primary shadow-lg shadow-primary/30"
                : "btn-primary opacity-25"
          )}
        >
          {confirmPending ? "Confirm? ✓" : "Submit report ✓"}
        </motion.button>
      </div>
    </div>
  );
}
