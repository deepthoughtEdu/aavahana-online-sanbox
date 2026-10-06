"use client";

import React from "react";
import { ToggleList } from "./ToggleList";
import { TensionLayout } from "./TensionLayout";
import type {
  PlannedItemWithStatus,
  UnplannedWorkItem,
  SectionAPhase,
  SectionAGap,
  SectionATimeSummary,
  UnplannedSourceTag,
} from "@/types/aavahana/report-v5.types";

interface SectionAProps {
  plannedItems: PlannedItemWithStatus[];
  unplannedWork: UnplannedWorkItem[];
  phase: SectionAPhase;
  gap: SectionAGap;
  timeSummary: SectionATimeSummary;
  isLoading: boolean;
  onCycleStatus: (taskId: string) => void;
  onAdjustTime: (taskId: string, deltaMins: number) => void;
  onAddUnplanned: (item: UnplannedWorkItem) => void;
  onRemoveUnplanned: (index: number) => void;
  onAdjustUnplannedTime: (index: number, deltaMins: number) => void;
  onUpdateSourceTag: (index: number, tag: UnplannedSourceTag) => void;
  onProceedToSectionB?: () => void;
}

export function SectionA({
  plannedItems,
  unplannedWork,
  phase,
  gap,
  timeSummary,
  isLoading,
  onCycleStatus,
  onAdjustTime,
  onAddUnplanned,
  onRemoveUnplanned,
  onAdjustUnplannedTime,
  onUpdateSourceTag,
  onProceedToSectionB,
}: SectionAProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }

  if (plannedItems.length === 0) {
    return (
      <div className="rounded-lg bg-base-200 p-6 text-center text-neutral">
        No plan submitted for today. Submit your daily plan first.
      </div>
    );
  }

  if (phase === "toggle") {
    return (
      <ToggleList
        items={plannedItems}
        onCycleStatus={onCycleStatus}
        onAdjustTime={onAdjustTime}
        onProceed={onProceedToSectionB}
      />
    );
  }

  return (
    <TensionLayout
      plannedItems={plannedItems}
      unplannedWork={unplannedWork}
      gap={gap}
      timeSummary={timeSummary}
      onCycleStatus={onCycleStatus}
      onAdjustTime={onAdjustTime}
      onAddUnplanned={onAddUnplanned}
      onRemoveUnplanned={onRemoveUnplanned}
      onAdjustUnplannedTime={onAdjustUnplannedTime}
      onUpdateSourceTag={onUpdateSourceTag}
    />
  );
}
