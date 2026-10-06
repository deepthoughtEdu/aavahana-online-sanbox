"use client";

import { Badge } from "@/components/shared/Badge";
import { useFellowQuota } from "@/lib/hooks/hcd/use-fellow-quota";

// Format the Monday-anchored week start as "Week of 7 Jul".
function weekLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "this week";
  return `Week of ${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
}

function QuotaLine({
  label,
  hint,
  count,
  target,
  met,
}: {
  label: string;
  hint: string;
  count: number;
  target: number;
  met: boolean;
}) {
  const pct = target > 0 ? Math.min(100, (count / target) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <span className="text-sm font-medium text-black">{label}</span>
          <span className="text-xs dt-text-dim ml-2">{hint}</span>
        </div>
        <span className={`text-sm font-semibold tabular-nums ${met ? "text-success" : "text-black"}`}>
          {count} / {target}
        </span>
      </div>
      <progress
        className={`progress w-full ${met ? "progress-success" : "progress-primary"}`}
        value={pct}
        max={100}
      />
    </div>
  );
}

// Fellow's own weekly lifecycle quota (W3.4). Placed on the HCD Innovate surface
// so the Fellow sees their state any time mid-week, not only at week end.
export function FellowQuotaPanel() {
  const { data, isLoading, isError } = useFellowQuota();

  if (isLoading) {
    return (
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body p-4 flex-row items-center gap-3">
          <span className="loading loading-spinner loading-sm" />
          <span className="text-sm dt-text-dim">Loading your quota…</span>
        </div>
      </div>
    );
  }

  if (isError || !data) return null;

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body p-4 gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-black">Your weekly quota</h4>
            <p className="text-xs dt-text-dim">{weekLabel(data.weekStart)}</p>
          </div>
          {data.quotaMet ? (
            <Badge variant="success" size="sm">Quota met</Badge>
          ) : (
            <Badge variant="neutral" icon={null} size="sm">In progress</Badge>
          )}
        </div>

        <div className="space-y-4">
          <QuotaLine
            label="New improvements spotted"
            hint="file at least one"
            count={data.newSpotted}
            target={data.minSpotted}
            met={data.spottedMet}
          />
          <QuotaLine
            label="Stage movements"
            hint="advance at least one"
            count={data.movements}
            target={data.minMovements}
            met={data.movementsMet}
          />
        </div>

        {!data.quotaMet && (
          <p className="text-xs dt-text-dim">
            Spot a new improvement or advance one you already have to complete this week.
          </p>
        )}
      </div>
    </div>
  );
}
