"use client";

import React from "react";
import { TimeStepper } from "./TimeStepper";
import { UNPLANNED_SOURCE_LABELS } from "@/types/aavahana/report-v5.types";
import type {
  PlannedItemWithStatus,
  UnplannedWorkItem,
  UnplannedSourceTag,
} from "@/types/aavahana/report-v5.types";

interface ActualsColumnProps {
  plannedItems: PlannedItemWithStatus[];
  unplannedWork: UnplannedWorkItem[];
  onRemoveUnplanned: (index: number) => void;
  onAdjustUnplannedTime: (index: number, deltaMins: number) => void;
  onUpdateSourceTag: (index: number, tag: UnplannedSourceTag) => void;
}

export function ActualsColumn({
  plannedItems,
  unplannedWork,
  onRemoveUnplanned,
  onAdjustUnplannedTime,
  onUpdateSourceTag,
}: ActualsColumnProps) {
  const doneItems = plannedItems.filter((i) => i.status === "done" || i.status === "partial");

  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral">
        What Happened
      </h4>
      <div className="border-t border-base-300" />
      <ul className="mt-2 flex flex-col gap-2">
        {/* Done/partial items — matched from plan */}
        {doneItems.map((item) => (
          <li key={item.taskId} className="flex items-center gap-2 text-sm text-success">
            <span className="text-xs">{item.status === "done" ? "\u2713" : "\u25D0"}</span>
            <span className="flex-1">{item.text}</span>
            <span className="text-xs text-neutral">matched</span>
          </li>
        ))}

        {/* Unplanned items — from Section B LLM (with time) */}
        {unplannedWork.map((item, index) => (
          <li key={index} className="flex flex-col gap-1 rounded-md bg-base-200 p-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-base-content">
                <span className="mr-1 text-warning">+</span>
                {item.description}
              </span>
              <button
                type="button"
                onClick={() => onRemoveUnplanned(index)}
                className="text-xs text-error hover:underline"
              >
                remove
              </button>
            </div>

            {/* Source tag toggle buttons + time stepper */}
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {(Object.keys(UNPLANNED_SOURCE_LABELS) as UnplannedSourceTag[]).map(
                  (tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => onUpdateSourceTag(index, tag)}
                      className={`rounded-full px-2 py-0.5 text-xs transition-colors ${
                        item.sourceTag === tag
                          ? "bg-primary text-primary-content"
                          : "bg-base-300 text-neutral hover:bg-base-200"
                      }`}
                    >
                      {UNPLANNED_SOURCE_LABELS[tag]}
                    </button>
                  )
                )}
              </div>

              {/* Time stepper for unplanned item */}
              <TimeStepper
                minutes={item.minutesTaken}
                onAdjust={(delta) => onAdjustUnplannedTime(index, delta)}
              />
            </div>
          </li>
        ))}

        {/* Empty slots for not-done items — the spatial gap */}
        {plannedItems
          .filter((i) => i.status === "not_done")
          .map((item) => (
            <li
              key={`gap-${item.taskId}`}
              className="flex h-8 items-center rounded border border-dashed border-base-300 px-2 text-xs text-neutral opacity-40"
            >
              {/* intentionally sparse — the empty space IS the design */}
            </li>
          ))}
      </ul>
    </div>
  );
}
