// src/types/aavahana/weekly-plan-v2.types.ts
//
// Types for the Weekly Plan v2 route (/aavahana/weekly-plan-v2).
// Frame A: planning + reflection ritual. V1 (individual) scope only for now.
// Kept separate from the existing weekly-plan.types.ts to avoid coupling
// during the prototype phase.

export enum WeeklyChipSource {
  AI = "ai",
  MANUAL = "manual",
  CARRY = "carry",
  MONTHLY = "monthly",
}

export type WeeklyChipSourceValue = `${WeeklyChipSource}`;

export type WeekDay =
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"
  | "sun";

export type ChipPriority = "high" | "medium" | "low";

/**
 * Chip schema for v1.
 * `day` null = Unassigned bucket.
 * `priority` and `estimateMins` are optional; AI may pre-fill them but the
 * user can always edit. `programId`/`programName` only exist on monthly /
 * carry-forward chips.
 */
export interface WeeklyPlanV2Chip {
  id: string;
  title: string;
  source: WeeklyChipSourceValue;
  day?: WeekDay | null;
  priority?: ChipPriority;
  estimateMins?: number;
  programId?: string;
  programName?: string;
}

/** Read-only summary row for last week's recap. */
export interface WeeklyV2LastWeekItem {
  id: string;
  title: string;
  status: "delivered" | "carried";
}

export type WeeklyV2CreateMode = "ai" | "manual";

/** Return shape for the useWeeklyPlanV2 hook. */
export interface UseWeeklyPlanV2Return {
  // meta
  weekLabel: string;
  hasPreviousWeek: boolean;
  isSubmitted: boolean;
  isLoading: boolean;

  // last week (only meaningful if hasPreviousWeek)
  lastWeekItems: WeeklyV2LastWeekItem[];
  recurringBlocker: string | null;

  // reflection
  reflection: string;
  setReflection: (text: string) => void;

  // create your week
  createMode: WeeklyV2CreateMode;
  setCreateMode: (mode: WeeklyV2CreateMode) => void;

  // AI flow
  aiDraft: string;
  setAiDraft: (text: string) => void;
  parseWithAi: (draft?: string) => Promise<void>;
  isParsing: boolean;

  // chips (this week's plan)
  chips: WeeklyPlanV2Chip[];
  addManualChip: (title: string) => void;
  updateChip: (id: string, updates: Partial<WeeklyPlanV2Chip>) => void;
  removeChip: (id: string) => void;

  // imports
  carryForwardCandidates: WeeklyPlanV2Chip[];
  monthlyBasketCandidates: WeeklyPlanV2Chip[];
  importFromCarry: (id: string) => void;
  importFromMonthly: (id: string) => void;

  // dependency Q
  dependencyChipId: string | null;
  setDependencyChipId: (id: string | null) => void;

  // submit
  canSubmit: boolean;
  totalEstimateMins: number;
  submit: () => Promise<void>;
  isSubmitting: boolean;
}
