/**
 * Shared types used by the tree-walker engine and daily report v6/v7.
 *
 * These types are version-neutral — the engine imports from here,
 * and each report version re-exports or extends as needed.
 */

// ── Shared 5×5 dictionary shape ──

export interface MacroOption {
  id: string;
  label: string;
  pairedWith?: string; // only for navigations (paired with constraint macro)
}

export interface MicroOption {
  id: string;
  label: string;
}

export interface Dictionary {
  macro: MacroOption[];
  micro: Record<string, MicroOption[]>;
}

/** Navigation dictionary keyed by constraint_micro_id → its own 5×5 nav Dictionary */
export type NestedDictionary = Record<string, Dictionary>;

// ── Deliverables ──

export type DeliverableStatus = "done" | "partial" | "not_done" | null;

export type QaStatus = "met" | "not met" | "to verify" | "unsure" | "unknown" | null;

export interface PlannedDeliverable {
  id: number;
  /** Stable id from the daily plan; older rows may only have a label/index. */
  planTaskId?: string;
  gridSlot: string; // e.g. "V2-H3"
  label: string;
  estimateMins: number;
  actualMins: number;        // SA-1: user adjusts via stepper
  isCriticalPath: boolean;   // SA-2: radio — only one at a time
  status: DeliverableStatus;
  qaStatus: QaStatus;        // stored on deliverable, synced to program after submission
  basketItemId?: string;     // cascade ref for post-report sync
}

export interface UnplannedDeliverable {
  id: number;
  gridSlot: string;
  label: string;
  minutesTaken: number;
}

// ── Selections (what user picks during the flow) ──

export interface MacroMicroSelection {
  macroId: string;
  macroLabel: string;
  microId: string;
  microLabel: string;
}

export interface FrameworkSelection extends MacroMicroSelection {
  quantity: number; // × 1, 2, 3...
}

// ── Feedback signals ──

export interface FeedbackSignals {
  constraintPersistence: { type: string; count: number; days: number };
  navigationVariety: { count: number };
  streak: number;
  points: number;
}

// ── Prompts ──

export interface Prompts {
  act1: { initial: string };
  act2: {
    initial: string;
    voiceTemplate: string; // contains {constraintMicro} and {navigationMicro} placeholders
  };
  act3: {
    frameworkPrompt: string;
    feelingPrompt: string;
  };
}

// ── Full report state ──

export type FlowStep =
  | "act1"
  | "act2_tapping"
  | "act2_voice"
  | "act2_confirm"
  | "act3"
  | "summary"
  | "done";

export interface ReportState {
  step: FlowStep;
  startedAt: number; // Date.now() — for timer

  // Act 1
  deliverables: PlannedDeliverable[];
  unplanned: UnplannedDeliverable[];

  // Act 2
  constraint: MacroMicroSelection | null;
  navigation: MacroMicroSelection | null;
  narrative: string; // voice transcript or typed text
  skippedAct2: boolean;

  // Act 3
  framework: FrameworkSelection | null;
  feeling: MacroMicroSelection | null;

  // Act 2 extras (E-2, E-3)
  constraintDetail: string;   // "What specifically blocked you?"
  smoothDayNote: string;      // captured when user skips Act 2

  // Act 3 extras (E-6)
  frameworkHelpedConstraint: "yes" | "no" | "unrelated" | null;
}
