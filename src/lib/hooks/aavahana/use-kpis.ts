"use client";

import { useState, useMemo, useCallback } from "react";
import { useQueries } from "@tanstack/react-query";
import { MonthlyPlanService } from "@/lib/services/aavahana/monthly-plan.service";
import { MonthlyReportService } from "@/lib/services/aavahana/monthly-report.service";
import { useApi } from "@/lib/hooks/shared/use-api";
import type { ProgramKPI } from "@/types/aavahana/monthly-plan.types";
import type { MonthlyKPICommit } from "@/types";
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

function getPastMonths(currentMonth: string, count: number): string[] {
  const [y, m] = currentMonth.split("-").map(Number);
  const months: string[] = [];
  for (let i = count; i >= 1; i--) {
    let mo = m - i;
    let yr = y;
    while (mo <= 0) {
      mo += 12;
      yr -= 1;
    }
    months.push(`${yr}-${String(mo).padStart(2, "0")}`);
  }
  return months;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface KPIWithActuals extends ProgramKPI {
  currentActual: MonthlyKPICommit | null;
  history: Array<{ month: string; commit: MonthlyKPICommit | null }>;
}

export interface UseKPIsReturn {
  currentMonth: string;
  monthLabel: string;
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  isCurrentMonth: boolean;

  kpis: KPIWithActuals[];
  statusBreakdown: { hit: number; miss: number; partial: number; pending: number };

  isLoading: boolean;
  error: string | null;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useKPIs(programId: string): UseKPIsReturn {
  const [offset, setOffset] = useState(0);

  const currentMonth = useMemo(() => offsetToMonth(offset), [offset]);
  const monthLabel = useMemo(() => toMonthLabel(currentMonth), [currentMonth]);
  const isCurrentMonth = offset === 0;

  const goToPrevMonth = useCallback(() => setOffset((o) => o - 1), []);
  const goToNextMonth = useCallback(() => setOffset((o) => o + 1), []);

  // ── KPI definitions from program config ───────────────────────────────────
  const {
    data: programKPIs,
    isLoading: kpiDefsLoading,
    error: kpiDefsError,
  } = useApi({
    queryKey: ["program-kpis", programId],
    queryFn: () => MonthlyPlanService.getProgramKPIs(programId),
    enabled: !!programId,
  });

  // ── Current month actuals from monthly report ─────────────────────────────
  const {
    data: kpiCommits,
    isLoading: commitsLoading,
    error: commitsError,
  } = useApi({
    queryKey: ["kpi-commits", currentMonth],
    queryFn: () => MonthlyReportService.getKPICommits(currentMonth),
    enabled: !!programId,
  });

  // ── Historical months (5 months, parallel) ────────────────────────────────
  const historyMonths = useMemo(() => getPastMonths(currentMonth, 5), [currentMonth]);

  const historyResults = useQueries({
    queries: historyMonths.map((m) => ({
      queryKey: ["kpi-commits", m],
      queryFn: async (): Promise<MonthlyKPICommit[]> => {
        const result = await MonthlyReportService.getKPICommits(m);
        if (result && typeof result === "object" && "error" in result) {
          throw (result as { error: Error }).error;
        }
        return result as MonthlyKPICommit[];
      },
      enabled: !!programId,
    })),
  });

  const historyLoading = historyResults.some((r) => r.isLoading);

  // ── Join definitions with actuals ─────────────────────────────────────────
  const kpis: KPIWithActuals[] = useMemo(() => {
    if (!programKPIs) return [];
    return programKPIs.map((kpi) => {
      const currentActual =
        (kpiCommits as MonthlyKPICommit[] | undefined)?.find(
          (c) => c.kpiId === kpi.kpiId
        ) ?? null;
      const history = historyMonths.map((m, i) => ({
        month: m,
        commit:
          (historyResults[i]?.data as MonthlyKPICommit[] | undefined)?.find(
            (c) => c.kpiId === kpi.kpiId
          ) ?? null,
      }));
      return { ...kpi, currentActual, history };
    });
  }, [programKPIs, kpiCommits, historyMonths, historyResults]);

  // ── Status breakdown ──────────────────────────────────────────────────────
  const statusBreakdown = useMemo(() => {
    const b = { hit: 0, miss: 0, partial: 0, pending: 0 };
    kpis.forEach((kpi) => {
      const s = kpi.currentActual?.status;
      if (s === "hit" || s === "miss" || s === "partial") b[s]++;
      else b.pending++;
    });
    return b;
  }, [kpis]);

  return {
    currentMonth,
    monthLabel,
    goToPrevMonth,
    goToNextMonth,
    isCurrentMonth,
    kpis,
    statusBreakdown,
    isLoading: kpiDefsLoading || commitsLoading || historyLoading,
    error: kpiDefsError?.message ?? commitsError?.message ?? null,
  };
}
