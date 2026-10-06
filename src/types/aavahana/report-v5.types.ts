// src/types/aavahana/report-v5.types.ts
// Daily Report v5.0 — Section A types

import type { ReportStatus } from "./pdgms.types";

// ── Status ───────────────────────────────────────────────────

export type PlannedItemStatus = "done" | "partial" | "not_done";

export const PLANNED_STATUS_LABELS: Record<PlannedItemStatus, string> = {
  done: "Done",
  partial: "Partial",
  not_done: "Not done",
};

/** Cycle order for the 3-state toggle button — most common action first */
export const STATUS_CYCLE: PlannedItemStatus[] = ["done", "partial", "not_done"];

// ── Source Tags ──────────────────────────────────────────────

export type UnplannedSourceTag =
  | "interruption"
  | "opportunity"
  | "constraint_shift"
  | "helping_others";

export const UNPLANNED_SOURCE_LABELS: Record<UnplannedSourceTag, string> = {
  interruption: "Something came up",
  opportunity: "Spotted an opportunity",
  constraint_shift: "Today's blocker changed",
  helping_others: "Helped a colleague",
};

// ── Data Shapes ──────────────────────────────────────────────

export interface PlannedItemWithStatus {
  taskId: string;
  text: string;
  status: PlannedItemStatus;
  budgetMins: number;           // from daily plan estimateMins
  actualMins: number;           // user adjusts via [−][+] stepper (30-min increments)
  autoPopulated: boolean;
  isCriticalPath?: boolean;     // SA-8: needle-mover flag
  programName?: string;
  ticketRef?: string;
}

export interface UnplannedWorkItem {
  description: string;
  sourceTag: UnplannedSourceTag;
  minutesTaken: number;         // from Section B voice LLM or manual stepper (30-min increments)
  ticketRef?: string;
}

// ── API Response ─────────────────────────────────────────────

export interface SectionAContext {
  plannedItems: PlannedItemWithStatus[];
  planSubmitted: boolean;
  reportStatus: ReportStatus;
}

// ── Hook State ───────────────────────────────────────────────

export type SectionAPhase = "toggle" | "tension";

export interface SectionAGap {
  done: number;
  partial: number;
  notDone: number;
  unplanned: number;
}

export interface SectionATimeSummary {
  budgetMins: number;           // sum of all planned item budgets
  plannedActualMins: number;    // sum of all planned item actuals
  unplannedMins: number;        // sum of all unplanned item minutesTaken
  totalActualMins: number;      // plannedActualMins + unplannedMins
}

// ── Time Helpers ─────────────────────────────────────────────

export const TIME_STEP_SMALL = 30;  // minutes per [−30m] / [+30m] click
export const TIME_STEP_LARGE = 60;  // minutes per [+1h] click

export function formatMins(mins: number): string {
  if (mins === 0) return "0h";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
