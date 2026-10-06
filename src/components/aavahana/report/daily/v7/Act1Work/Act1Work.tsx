"use client";

import React, { useCallback } from "react";
import { motion } from "framer-motion";
import { useAtom, useAtomValue } from "jotai";
import { ToggleList } from "../../v5/ToggleList";
import { UnplannedItemForm } from "../../v5/UnplannedItemForm";
import { TensionSummary } from "./TensionSummary";
import { reportAtom, goToStepAtom, tensionSummaryAtom } from "../data/atoms";
import { toPlannedItems } from "../data/adapters";
import type { UnplannedWorkItem } from "@/types/aavahana/report-v5.types";

export function Act1Work() {
  const [state, setState] = useAtom(reportAtom);
  const [, goToStep] = useAtom(goToStepAtom);
  const tension = useAtomValue(tensionSummaryAtom);

  const plannedItems = toPlannedItems(state.deliverables);
  const hasAnyStatus = state.deliverables.some((d) => d.status !== null);
  const allHaveStatus = state.deliverables.length > 0 && state.deliverables.every((d) => d.status !== null);

  const handleCycleStatus = useCallback(
    (taskId: string) => {
      const CYCLE = ["done", "partial", "not_done"] as const; // C-6: most common action first
      setState((prev) => ({
        ...prev,
        deliverables: prev.deliverables.map((d) => {
          if (String(d.id) !== taskId) return d;
          const current = d.status ?? "not_done";
          const idx = CYCLE.indexOf(current as (typeof CYCLE)[number]);
          const next = CYCLE[(idx + 1) % CYCLE.length];
          return { ...d, status: next };
        }),
      }));
    },
    [setState]
  );

  const handleAdjustTime = useCallback(
    (taskId: string, deltaMins: number) => {
      setState((prev) => ({
        ...prev,
        deliverables: prev.deliverables.map((d) => {
          if (String(d.id) !== taskId) return d;
          return { ...d, actualMins: Math.max(0, d.actualMins + deltaMins) }; // SA-5
        }),
      }));
    },
    [setState]
  );

  // SA-8: radio behavior — only one critical path at a time
  const handleToggleCriticalPath = useCallback(
    (taskId: string) => {
      setState((prev) => ({
        ...prev,
        deliverables: prev.deliverables.map((d) => ({
          ...d,
          isCriticalPath: String(d.id) === taskId ? !d.isCriticalPath : false,
        })),
      }));
    },
    [setState]
  );

  const handleAddUnplanned = useCallback(
    (item: UnplannedWorkItem) => {
      setState((prev) => ({
        ...prev,
        unplanned: [
          ...prev.unplanned,
          {
            id: typeof crypto !== "undefined" ? parseInt(crypto.randomUUID().replace(/-/g, "").slice(0, 9), 16) : Date.now() + Math.random(), // F-1
            gridSlot: "unplanned",
            label: item.description,
            minutesTaken: item.minutesTaken,
          },
        ],
      }));
    },
    [setState]
  );

  // Bridge text for Act 2 — tension drives the question
  const bridgeText =
    tension.notDone > 0
      ? `${tension.notDone} not done — what got in the way?`
      : tension.done > 0
        ? `${tension.done} done — anything that slowed you down?`
        : null;

  return (
    <div className="flex flex-col gap-4 px-4 pb-28">
      {/* Heading — big, clear, rises in */}
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="text-xl font-bold text-base-content"
      >
        Your day
      </motion.h2>

      {/* Deliverable list — rises in with delay */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <ToggleList
          items={plannedItems}
          onCycleStatus={handleCycleStatus}
          onAdjustTime={handleAdjustTime}
          onToggleCriticalPath={handleToggleCriticalPath}
          showNeedleMoverPrompt={allHaveStatus}
        />
      </motion.div>

      {/* Unplanned — rises later */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        <UnplannedItemForm onAdd={handleAddUnplanned} />
      </motion.div>

      {/* Tension summary — rises last, the anchor of Act 1 */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <TensionSummary />
      </motion.div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-base-200 bg-base-100/90 px-4 py-3 backdrop-blur-md">
        {/* Bridge text — connects tension to Act 2 */}
        {hasAnyStatus && bridgeText && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
            className="mb-2 text-center text-xs text-base-content/50"
          >
            {bridgeText}
          </motion.p>
        )}
        <motion.button
          type="button"
          disabled={!hasAnyStatus}
          onClick={() => goToStep("act2_tapping")}
          whileTap={{ scale: 0.94 }}
          className="btn btn-primary w-full disabled:opacity-30"
        >
          Next →
        </motion.button>
      </div>
    </div>
  );
}
