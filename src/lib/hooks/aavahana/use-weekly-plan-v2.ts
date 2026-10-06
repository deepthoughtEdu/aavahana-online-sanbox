"use client";

// src/lib/hooks/aavahana/use-weekly-plan-v2.ts
//
// V1 prototype hook for /aavahana/weekly-plan-v2.
// Mock data only — no backend wiring. AI parsing simulated with a timeout.

import { useCallback, useMemo, useState } from "react";
import {
  WeeklyChipSource,
  type UseWeeklyPlanV2Return,
  type WeeklyPlanV2Chip,
  type WeeklyV2CreateMode,
  type WeeklyV2LastWeekItem,
} from "@/types/aavahana/weekly-plan-v2.types";

// ─── Mock data ──────────────────────────────────────────────────────────────

const MOCK_WEEK_LABEL = "Week of May 12 — May 18, 2026";

const MOCK_LAST_WEEK_ITEMS: WeeklyV2LastWeekItem[] = [
  { id: "lw-1", title: "Job cards updated — SF2 (8 orders)", status: "delivered" },
  { id: "lw-2", title: "Stores material confirmation — Mon batch", status: "delivered" },
  { id: "lw-3", title: "Daily output report (M–F)", status: "delivered" },
  { id: "lw-4", title: "FG inventory reconciliation", status: "carried" },
  { id: "lw-5", title: "Cross-check dispatch schedule", status: "carried" },
];

const MOCK_RECURRING_BLOCKER =
  "Stores has been your blocker 8 of the last 12 weeks. The system noticed before you did.";

const MOCK_CARRY_CANDIDATES: WeeklyPlanV2Chip[] = [
  {
    id: "carry-1",
    title: "FG inventory reconciliation",
    source: WeeklyChipSource.CARRY,
    estimateMins: 40,
    programName: "Alpha Manufacturing",
  },
  {
    id: "carry-2",
    title: "Cross-check dispatch schedule",
    source: WeeklyChipSource.CARRY,
    estimateMins: 35,
    programName: "Alpha Manufacturing",
  },
];

const MOCK_MONTHLY_CANDIDATES: WeeklyPlanV2Chip[] = [
  {
    id: "mon-1",
    title: "Job cards — SF1 + SF2 (12 orders)",
    source: WeeklyChipSource.MONTHLY,
    estimateMins: 60,
    programName: "Alpha Manufacturing",
  },
  {
    id: "mon-2",
    title: "PO-4471 follow-up with stores",
    source: WeeklyChipSource.MONTHLY,
    estimateMins: 30,
    programName: "Alpha Manufacturing",
  },
  {
    id: "mon-3",
    title: "Dispatch sync with Prasad — Wed",
    source: WeeklyChipSource.MONTHLY,
    estimateMins: 45,
    programName: "Alpha Manufacturing",
  },
  {
    id: "mon-4",
    title: "Update SF2 routing card",
    source: WeeklyChipSource.MONTHLY,
    estimateMins: 30,
    programName: "Alpha Manufacturing",
  },
];

// Canned AI parse result — simulates what an LLM would return for a typical input.
// Includes day/priority assignments so the demo shows the week's shape immediately.
const MOCK_AI_PARSE: Omit<WeeklyPlanV2Chip, "id">[] = [
  {
    title: "Wrap up SF2 audit — final 4 orders",
    source: WeeklyChipSource.AI,
    estimateMins: 90,
    day: "mon",
    priority: "high",
  },
  {
    title: "Onboard Geeta on routing card workflow",
    source: WeeklyChipSource.AI,
    estimateMins: 45,
    day: "wed",
    priority: "medium",
  },
  {
    title: "QA review with Prasad on dispatch handoff",
    source: WeeklyChipSource.AI,
    estimateMins: 30,
    day: "thu",
    priority: "medium",
  },
  {
    title: "Document the stores escalation runbook",
    source: WeeklyChipSource.AI,
    estimateMins: 40,
    day: "fri",
    priority: "low",
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

let chipIdCounter = 0;
function nextChipId(prefix = "chip"): string {
  chipIdCounter += 1;
  return `${prefix}-${chipIdCounter}`;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useWeeklyPlanV2(): UseWeeklyPlanV2Return {
  const hasPreviousWeek = true; // mock: assume returning user
  const isLoading = false;

  const [reflection, setReflection] = useState("");
  const [createMode, setCreateMode] = useState<WeeklyV2CreateMode>("ai");
  const [aiDraft, setAiDraft] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [chips, setChips] = useState<WeeklyPlanV2Chip[]>([]);
  const [dependencyChipId, setDependencyChipId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carry / monthly remaining = candidates minus ones already imported (matched by title)
  const importedTitles = useMemo(
    () => new Set(chips.map((c) => c.title)),
    [chips]
  );

  const carryForwardCandidates = useMemo(
    () => MOCK_CARRY_CANDIDATES.filter((c) => !importedTitles.has(c.title)),
    [importedTitles]
  );

  const monthlyBasketCandidates = useMemo(
    () => MOCK_MONTHLY_CANDIDATES.filter((c) => !importedTitles.has(c.title)),
    [importedTitles]
  );

  // ─── Mutations ────────────────────────────────────────────────────────────

  const parseWithAi = useCallback(
    async (draft?: string) => {
      const text = (draft ?? aiDraft).trim();
      if (!text) return;
      setIsParsing(true);
      // Simulate LLM latency
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const parsed: WeeklyPlanV2Chip[] = MOCK_AI_PARSE.map((p) => ({
        ...p,
        id: nextChipId("ai"),
      }));
      setChips((prev) => [...prev, ...parsed]);
      setIsParsing(false);
    },
    [aiDraft]
  );

  const addManualChip = useCallback((title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setChips((prev) => [
      ...prev,
      {
        id: nextChipId("manual"),
        title: trimmed,
        source: WeeklyChipSource.MANUAL,
      },
    ]);
  }, []);

  const updateChip = useCallback(
    (id: string, updates: Partial<WeeklyPlanV2Chip>) => {
      setChips((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
    },
    []
  );

  const removeChip = useCallback(
    (id: string) => {
      setChips((prev) => prev.filter((c) => c.id !== id));
      if (dependencyChipId === id) setDependencyChipId(null);
    },
    [dependencyChipId]
  );

  const importFromCarry = useCallback((id: string) => {
    const candidate = MOCK_CARRY_CANDIDATES.find((c) => c.id === id);
    if (!candidate) return;
    setChips((prev) => [...prev, { ...candidate, id: nextChipId("carry") }]);
  }, []);

  const importFromMonthly = useCallback((id: string) => {
    const candidate = MOCK_MONTHLY_CANDIDATES.find((c) => c.id === id);
    if (!candidate) return;
    setChips((prev) => [...prev, { ...candidate, id: nextChipId("monthly") }]);
  }, []);

  const totalEstimateMins = useMemo(
    () =>
      chips.reduce((sum, c) => sum + (c.estimateMins ?? 0), 0),
    [chips]
  );

  const canSubmit = chips.length > 0 && !isSubmitting && !isSubmitted;

  const submit = useCallback(async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSubmitted(true);
    setIsSubmitting(false);
  }, [canSubmit]);

  return {
    weekLabel: MOCK_WEEK_LABEL,
    hasPreviousWeek,
    isSubmitted,
    isLoading,

    lastWeekItems: MOCK_LAST_WEEK_ITEMS,
    recurringBlocker: MOCK_RECURRING_BLOCKER,

    reflection,
    setReflection,

    createMode,
    setCreateMode,

    aiDraft,
    setAiDraft,
    parseWithAi,
    isParsing,

    chips,
    addManualChip,
    updateChip,
    removeChip,

    carryForwardCandidates,
    monthlyBasketCandidates,
    importFromCarry,
    importFromMonthly,

    dependencyChipId,
    setDependencyChipId,

    canSubmit,
    totalEstimateMins,
    submit,
    isSubmitting,
  };
}
