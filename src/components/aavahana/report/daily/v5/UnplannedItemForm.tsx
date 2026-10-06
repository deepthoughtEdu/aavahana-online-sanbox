"use client";

import React, { useState } from "react";
import { TimeStepper } from "./TimeStepper";
import { UNPLANNED_SOURCE_LABELS, TIME_STEP_SMALL } from "@/types/aavahana/report-v5.types";
import type {
  UnplannedWorkItem,
  UnplannedSourceTag,
} from "@/types/aavahana/report-v5.types";

interface UnplannedItemFormProps {
  onAdd: (item: UnplannedWorkItem) => void;
}

const SOURCE_TAGS = Object.keys(UNPLANNED_SOURCE_LABELS) as UnplannedSourceTag[];

export function UnplannedItemForm({ onAdd }: UnplannedItemFormProps) {
  const [description, setDescription] = useState("");
  const [sourceTag, setSourceTag] = useState<UnplannedSourceTag>("interruption");
  const [minutesTaken, setMinutesTaken] = useState(TIME_STEP_SMALL); // default 30 min
  const [isOpen, setIsOpen] = useState(false);

  function handleAdd() {
    if (!description.trim()) return;
    onAdd({ description: description.trim(), sourceTag, minutesTaken });
    setDescription("");
    setSourceTag("interruption");
    setMinutesTaken(TIME_STEP_SMALL);
    setIsOpen(false);
  }

  if (!isOpen) {
    return (
      <button
        id="tour-deliver-unplanned"
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-3 w-full rounded-xl border border-dashed border-base-300 py-3 text-center text-sm text-base-content/50 transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 hover:text-primary active:scale-[0.98]"
      >
        <span className="mr-1.5 text-base-content/30">+</span>Add unplanned item manually
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-base-200 bg-base-50 p-4 shadow-sm">
      {/* Description input */}
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What did you do that wasn't on the plan?"
        className="input input-bordered input-sm w-full bg-base-100 focus:border-primary/50"
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        autoFocus
      />

      {/* Source tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {SOURCE_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setSourceTag(tag)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150 active:scale-95 ${
              sourceTag === tag
                ? "border-primary bg-primary text-primary-content shadow-sm shadow-primary/20"
                : "border-base-300 bg-base-100 text-base-content/60 hover:border-primary/40 hover:text-primary/80"
            }`}
          >
            {UNPLANNED_SOURCE_LABELS[tag]}
          </button>
        ))}
      </div>

      {/* Time stepper */}
      <div className="mt-3 flex items-center justify-between border-t border-base-200 pt-3">
        <span className="text-xs text-base-content/40">Time spent</span>
        <TimeStepper
          minutes={minutesTaken}
          onAdjust={(delta) => setMinutesTaken(Math.max(0, minutesTaken + delta))}
        />
      </div>

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!description.trim()}
          className="btn btn-sm btn-primary flex-1 disabled:opacity-40"
        >
          Add
        </button>
        <button type="button" onClick={() => setIsOpen(false)} className="btn btn-sm btn-ghost">
          Cancel
        </button>
      </div>
    </div>
  );
}
