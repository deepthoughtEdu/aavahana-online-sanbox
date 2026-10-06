"use client";

import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { CloseIcon } from "@/components/shared/icons";
import { cn } from "@/utils";
import type {
  WeeklyPlanV2Chip,
  WeekDay,
  ChipPriority,
} from "@/types/aavahana/weekly-plan-v2.types";

interface Props {
  chip: WeeklyPlanV2Chip;
  onUpdate: (updates: Partial<WeeklyPlanV2Chip>) => void;
  onRemove: () => void;
}

const PRIORITY_DOT: Record<ChipPriority | "none", string> = {
  high: "bg-error",
  medium: "bg-warning",
  low: "bg-info",
  none: "bg-base-300",
};

const PRIORITY_SELECT_TEXT: Record<ChipPriority | "none", string> = {
  high: "text-error",
  medium: "text-warning",
  low: "text-info",
  none: "text-neutral",
};

export function TaskCard({ chip, onUpdate, onRemove }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(chip.title);

  function commit() {
    const next = draft.trim();
    if (next && next !== chip.title) onUpdate({ title: next });
    if (!next) setDraft(chip.title);
    setEditing(false);
  }

  function cancel() {
    setDraft(chip.title);
    setEditing(false);
  }

  const priorityKey = chip.priority ?? "none";

  return (
    <div
      className={cn(
        "group bg-white border border-base-300 rounded-md px-2.5 py-2",
        "hover:border-primary/40 transition-colors",
        "flex flex-col gap-1.5"
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "w-2 h-2 rounded-full mt-1.5 shrink-0",
            PRIORITY_DOT[priorityKey]
          )}
          aria-hidden
        />

        {editing ? (
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") cancel();
            }}
            className="input input-bordered input-xs flex-1 text-sm"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex-1 text-left text-sm text-black hover:text-primary leading-snug min-w-0 break-words"
          >
            {chip.title}
          </button>
        )}

        <Button
          color="error"
          variant="ghost"
          size="xs"
          shape="square"
          onClick={onRemove}
          aria-label="Remove"
          className="shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
        >
          <CloseIcon size="xs" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1 pl-4">
        <select
          value={chip.day ?? ""}
          onChange={(e) =>
            onUpdate({
              day: e.target.value === "" ? null : (e.target.value as WeekDay),
            })
          }
          className="select select-bordered select-xs text-[10px] h-6 min-h-0 px-1"
          aria-label="Day"
          title="Day"
        >
          <option value="">—</option>
          <option value="mon">Mon</option>
          <option value="tue">Tue</option>
          <option value="wed">Wed</option>
          <option value="thu">Thu</option>
          <option value="fri">Fri</option>
        </select>

        <select
          value={chip.priority ?? ""}
          onChange={(e) =>
            onUpdate({
              priority:
                e.target.value === ""
                  ? undefined
                  : (e.target.value as ChipPriority),
            })
          }
          className={cn(
            "select select-bordered select-xs text-[10px] h-6 min-h-0 px-1",
            PRIORITY_SELECT_TEXT[priorityKey]
          )}
          aria-label="Priority"
          title="Priority"
        >
          <option value="">Pri</option>
          <option value="high">High</option>
          <option value="medium">Med</option>
          <option value="low">Low</option>
        </select>

        <input
          type="number"
          min={0}
          step={15}
          value={chip.estimateMins ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onUpdate({
              estimateMins: v === "" ? undefined : Math.max(0, Number(v)),
            });
          }}
          placeholder="min"
          className="input input-bordered input-xs text-[10px] h-6 min-h-0 px-1 w-12"
          aria-label="Estimate in minutes"
          title="Estimate (minutes)"
        />
      </div>
    </div>
  );
}
