import { atom } from "jotai";
import type { ReportState, PlannedDeliverable, FlowStep } from "./types";
import { MOCK_PLANNED_DELIVERABLES } from "./mockData";

// Deep-clone mock data so state is mutable
const initialDeliverables: PlannedDeliverable[] = MOCK_PLANNED_DELIVERABLES.map((d) => ({
  ...d,
}));

export const reportAtom = atom<ReportState>({
  step: "act1",
  startedAt: 0, // F-2: set to Date.now() on component mount, not module load
  deliverables: initialDeliverables,
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
  const actualMins = deliverables.reduce((sum, d) => sum + d.actualMins, 0); // SA-9
  const unplannedMins = unplanned.reduce((sum, d) => sum + d.minutesTaken, 0);
  return { done, partial, notDone, plannedMins, actualMins, unplannedMins, total: deliverables.length };
});

// Step navigation helper
export const goToStepAtom = atom(null, (get, set, step: FlowStep) => {
  set(reportAtom, { ...get(reportAtom), step });
});
