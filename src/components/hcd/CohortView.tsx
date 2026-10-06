"use client";

import { Section } from "@/components/shared/Section";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/shared/Badge";
import { useCohort } from "@/lib/hooks/hcd/use-recognition";
import { STAGE_ORDER, STAGE_BADGE, type IoStage } from "@/components/hcd/lifecycle";

type StageTotals = Record<IoStage, number>;

export function CohortView() {
  const { data: rows, isLoading, error } = useCohort(true);

  const emptyStageTotals = () =>
    STAGE_ORDER.reduce((acc, s) => ({ ...acc, [s]: 0 }), {} as StageTotals);

  const totals = (rows ?? []).reduce(
    (a, r) => {
      const stages = { ...a.stages };
      for (const s of STAGE_ORDER) stages[s] += r[s];
      return {
        assessed: a.assessed + (r.assessments > 0 ? 1 : 0),
        drillsDone: a.drillsDone + r.drillsDone,
        drillsPrescribed: a.drillsPrescribed + r.drillsPrescribed,
        stages,
        submitted: a.submitted + r.submitted,
        verified: a.verified + r.verified,
        chats: a.chats + r.chats,
      };
    },
    {
      assessed: 0,
      drillsDone: 0,
      drillsPrescribed: 0,
      stages: emptyStageTotals(),
      submitted: 0,
      verified: 0,
      chats: 0,
    }
  );

  return (
    <Section>
      <Section.Header
        title="Cohort progress"
        subtitle="Read-only overview of everyone's HCD progress. Managers and admins only."
      />
      <Section.Body noPadding>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-sm" />
          </div>
        ) : error ? (
          <EmptyState
            size="sm"
            variant="error"
            title="Couldn't load cohort"
            subtitle="You may not have access, or there's no data yet."
          />
        ) : !rows?.length ? (
          <EmptyState
            size="sm"
            title="No activity yet"
            subtitle="Once people use the module, their progress shows here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Person</th>
                  <th className="text-center">Assessed</th>
                  <th className="text-center">Drills (done / given)</th>
                  {STAGE_ORDER.map((s) => (
                    <th key={s} className="text-center">
                      <Badge size="sm" variant={STAGE_BADGE[s].variant} label={STAGE_BADGE[s].label} />
                    </th>
                  ))}
                  <th className="text-center">Submitted</th>
                  <th className="text-center">Verified</th>
                  <th className="text-center">BYOK</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.uid}>
                    <td className="font-medium text-black">{r.name}</td>
                    <td className="text-center">{r.assessments > 0 ? "✓" : "—"}</td>
                    <td className="text-center">{r.drillsDone} / {r.drillsPrescribed}</td>
                    {STAGE_ORDER.map((s) => (
                      <td key={s} className="text-center">{r[s]}</td>
                    ))}
                    <td className="text-center">{r.submitted}</td>
                    <td className="text-center">{r.verified}</td>
                    <td className="text-center">{r.chats}</td>
                  </tr>
                ))}
                <tr className="font-semibold border-t-2 border-base-300">
                  <td className="text-black">Total ({rows.length})</td>
                  <td className="text-center">{totals.assessed}</td>
                  <td className="text-center">{totals.drillsDone} / {totals.drillsPrescribed}</td>
                  {STAGE_ORDER.map((s) => (
                    <td key={s} className="text-center">{totals.stages[s]}</td>
                  ))}
                  <td className="text-center">{totals.submitted}</td>
                  <td className="text-center">{totals.verified}</td>
                  <td className="text-center">{totals.chats}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Section.Body>
    </Section>
  );
}
