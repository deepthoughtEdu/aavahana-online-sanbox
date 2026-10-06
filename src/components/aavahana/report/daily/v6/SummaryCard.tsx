"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useAtom } from "jotai";
import { reportAtom } from "./data/atoms";
import { MOCK_FEEDBACK } from "./data/mockData";

interface SummaryCardProps {
  onDismiss: () => void;
}

/** Count from 0 to target */
function useCountUp(target: number, duration = 800, delay = 0): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now();
      function tick(now: number) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);
  return value;
}

export function SummaryCard({ onDismiss }: SummaryCardProps) {
  const [state] = useAtom(reportAtom);
  const shouldReduceMotion = useReducedMotion(); // D-1
  const dialogRef = useRef<HTMLDivElement>(null); // D-2: focus trap

  // C-4: no auto-dismiss — let user tap at their own pace

  // D-2: focus dialog on mount
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  // D-2: Escape key handler + focus trap
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onDismiss();
      return;
    }
    if (e.key === "Tab") {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    }
  }

  const dur = (d: number) => (shouldReduceMotion ? 0 : d);

  const frameworkLabel = state.framework?.microLabel ?? "";
  const frameworkQty = state.framework?.quantity ?? 1;
  const feelingLabel = state.feeling?.macroLabel ?? "";
  const constraintLabel = state.constraint
    ? `${state.constraint.macroLabel} · ${state.constraint.microLabel}`
    : null;
  const navLabel = state.navigation?.macroLabel ?? "";

  // E-5: signal strength
  const hasConstraint = Boolean(state.constraint?.microId);
  const hasNarrative = state.narrative.trim().length >= 10;
  const hasDetail = state.constraintDetail.trim().length > 0;
  const signalScore = state.skippedAct2 ? 0 : [hasConstraint, hasNarrative, hasDetail].filter(Boolean).length;
  const signal =
    signalScore === 3
      ? { label: "Strong", cls: "text-success bg-success/15" }
      : signalScore >= 2
        ? { label: "Moderate", cls: "text-warning bg-warning/15" }
        : { label: "Weak", cls: "text-error bg-error/15" };

  const streakCount = useCountUp(MOCK_FEEDBACK.streak, 600, 800);
  const pointsCount = useCountUp(MOCK_FEEDBACK.points, 600, 1000);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: dur(0.3) }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onDismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-title"
    >
      <motion.div
        ref={dialogRef}
        initial={{ y: shouldReduceMotion ? 0 : "100%" }}
        animate={{ y: 0 }}
        exit={{ y: shouldReduceMotion ? 0 : "100%" }}
        transition={{ duration: dur(0.5), ease: [0.0, 0.0, 0.1, 1] }}
        className="w-full max-w-lg rounded-t-3xl bg-base-100 px-6 pb-10 pt-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <div className="flex flex-col items-center gap-5 text-center">

          {/* Checkmark */}
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: dur(0.2), duration: dur(0.5), ease: [0.34, 1.56, 0.64, 1] }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-3xl text-success"
          >
            ✓
          </motion.div>

          {/* Title */}
          <motion.h2
            id="summary-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: dur(0.4), duration: dur(0.4), ease: [0.16, 1, 0.3, 1] }}
            className="text-2xl font-bold text-base-content"
          >
            Day captured
          </motion.h2>

          {/* Report echo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: dur(0.6), duration: dur(0.4) }}
            className="flex flex-col gap-1 text-sm text-base-content/60"
          >
            {constraintLabel && (
              <p>{constraintLabel} → {navLabel}</p>
            )}
            {frameworkLabel && (
              <p>{frameworkLabel} × {frameworkQty} · {feelingLabel}</p>
            )}
          </motion.div>

          {/* Signals — streak is the HERO */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: dur(0.8), duration: dur(0.4), ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap justify-center gap-2"
          >
            {/* E-5: signal strength badge */}
            <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${signal.cls}`}>
              Signal: {signal.label}
            </span>

            {constraintLabel && (
              <span className="rounded-full bg-warning/15 px-4 py-1.5 text-sm font-semibold text-warning">
                {MOCK_FEEDBACK.constraintPersistence.type}{" "}
                {MOCK_FEEDBACK.constraintPersistence.count}/{MOCK_FEEDBACK.constraintPersistence.days} days
              </span>
            )}
            <motion.span
              animate={!shouldReduceMotion ? { scale: [1, 1.12, 1] } : {}}
              transition={{ delay: dur(1.2), duration: dur(0.5), ease: [0.34, 1.1, 0.64, 1] }}
              className="rounded-full bg-primary/15 px-4 py-1.5 text-sm font-bold text-primary"
            >
              🔥 {streakCount}-day streak
            </motion.span>
            <span className="rounded-full bg-base-200 px-4 py-1.5 text-sm font-semibold text-base-content/60">
              ⭐ {pointsCount}/10
            </span>
          </motion.div>

          {/* Dismiss hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: dur(1.5), duration: dur(0.5) }}
            className="mt-2 text-xs text-base-content"
          >
            tap anywhere to dismiss
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
}
