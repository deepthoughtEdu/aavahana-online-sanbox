"use client";

import { cn } from "@/utils";
import { Badge } from "@/components/shared/Badge";
import type { KPIWithActuals } from "@/lib/hooks/aavahana/use-kpis";

const STATUS_PROGRESS: Record<string, string> = {
  hit: "progress-success",
  partial: "progress-warning",
  miss: "progress-error",
  pending: "progress-info",
};

const STATUS_BADGE: Record<string, "success" | "warning" | "error" | "neutral"> = {
  hit: "success",
  partial: "warning",
  miss: "error",
  pending: "neutral",
};

function parseNumeric(val: string | undefined): number | null {
  if (!val) return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

interface KPICardProps {
  kpi: KPIWithActuals;
}

export function KPICard({ kpi }: KPICardProps) {
  const target = parseNumeric(kpi.targetValue);
  const actual = parseNumeric(kpi.currentActual?.actualValue ?? undefined);
  const status = kpi.currentActual?.status ?? "pending";

  const pct =
    target !== null && target > 0 && actual !== null
      ? Math.min(100, Math.round((actual / target) * 100))
      : 0;

  const progressClass = STATUS_PROGRESS[status] ?? "progress-info";
  const badgeVariant = STATUS_BADGE[status] ?? "neutral";

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body py-4">
        {/* Header */}
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">{kpi.kpiName}</h3>
            <p className="text-xs opacity-50">
              Unit: {kpi.unit || "—"}
              {kpi.memberCount != null && (
                <>
                  {" · "}
                  {kpi.memberCount} member{kpi.memberCount !== 1 ? "s" : ""}
                </>
              )}
            </p>
          </div>
          <Badge
            variant={badgeVariant}
            size="sm"
            icon={null}
            label={status}
            className="shrink-0"
          />
        </div>

        {/* Current month */}
        <div className="mb-2">
          <p className="text-xs opacity-60 mb-1">
            {actual !== null ? actual : "—"}/{target !== null ? target : "—"} {kpi.unit} ({pct}%)
          </p>
          <progress
            className={cn("progress w-full", progressClass)}
            value={pct}
            max={100}
          />
        </div>

        {/* Monthly history strip */}
        {kpi.history.length > 0 && (
          <div>
            <p className="text-xs opacity-40 uppercase tracking-wide mb-1">History</p>
            <div className="flex flex-wrap gap-2">
              {kpi.history.map(({ month, commit }) => {
                const hStatus = commit?.status ?? "pending";
                const icon = hStatus === "hit" ? "✓" : hStatus === "miss" ? "✕" : "·";
                return (
                  <span
                    key={month}
                    className={cn(
                      "text-xs",
                      hStatus === "hit" && "text-success",
                      hStatus === "miss" && "text-error",
                      hStatus === "partial" && "text-warning",
                      hStatus === "pending" && "opacity-40"
                    )}
                    title={`${month}: ${commit?.actualValue ?? "—"}/${commit?.targetValue ?? kpi.targetValue} (${hStatus})`}
                  >
                    {month.slice(5)} {icon}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
