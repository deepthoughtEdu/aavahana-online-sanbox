"use client";

import React from "react";
import { PlanColumn } from "./PlanColumn";
import { ActualsColumn } from "./ActualsColumn";
import { GapSummary } from "./GapSummary";
import { UnplannedItemForm } from "./UnplannedItemForm";
import type {
  PlannedItemWithStatus,
  UnplannedWorkItem,
  SectionAGap,
  SectionATimeSummary,
  UnplannedSourceTag,
} from "@/types/aavahana/report-v5.types";

interface TensionLayoutProps {
  plannedItems: PlannedItemWithStatus[];
  unplannedWork: UnplannedWorkItem[];
  gap: SectionAGap;
  timeSummary: SectionATimeSummary;
  onCycleStatus: (taskId: string) => void;
  onAdjustTime: (taskId: string, deltaMins: number) => void;
  onAddUnplanned: (item: UnplannedWorkItem) => void;
  onRemoveUnplanned: (index: number) => void;
  onAdjustUnplannedTime: (index: number, deltaMins: number) => void;
  onUpdateSourceTag: (index: number, tag: UnplannedSourceTag) => void;
}

export function TensionLayout({
  plannedItems,
  unplannedWork,
  gap,
  timeSummary,
  onCycleStatus,
  onAdjustTime,
  onAddUnplanned,
  onRemoveUnplanned,
  onAdjustUnplannedTime,
  onUpdateSourceTag,
}: TensionLayoutProps) {
  return (
    <div className="rounded-lg border border-base-300 bg-base-100 p-4">
      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left: The Plan */}
        <PlanColumn
          items={plannedItems}
          onCycleStatus={onCycleStatus}
          onAdjustTime={onAdjustTime}
        />

        {/* Right: What Happened */}
        <ActualsColumn
          plannedItems={plannedItems}
          unplannedWork={unplannedWork}
          onRemoveUnplanned={onRemoveUnplanned}
          onAdjustUnplannedTime={onAdjustUnplannedTime}
          onUpdateSourceTag={onUpdateSourceTag}
        />
      </div>

      {/* Gap + time summary bar */}
      <GapSummary gap={gap} timeSummary={timeSummary} />

      {/* Manual add form */}
      <UnplannedItemForm onAdd={onAddUnplanned} />
    </div>
  );
}
