"use client";

import { useState, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MonthlyPlanService } from "@/lib/services/aavahana/monthly-plan.service";
import { MonthlyReportService } from "@/lib/services/aavahana/monthly-report.service";
import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { toast } from "@/utils";
import type { MonthlyIPGoal } from "@/types/aavahana/monthly-plan.types";
import type { IPSummary, WeeklySummaryCard } from "@/types";
import { formatMonthLabel } from "@/utils/shared/date.utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

function offsetToMonth(offset: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// A month name from a 'YYYY-MM' key. One shared implementation; the UTC pin, and why it
// must not be removed, live in date.utils.
function toMonthLabel(month: string): string {
  return formatMonthLabel(month);
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function getPastMonths(currentMonth: string, count: number): string[] {
  const [y, m] = currentMonth.split("-").map(Number);
  const months: string[] = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date(y, m - 1 - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

function shortMonthLabel(month: string): string {
  return formatMonthLabel(month, { short: true, yearless: true });
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface IPFilters {
  zone?: "program" | "myzone";
}

export interface IPGoalHistory {
  month: string;
  monthLabel: string;
  target: number;
  actual: number;
}

export interface UseIPReturn {
  currentMonth: string;
  monthLabel: string;
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  isCurrentMonth: boolean;

  ipGoals: MonthlyIPGoal[];
  filteredGoals: MonthlyIPGoal[];
  ipSummary: IPSummary | null;
  weeklySummaries: WeeklySummaryCard[];
  planStatus: string | null;
  planId: string | null;
  goalHistory: Map<string, IPGoalHistory[]>;

  filters: IPFilters;
  setFilters: (f: IPFilters) => void;

  addIPGoal: (goal: Omit<MonthlyIPGoal, "id">) => Promise<void>;
  isAdding: boolean;

  isLoading: boolean;
  error: string | null;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useIP(): UseIPReturn {
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [filters, setFiltersState] = useState<IPFilters>({});

  const currentMonth = useMemo(() => offsetToMonth(offset), [offset]);
  const monthLabel = useMemo(() => toMonthLabel(currentMonth), [currentMonth]);
  const isCurrentMonth = offset === 0;

  const goToPrevMonth = useCallback(() => setOffset((o) => o - 1), []);
  const goToNextMonth = useCallback(() => setOffset((o) => o + 1), []);
  const setFilters = useCallback((f: IPFilters) => setFiltersState(f), []);

  // ── Plan fetch ────────────────────────────────────────────────────────────
  const {
    data: planData,
    isLoading: planLoading,
    error: planError,
  } = useApi({
    queryKey: ["monthly-plan", currentMonth],
    queryFn: () => MonthlyPlanService.getCurrentPlan(currentMonth),
  });

  const ipGoals = useMemo<MonthlyIPGoal[]>(() => planData?.ipGoals ?? [], [planData]);
  const planId: string | null = planData?.id ?? null;
  const planStatus: string | null = planData?.status ?? null;

  // ── Report fetch ──────────────────────────────────────────────────────────
  const {
    data: reportData,
    isLoading: reportLoading,
    error: reportError,
  } = useApi({
    queryKey: ["monthly-report", currentMonth],
    queryFn: () => MonthlyReportService.getMonthlyReport(currentMonth),
  });

  const ipSummary: IPSummary | null = reportData?.axisSummaries?.ip ?? null;
  const weeklySummaries: WeeklySummaryCard[] = reportData?.weeklySummaries ?? [];

  // ── History: past 3 months of plans + reports ─────────────────────────────
  const pastMonths = useMemo(() => getPastMonths(currentMonth, 3), [currentMonth]);

  const { data: historyPlans } = useApi({
    queryKey: ["ip-history-plans", ...pastMonths],
    queryFn: async () => {
      const results = await Promise.all(
        pastMonths.map(async (m) => {
          const r = await MonthlyPlanService.getCurrentPlan(m);
          if (!r || "error" in r) return { month: m, plan: null };
          return { month: m, plan: r };
        })
      );
      return results;
    },
  });

  const { data: historyReports } = useApi({
    queryKey: ["ip-history-reports", ...pastMonths],
    queryFn: async () => {
      const results = await Promise.all(
        pastMonths.map(async (m) => {
          const r = await MonthlyReportService.getMonthlyReport(m);
          if (!r || "error" in r) return { month: m, report: null };
          return { month: m, report: r };
        })
      );
      return results;
    },
  });

  const goalHistory = useMemo(() => {
    const map = new Map<string, IPGoalHistory[]>();
    if (!historyPlans || !historyReports) return map;

    for (const goal of ipGoals) {
      const entries: IPGoalHistory[] = [];
      for (const pm of historyPlans) {
        if (!pm.plan) continue;
        const pastGoal = pm.plan.ipGoals?.find((g) => g.title === goal.title);
        if (!pastGoal) continue;

        const pastReport = historyReports.find((r) => r.month === pm.month);
        const pastActual =
          pastReport?.report?.axisSummaries?.ip?.items?.find(
            (i) => i.title === goal.title
          )?.commits ?? 0;

        entries.push({
          month: pm.month,
          monthLabel: shortMonthLabel(pm.month),
          target: pastGoal.targetCommits,
          actual: pastActual,
        });
      }
      entries.sort((a, b) => a.month.localeCompare(b.month));
      if (entries.length > 0) map.set(goal.title, entries);
    }
    return map;
  }, [ipGoals, historyPlans, historyReports]);

  // ── Add IP goal ───────────────────────────────────────────────────────────
  const addMutation = useApiMutation({
    mutationFn: ({
      id,
      goals,
    }: {
      id: string;
      goals: MonthlyIPGoal[];
    }) => MonthlyPlanService.updatePlan(id, { ipGoals: goals }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-plan", currentMonth] });
      toast.success("IP goal added to monthly plan.");
    },
    onError: () => toast.error("Failed to add IP goal."),
  });

  const addIPGoal = useCallback(
    async (goal: Omit<MonthlyIPGoal, "id">) => {
      if (!planId) {
        toast.error("No active plan for this month.");
        return;
      }
      const newGoal: MonthlyIPGoal = { ...goal, id: generateId() };
      try {
        await addMutation.mutateAsync({ id: planId, goals: [...ipGoals, newGoal] });
      } catch {
        /* onError handles display */
      }
    },
    [planId, ipGoals, addMutation]
  );

  // ── Client-side zone filter ───────────────────────────────────────────────
  const filteredGoals = useMemo(
    () =>
      filters.zone ? ipGoals.filter((g) => g.zone === filters.zone) : ipGoals,
    [ipGoals, filters.zone]
  );

  return {
    currentMonth,
    monthLabel,
    goToPrevMonth,
    goToNextMonth,
    isCurrentMonth,

    ipGoals,
    filteredGoals,
    ipSummary,
    weeklySummaries,
    planStatus,
    planId,
    goalHistory,

    filters,
    setFilters,

    addIPGoal,
    isAdding: addMutation.isPending,

    isLoading: planLoading || reportLoading,
    error: planError?.message ?? reportError?.message ?? null,
  };
}
