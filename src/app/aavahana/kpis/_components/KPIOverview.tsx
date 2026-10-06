"use client";

import { Button } from "@/components/shared/Button";
import type { UseKPIsReturn } from "@/lib/hooks/aavahana/use-kpis";

interface KPIOverviewProps {
  programName: string;
  monthLabel: string;
  kpiCount: number;
  statusBreakdown: UseKPIsReturn["statusBreakdown"];
  memberCount: number;
  onPrev: () => void;
  onNext: () => void;
}

export function KPIOverview({
  programName,
  monthLabel,
  kpiCount,
  statusBreakdown,
  memberCount,
  onPrev,
  onNext,
}: KPIOverviewProps) {
  const parts: string[] = [];
  if (statusBreakdown.hit > 0) parts.push(`${statusBreakdown.hit} hit`);
  if (statusBreakdown.partial > 0) parts.push(`${statusBreakdown.partial} partial`);
  if (statusBreakdown.miss > 0) parts.push(`${statusBreakdown.miss} miss`);
  if (statusBreakdown.pending > 0) parts.push(`${statusBreakdown.pending} pending`);

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body py-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-base">KPIs — {programName}</h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="xs" onClick={onPrev}>‹</Button>
            <span className="text-sm font-medium px-1">{monthLabel}</span>
            <Button variant="ghost" size="xs" onClick={onNext}>›</Button>
          </div>
        </div>
        <p className="text-xs opacity-60">
          {kpiCount} KPI{kpiCount !== 1 ? "s" : ""}{parts.length > 0 ? ` · ${parts.join(" · ")}` : ""}
        </p>
        {memberCount > 0 && (
          <p className="text-xs opacity-50">
            {memberCount} member{memberCount !== 1 ? "s" : ""} share these KPIs
          </p>
        )}
      </div>
    </div>
  );
}
