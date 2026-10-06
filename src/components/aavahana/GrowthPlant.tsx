"use client";

import type { LucideIcon } from "lucide-react";
import {
  Bean,
  Sprout,
  Shrub,
  LeafyGreen,
  TreeDeciduous,
  Flower2,
  Flower,
} from "lucide-react";
import { useGrowthStreak } from "@/lib/hooks/aavahana/use-growth-streak";

/**
 * The seed that grows into a plant as you submit daily reports (growth habit).
 * Stage is driven by the growth score (submitted reports minus missed weekdays):
 * each submitted report nudges it forward, each missed weekday pulls it back a
 * step, and weekends never count. Shown in the daily plan and daily report
 * headers. Each stage is a professionally drawn Lucide icon (the app's icon
 * set), so it stays crisp at any size.
 */

interface Stage {
  min: number;
  name: string;
  Icon: LucideIcon;
}

// 7 stages. `min` = submitted daily reports needed to reach the stage. The plant
// grows fuller, then flowers, ending on the Blooming bloom.
const STAGES: Stage[] = [
  { min: 0, name: "Seed", Icon: Bean },
  { min: 1, name: "Sprout", Icon: Sprout },
  { min: 3, name: "Seedling", Icon: Shrub },
  { min: 7, name: "Leafing", Icon: LeafyGreen },
  { min: 14, name: "Growing", Icon: TreeDeciduous },
  { min: 30, name: "Budding", Icon: Flower2 },
  { min: 60, name: "Blooming", Icon: Flower },
];

function stageFor(days: number): { idx: number; stage: Stage; next: Stage | null } {
  let idx = 0;
  for (let i = 0; i < STAGES.length; i += 1) {
    if (days >= STAGES[i].min) idx = i;
  }
  return { idx, stage: STAGES[idx], next: STAGES[idx + 1] ?? null };
}

export function GrowthPlant() {
  const { data: streak, isLoading } = useGrowthStreak();
  if (isLoading || !streak) return null;

  const { stage, next } = stageFor(streak.growthScore);
  const toNext = next ? Math.max(0, next.min - streak.growthScore) : 0;
  const Icon = stage.Icon;

  const streakLine =
    streak.currentStreak > 1 ? ` ${streak.currentStreak} day streak going.` : "";
  const tooltip = next
    ? `${stage.name}. You have logged ${streak.submittedDays} daily report${
        streak.submittedDays === 1 ? "" : "s"
      }. ${toNext} more to ${next.name}. A missed weekday sets it back a step; weekends do not count.`
    : `${stage.name}. ${streak.submittedDays} daily reports logged. Fully grown, keep it up.${streakLine}`;

  return (
    <span
      title={tooltip}
      aria-label={tooltip}
      className="inline-flex items-center gap-1.5 rounded-full border border-base-200 bg-base-100 px-2.5 py-1 select-none"
    >
      <Icon className="h-4 w-4 text-base-content/80" aria-hidden />
      <span className="hidden text-xs font-medium text-base-content/70 sm:inline">
        {stage.name}
      </span>
    </span>
  );
}
