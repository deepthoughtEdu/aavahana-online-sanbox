"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAtomValue } from "jotai";
import { cn } from "@/utils";
import { tensionSummaryAtom } from "../data/atoms";
import { formatMins } from "@/types/aavahana/report-v5.types";

/** Animate a number counting up/down */
function useAnimatedNumber(target: number): number {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);

  useEffect(() => {
    const from = prevRef.current;
    if (from === target) return;
    prevRef.current = target;

    const duration = 400;
    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target]);

  return display;
}

export function TensionSummary() {
  const { done, partial, notDone, plannedMins, actualMins, unplannedMins } = useAtomValue(tensionSummaryAtom);
  // SA-10: total actual = per-deliverable actual + unplanned time
  const totalActual = actualMins + unplannedMins;
  const delta = totalActual - plannedMins;

  const animDone = useAnimatedNumber(done);
  const animPartial = useAnimatedNumber(partial);
  const animNotDone = useAnimatedNumber(notDone);

  const gapRatio = plannedMins > 0 ? Math.abs(delta) / plannedMins : 0;
  const hasGap = gapRatio > 0.2;

  return (
    <motion.div
      layout
      className={cn(
        "rounded-xl border-2 px-4 py-3 transition-all duration-500",
        hasGap
          ? "border-warning/60 bg-warning/10 shadow-sm shadow-warning/10"
          : "border-base-200 bg-base-100"
      )}
    >
      {/* Status counts — big and clear */}
      <div className="flex flex-wrap gap-4 text-base font-semibold">
        <AnimatePresence mode="popLayout">
          {done > 0 && (
            <motion.span
              key="done"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-success"
            >
              {animDone} done
            </motion.span>
          )}
          {partial > 0 && (
            <motion.span
              key="partial"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-warning"
            >
              {animPartial} partial
            </motion.span>
          )}
          {notDone > 0 && (
            <motion.span
              key="notdone"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-error"
            >
              {animNotDone} not done
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Time comparison */}
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-base-content/60">
        <span>Plan: {formatMins(plannedMins)}</span>
        <span className="text-base-content/30">→</span>
        <span
          className={cn(
            "font-semibold transition-colors duration-300",
            delta > 0 ? "text-error" : delta < 0 ? "text-success" : "text-warning"
          )}
        >
          Actual: {formatMins(totalActual)}
        </span>
        {unplannedMins > 0 && (
          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
            +{formatMins(unplannedMins)} unplanned
          </span>
        )}
      </div>
    </motion.div>
  );
}
