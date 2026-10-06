"use client";

import { Badge } from "@/components/shared/Badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { useFellowQuotaRollup } from "@/lib/hooks/hcd/use-fellow-quota";

// DT-management adherence rollup (W3.4) — one row per active Fellow, unmet first.
export function FellowQuotaRollup({ weekStart }: { weekStart?: string }) {
  const { data, isLoading } = useFellowQuotaRollup(weekStart);

  if (isLoading) {
    return <div className="py-8 text-center text-sm text-neutral">Loading fellow quotas…</div>;
  }

  if (!data?.fellows.length) {
    return (
      <EmptyState
        size="sm"
        title="No fellow activity yet"
        subtitle="Once fellows log improvements this week, their quota adherence shows here."
      />
    );
  }

  const met = data.fellows.filter((f) => f.quotaMet).length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral">
        <span className="font-semibold text-black tabular-nums">{met}</span> of{" "}
        <span className="font-semibold text-black tabular-nums">{data.fellows.length}</span> fellows
        met this week&apos;s quota.
      </p>
      <div className="overflow-x-auto">
        <table className="table table-sm w-full">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-neutral">
              <th>Fellow</th>
              <th className="text-center">Spotted</th>
              <th className="text-center">Movements</th>
              <th className="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.fellows.map((f) => (
              <tr key={f.uid}>
                <td className="font-medium text-black">{f.name}</td>
                <td className="text-center tabular-nums">{f.newSpotted}</td>
                <td className="text-center tabular-nums">{f.movements}</td>
                <td className="text-center">
                  {f.quotaMet ? (
                    <Badge variant="success" size="sm">Met</Badge>
                  ) : (
                    <Badge variant="warning" size="sm">Unmet</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
