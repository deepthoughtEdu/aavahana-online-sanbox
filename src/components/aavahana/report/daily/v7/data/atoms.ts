import { atom } from "jotai";
import type { ReportState, FlowStep } from "./types";
import type {
  V7Dictionaries,
  V7Signals,
  AiFeedback,
} from "@/types/aavahana/report-v7.types";
import type { FeedbackSignals } from "@/types/aavahana/report-engine.types";

export const reportAtom = atom<ReportState>({
  step: "act1",
  startedAt: 0,
  deliverables: [], // populated by Engine from backend
  unplanned: [],
  constraint: null,
  navigation: null,
  narrative: "",
  skippedAct2: false,
  framework: null,
  feeling: null,
  constraintDetail: "",
  smoothDayNote: "",
  frameworkHelpedConstraint: null,
});

// Derived atoms
export const currentStepAtom = atom((get) => get(reportAtom).step);

export const tensionSummaryAtom = atom((get) => {
  const { deliverables, unplanned } = get(reportAtom);
  const done = deliverables.filter((d) => d.status === "done").length;
  const partial = deliverables.filter((d) => d.status === "partial").length;
  const notDone = deliverables.filter((d) => d.status === "not_done").length;
  const plannedMins = deliverables.reduce((sum, d) => sum + d.estimateMins, 0);
  const actualMins = deliverables.reduce((sum, d) => sum + d.actualMins, 0);
  const unplannedMins = unplanned.reduce((sum, d) => sum + d.minutesTaken, 0);
  return { done, partial, notDone, plannedMins, actualMins, unplannedMins, total: deliverables.length };
});

// Step navigation helper
export const goToStepAtom = atom(null, (get, set, step: FlowStep) => {
  set(reportAtom, { ...get(reportAtom), step });
});

// ── Backend data atoms (populated by DailyReportV7Engine) ──

/** Dictionaries from ontology endpoints — constraints, navigations, frameworks, feelings */
export const dictionariesAtom = atom<V7Dictionaries | null>(null);

/** Context signals for tree branching decisions */
export const signalsAtom = atom<V7Signals | null>(null);

/** Feedback signals returned after submit */
export const feedbackAtom = atom<FeedbackSignals | null>(null);

/** Advisory AI reflection feedback returned after submit (exit doorway). */
export const aiFeedbackAtom = atom<AiFeedback | null>(null);

/**
 * The submitted report's id — set from the submit response. Sources the
 * heroics→constraint filing (W2.3) so a filed Spotted IO carries the report
 * as its source. Only populated after a live submit (the heroics signal itself
 * is only attached to the submit response, never rebuilt on reload/regenerate).
 */
export const reportIdAtom = atom<string | null>(null);

/** True while the submit request is in flight — drives the AI panel loading state. */
export const submitPendingAtom = atom<boolean>(false);
