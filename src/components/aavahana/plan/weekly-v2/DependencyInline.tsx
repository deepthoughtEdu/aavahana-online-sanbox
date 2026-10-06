"use client";

import { LightbulbIcon } from "@/components/shared/icons";
import type { WeeklyPlanV2Chip } from "@/types/aavahana/weekly-plan-v2.types";

interface Props {
  chips: WeeklyPlanV2Chip[];
  dependencyChipId: string | null;
  setDependencyChipId: (id: string | null) => void;
}

export function DependencyInline({
  chips,
  dependencyChipId,
  setDependencyChipId,
}: Props) {
  if (chips.length < 2) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-base-300 bg-base-100 px-4 py-3">
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-primary">
          <LightbulbIcon size="sm" />
        </span>
        <p className="text-sm text-black">
          If one slips,{" "}
          <span className="text-neutral">which holds up the most?</span>
        </p>
      </div>
      <select
        value={dependencyChipId ?? ""}
        onChange={(e) =>
          setDependencyChipId(e.target.value === "" ? null : e.target.value)
        }
        className="select select-bordered select-sm flex-1 text-sm"
        aria-label="Dependency"
      >
        <option value="">— pick the one most others depend on —</option>
        {chips.map((chip) => (
          <option key={chip.id} value={chip.id}>
            {chip.title}
          </option>
        ))}
      </select>
    </div>
  );
}
