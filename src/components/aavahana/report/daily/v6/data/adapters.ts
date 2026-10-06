import type { PlannedItemWithStatus } from "@/types/aavahana/report-v5.types";
import { MOCK_PLANNED_DELIVERABLES } from "./mockData";
import type { PlannedDeliverable } from "./types";

export function toPlannedItems(deliverables?: PlannedDeliverable[]): PlannedItemWithStatus[] {
  const source = deliverables ?? MOCK_PLANNED_DELIVERABLES;
  return source.map((d) => ({
    taskId: String(d.id),
    text: d.label,
    status: d.status ?? "not_done",
    actualMins: d.actualMins,         // SA-4: wire real value
    budgetMins: d.estimateMins,
    autoPopulated: false,
    isCriticalPath: d.isCriticalPath, // SA-8
  }));
}
