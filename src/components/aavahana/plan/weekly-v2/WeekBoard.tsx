"use client";

import { Button } from "@/components/shared/Button";
import { PlusIcon, WarningIcon } from "@/components/shared/icons";
import { cn } from "@/utils";
import { TaskCard } from "./TaskCard";
import type {
  WeeklyPlanV2Chip,
  WeekDay,
} from "@/types/aavahana/weekly-plan-v2.types";

interface Props {
  chips: WeeklyPlanV2Chip[];
  updateChip: (id: string, updates: Partial<WeeklyPlanV2Chip>) => void;
  removeChip: (id: string) => void;
  onQuickAdd: (day: WeekDay | null) => void;
}

type DayKey = WeekDay;

const DAYS: { key: DayKey; short: string; long: string }[] = [
  { key: "mon", short: "Mon", long: "Monday" },
  { key: "tue", short: "Tue", long: "Tuesday" },
  { key: "wed", short: "Wed", long: "Wednesday" },
  { key: "thu", short: "Thu", long: "Thursday" },
  { key: "fri", short: "Fri", long: "Friday" },
];

const DAY_OVERCOMMIT_MINS = 480;

export function WeekBoard({
  chips,
  updateChip,
  removeChip,
  onQuickAdd,
}: Props) {
  const byDay = new Map<DayKey, WeeklyPlanV2Chip[]>();
  for (const d of DAYS) byDay.set(d.key, []);
  const unassigned: WeeklyPlanV2Chip[] = [];
  for (const c of chips) {
    if (c.day && byDay.has(c.day as DayKey)) {
      byDay.get(c.day as DayKey)!.push(c);
    } else {
      unassigned.push(c);
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "grid gap-3",
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
        )}
      >
        {DAYS.map((d) => {
          const dayChips = byDay.get(d.key) ?? [];
          const totalMins = dayChips.reduce(
            (sum, c) => sum + (c.estimateMins ?? 0),
            0
          );
          const hrs = totalMins / 60;
          const over = totalMins > DAY_OVERCOMMIT_MINS;

          return (
            <div
              key={d.key}
              className={cn(
                "rounded-lg border bg-base-100 p-3 flex flex-col gap-2 min-h-[200px]",
                over ? "border-error/40" : "border-base-300"
              )}
            >
              <div className="flex items-baseline justify-between border-b border-base-300 pb-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-black">
                    {d.short}
                  </p>
                  <p
                    className={cn(
                      "text-xs mt-0.5",
                      over ? "text-error font-medium" : "text-neutral"
                    )}
                  >
                    {dayChips.length === 0 ? (
                      <span className="italic opacity-60">empty</span>
                    ) : (
                      <>
                        {dayChips.length}
                        {dayChips.length === 1 ? " item" : " items"}
                        {totalMins > 0 && ` · ~${hrs.toFixed(1)}h`}
                      </>
                    )}
                  </p>
                </div>
                {over && (
                  <span
                    className="text-error"
                    title="Overcommitted — over 8h"
                  >
                    <WarningIcon size="xs" />
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5 flex-1">
                {dayChips.map((c) => (
                  <TaskCard
                    key={c.id}
                    chip={c}
                    onUpdate={(u) => updateChip(c.id, u)}
                    onRemove={() => removeChip(c.id)}
                  />
                ))}
              </div>

              <Button
                color="primary"
                variant="ghost"
                size="xs"
                modifier="block"
                onClick={() => onQuickAdd(d.key)}
                iconBefore={<PlusIcon size="xs" />}
                className="justify-center text-xs"
              >
                Add to {d.short}
              </Button>
            </div>
          );
        })}
      </div>

      {unassigned.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
          <div className="flex items-baseline justify-between mb-2 border-b border-warning/30 pb-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-warning">
                Unassigned
              </p>
              <p className="text-xs text-neutral mt-0.5">
                {unassigned.length}{" "}
                {unassigned.length === 1 ? "item without a day" : "items without a day"}
              </p>
            </div>
            <Button
              color="warning"
              variant="ghost"
              size="xs"
              onClick={() => onQuickAdd(null)}
              iconBefore={<PlusIcon size="xs" />}
              className="text-xs"
            >
              Add unassigned
            </Button>
          </div>
          <div
            className={cn(
              "grid gap-2",
              "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            )}
          >
            {unassigned.map((c) => (
              <TaskCard
                key={c.id}
                chip={c}
                onUpdate={(u) => updateChip(c.id, u)}
                onRemove={() => removeChip(c.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
