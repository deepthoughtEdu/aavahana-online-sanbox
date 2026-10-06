"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils";
import { formatMins } from "@/types/aavahana/report-v5.types";
import type { EngineState } from "@/lib/engine/tree-walker";

/**
 * The card only reads these fields, so any state shape carrying them works —
 * the v7 engine passes its full EngineState; the v8 single-screen report
 * passes a plain object with just these.
 */
export type DayCardState = Pick<
  EngineState,
  "deliverables" | "unplanned" | "constraint" | "navigation" | "feeling" | "framework"
>;

interface DayCardProps {
  state: DayCardState;
}

/**
 * Live day card — progressively fills in as the employee answers.
 * Each section appears only when its data becomes available.
 * The card IS the feedback: the employee sees their answers building something.
 */
export function DayCard({ state }: DayCardProps) {
  const { deliverables, unplanned, constraint, navigation, feeling, framework } = state;

  // What has been filled in so far?
  const hasDeliverableData = deliverables.some((d) => d.status !== null);
  const cpItem = deliverables.find((d) => d.isCriticalPath);
  const _doneCount = deliverables.filter((d) => d.status === "done").length;
  const _partialCount = deliverables.filter((d) => d.status === "partial").length;
  const _total = deliverables.length;
  const plannedMins = deliverables.reduce((s, d) => s + d.estimateMins, 0);
  const actualMins = deliverables.reduce((s, d) => s + d.actualMins, 0);
  const unplannedMins = unplanned.reduce((s, u) => s + u.minutesTaken, 0);

  // Nothing captured yet — don't render
  if (!hasDeliverableData && !constraint && !navigation && !feeling) {
    return null;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-base-300 bg-base-200/30 p-4 flex flex-col gap-3"
    >
      {/* ── Deliverables row ── */}
      <AnimatePresence>
        {hasDeliverableData && (
          <motion.div
            key="deliverables"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex flex-col gap-2"
          >
            {/* Compact deliverable pills */}
            <div className="flex flex-wrap gap-1.5">
              {deliverables.map((d) => {
                const statusColor =
                  d.status === "done"
                    ? "bg-success/15 text-success border-success/30"
                    : d.status === "partial"
                      ? "bg-warning/15 text-warning border-warning/30"
                      : d.status === "not_done"
                        ? "bg-base-300 text-base-content/50 border-base-content/10"
                        : "bg-base-300 text-base-content/30 border-base-content/10";

                return (
                  <span
                    key={d.id}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-300",
                      statusColor,
                    )}
                  >
                    {d.isCriticalPath && (
                      <span className="text-primary">{"\u2605"}</span>
                    )}
                    {d.label}
                  </span>
                );
              })}
            </div>

            {/* Time bar */}
            <div className="flex items-center gap-2 text-xs text-base-content/50">
              <TimeBar
                planned={plannedMins}
                actual={actualMins + unplannedMins}
              />
              <span className="shrink-0 tabular-nums">
                {formatMins(actualMins + unplannedMins)} / {formatMins(plannedMins)}
              </span>
            </div>

            {/* Unplanned count */}
            {unplanned.length > 0 && (
              <span className="text-xs text-warning">
                +{unplanned.length} unplanned ({formatMins(unplannedMins)})
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Constraint → Navigation flow ── */}
      <AnimatePresence>
        {(constraint || navigation) && (
          <motion.div
            key="flow"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex items-center gap-2 text-xs"
          >
            {constraint && (
              <span className="inline-flex items-center gap-1 rounded-md bg-error/10 border border-error/20 px-2 py-1 text-error">
                <span className="opacity-60">{"\u26A0"}</span>
                {constraint.microLabel}
              </span>
            )}
            {constraint && navigation && (
              <span className="text-base-content/30">{"\u2192"}</span>
            )}
            {navigation && (
              <span className="inline-flex items-center gap-1 rounded-md bg-success/10 border border-success/20 px-2 py-1 text-success">
                <span className="opacity-60">{"\u2713"}</span>
                {navigation.microLabel}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Framework + Feeling row ── */}
      <AnimatePresence>
        {(framework || feeling) && (
          <motion.div
            key="meta"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex items-center gap-2 text-xs"
          >
            {framework && (
              <span className="inline-flex items-center gap-1 rounded-md bg-info/10 border border-info/20 px-2 py-1 text-info-content">
                {framework.microLabel}
              </span>
            )}
            {feeling && (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-2 py-1 text-primary">
                {feeling.macroLabel}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Critical path callout ── */}
      <AnimatePresence>
        {cpItem && (
          <motion.div
            key="cp"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/15 px-3 py-1.5 text-xs text-primary"
          >
            <span>{"\u2605"}</span>
            <span className="font-medium">{cpItem.label}</span>
            <span className="text-primary/50">
              {cpItem.status === "done"
                ? "delivered"
                : cpItem.status === "partial"
                  ? "in progress"
                  : "pending"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Progress indicator: how much of the card is built ── */}
      <CardProgress state={state} />
    </motion.div>
  );
}

// ── Time bar: visual ratio of actual vs planned ──

function TimeBar({ planned, actual }: { planned: number; actual: number }) {
  if (planned === 0) return null;
  const ratio = Math.min(actual / planned, 1.5);
  const overBudget = actual > planned;

  return (
    <div className="relative h-1.5 flex-1 rounded-full bg-base-300 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(ratio * 100, 100)}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={cn(
          "absolute inset-y-0 left-0 rounded-full",
          overBudget ? "bg-warning" : "bg-success",
        )}
      />
      {/* Plan marker at 100% */}
      <div className="absolute inset-y-0 right-0 w-px bg-base-content/20" />
    </div>
  );
}

// ── Card progress: dots showing how much of the reflection is complete ──

function CardProgress({ state }: { state: DayCardState }) {
  const steps = [
    { label: "Work", done: state.deliverables.some((d) => d.status !== null) },
    { label: "Challenge", done: state.constraint !== null },
    { label: "Navigation", done: state.navigation !== null },
    { label: "Growth", done: state.framework !== null || state.feeling !== null },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  if (completedCount === 0) return null;

  return (
    <div className="flex items-center gap-1.5 pt-1">
      {steps.map((step) => (
        <div key={step.label} className="flex items-center gap-1">
          <div
            className={cn(
              "h-1.5 w-1.5 rounded-full transition-colors duration-500",
              step.done ? "bg-primary" : "bg-base-300",
            )}
          />
          <span
            className={cn(
              "text-[10px] transition-colors duration-300",
              step.done ? "text-primary/70" : "text-base-content/20",
            )}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}
