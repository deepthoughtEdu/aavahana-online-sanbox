"use client";

import { useState, useCallback, useMemo } from "react";
import { useApi } from "@/lib/hooks/shared/use-api";
import { ReportService } from "@/lib/services/aavahana/report.service";
import { STATUS_CYCLE } from "@/types/aavahana/report-v5.types";
import type {
  PlannedItemWithStatus,
  PlannedItemStatus,
  UnplannedWorkItem,
  SectionAPhase,
  SectionAGap,
  SectionATimeSummary,
} from "@/types/aavahana/report-v5.types";

interface UseSectionAReturn {
  // Data
  plannedItems: PlannedItemWithStatus[];
  unplannedWork: UnplannedWorkItem[];
  phase: SectionAPhase;
  gap: SectionAGap;
  timeSummary: SectionATimeSummary;
  isLoading: boolean;
  planSubmitted: boolean;

  // Actions
  cycleStatus: (taskId: string) => void;
  adjustTime: (taskId: string, deltaMins: number) => void;
  receiveUnplannedWork: (items: UnplannedWorkItem[]) => void;
  addUnplannedItem: (item: UnplannedWorkItem) => void;
  removeUnplannedItem: (index: number) => void;
  adjustUnplannedTime: (index: number, deltaMins: number) => void;
  updateUnplannedSourceTag: (index: number, sourceTag: UnplannedWorkItem["sourceTag"]) => void;
  getSectionData: () => {
    plannedItems: PlannedItemWithStatus[];
    unplannedWork: UnplannedWorkItem[];
  };
}

/**
 * useSectionA — two-state Section A hook.
 *
 * State 1 (toggle + time): Fetch planned items with budgets. User taps 3-state toggle
 *   (done/partial/not-done) and adjusts actual time via [−][+] stepper.
 * State 2 (tension): After Section B voice/text, receives unplanned items (with time).
 *   Re-renders as two-column plan vs actuals layout with time delta.
 *
 * @param date - ISO date string (YYYY-MM-DD)
 */
export function useSectionA(date: string): UseSectionAReturn {
  // ── Local state (user edits on top of API data) ──
  const [localStatus, setLocalStatus] = useState<Record<string, PlannedItemStatus>>({});
  const [localTime, setLocalTime] = useState<Record<string, number>>({});
  const [unplannedWork, setUnplannedWork] = useState<UnplannedWorkItem[]>([]);
  const [phase, setPhase] = useState<SectionAPhase>("toggle");

  // ── Fetch planned items from backend ──
  const { data: context, isLoading } = useApi({
    queryKey: ["section-a-context", date],
    queryFn: () => ReportService.getSectionAContext(date),
    enabled: !!date,
  });

  // ── Merge API data with local overrides ──
  const plannedItems: PlannedItemWithStatus[] = useMemo(() => {
    if (!context?.plannedItems) return [];
    return context.plannedItems.map((item) => ({
      ...item,
      status: localStatus[item.taskId] ?? item.status,
      actualMins: localTime[item.taskId] ?? item.actualMins,
    }));
  }, [context?.plannedItems, localStatus, localTime]);

  // ── Computed gap ──
  const gap: SectionAGap = useMemo(() => ({
    done: plannedItems.filter((i) => i.status === "done").length,
    partial: plannedItems.filter((i) => i.status === "partial").length,
    notDone: plannedItems.filter((i) => i.status === "not_done").length,
    unplanned: unplannedWork.length,
  }), [plannedItems, unplannedWork]);

  // ── Computed time summary ──
  const timeSummary: SectionATimeSummary = useMemo(() => {
    const budgetMins = plannedItems.reduce((s, i) => s + i.budgetMins, 0);
    const plannedActualMins = plannedItems.reduce((s, i) => s + i.actualMins, 0);
    const unplannedMins = unplannedWork.reduce((s, i) => s + i.minutesTaken, 0);
    return {
      budgetMins,
      plannedActualMins,
      unplannedMins,
      totalActualMins: plannedActualMins + unplannedMins,
    };
  }, [plannedItems, unplannedWork]);

  // ── Actions ──

  /** Cycle through 3 states: not_done → done → partial → not_done */
  const cycleStatus = useCallback((taskId: string) => {
    setLocalStatus((prev) => {
      const currentItem = plannedItems.find((i) => i.taskId === taskId);
      const current = prev[taskId] ?? currentItem?.status ?? "not_done";
      const currentIndex = STATUS_CYCLE.indexOf(current);
      const next = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];
      return { ...prev, [taskId]: next };
    });

    // Only auto-zero time when marking not_done (you didn't do it = 0 time)
    setLocalTime((prev) => {
      const currentItem = plannedItems.find((i) => i.taskId === taskId);
      const currentStatus = localStatus[taskId] ?? currentItem?.status ?? "not_done";
      const currentIndex = STATUS_CYCLE.indexOf(currentStatus);
      const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];

      if (nextStatus === "not_done") {
        return { ...prev, [taskId]: 0 };
      }
      // done / partial — keep current time (defaults to budget from API)
      return prev;
    });
  }, [plannedItems, localStatus]);

  /** Adjust actual time by deltaMins (typically +30 or -30). Clamped to >= 0. */
  const adjustTime = useCallback((taskId: string, deltaMins: number) => {
    setLocalTime((prev) => {
      const currentItem = plannedItems.find((i) => i.taskId === taskId);
      const current = prev[taskId] ?? currentItem?.actualMins ?? 0;
      return { ...prev, [taskId]: Math.max(0, current + deltaMins) };
    });
  }, [plannedItems]);

  /** Called by the parent container after Section B LLM returns unplanned items */
  const receiveUnplannedWork = useCallback((items: UnplannedWorkItem[]) => {
    setUnplannedWork(items);
    setPhase("tension");
  }, []);

  const addUnplannedItem = useCallback((item: UnplannedWorkItem) => {
    setUnplannedWork((prev) => [...prev, item]);
    setPhase("tension");
  }, []);

  const removeUnplannedItem = useCallback((index: number) => {
    setUnplannedWork((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /** Adjust unplanned item time by deltaMins. Clamped to >= 0. */
  const adjustUnplannedTime = useCallback((index: number, deltaMins: number) => {
    setUnplannedWork((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, minutesTaken: Math.max(0, item.minutesTaken + deltaMins) }
          : item
      )
    );
  }, []);

  const updateUnplannedSourceTag = useCallback(
    (index: number, sourceTag: UnplannedWorkItem["sourceTag"]) => {
      setUnplannedWork((prev) =>
        prev.map((item, i) => (i === index ? { ...item, sourceTag } : item))
      );
    },
    []
  );

  const getSectionData = useCallback(() => ({
    plannedItems,
    unplannedWork,
  }), [plannedItems, unplannedWork]);

  return {
    plannedItems,
    unplannedWork,
    phase,
    gap,
    timeSummary,
    isLoading,
    planSubmitted: context?.planSubmitted ?? false,
    cycleStatus,
    adjustTime,
    receiveUnplannedWork,
    addUnplannedItem,
    removeUnplannedItem,
    adjustUnplannedTime,
    updateUnplannedSourceTag,
    getSectionData,
  };
}
