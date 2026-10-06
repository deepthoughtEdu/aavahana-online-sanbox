"use client";

import { ChevronRight } from "lucide-react";
import { Section } from "@/components/shared/Section";
import { EmptyState } from "@/components/shared/EmptyState";
import { useCohort } from "@/lib/hooks/hcd/use-recognition";
import type { CohortRow } from "@/lib/services/hcd/recognition.service";
import { STAGE_ORDER } from "@/components/hcd/lifecycle";

interface ModuleMetricRow {
  uid: number;
  name: string;
  assessmentsStarted: number;
  assessmentsCompleted: number;
  insightsGenerated: number;
  drillsPrescribed: number;
  drillsLogged: number;
  initiativesCreated: number;
  initiativesRecognised: number;
}

interface ModuleMetrics {
  totals: Omit<ModuleMetricRow, "uid" | "name">;
  rows: ModuleMetricRow[];
  activeUsers: number;
}

type MetricKey = keyof ModuleMetrics["totals"];

const EMPTY_TOTALS: ModuleMetrics["totals"] = {
  assessmentsStarted: 0,
  assessmentsCompleted: 0,
  insightsGenerated: 0,
  drillsPrescribed: 0,
  drillsLogged: 0,
  initiativesCreated: 0,
  initiativesRecognised: 0,
};

const METRIC_KEYS = Object.keys(EMPTY_TOTALS) as MetricKey[];

// The seven module metrics are a projection of the cohort read model, so this
// tab and the Cohort tab can never disagree about the same person.
function toMetrics(cohort: CohortRow[]): ModuleMetrics {
  const rows = cohort.map((r) => ({
    uid: r.uid,
    name: r.name,
    assessmentsStarted: r.assessmentsStarted,
    assessmentsCompleted: r.assessments,
    insightsGenerated: r.insightsGenerated,
    drillsPrescribed: r.drillsPrescribed,
    drillsLogged: r.drillsDone,
    initiativesCreated: STAGE_ORDER.reduce((sum, s) => sum + r[s], 0) + r.dropped,
    initiativesRecognised: r.verified,
  }));
  const totals = { ...EMPTY_TOTALS };
  for (const r of rows) for (const k of METRIC_KEYS) totals[k] += r[k];
  const activeUsers = rows.filter((r) => METRIC_KEYS.some((k) => r[k] > 0)).length;
  return { totals, rows, activeUsers };
}

const FUNNEL_STEPS: Array<{ key: MetricKey; label: string }> = [
  { key: "assessmentsStarted", label: "Assessments started" },
  { key: "assessmentsCompleted", label: "Assessments completed" },
  { key: "insightsGenerated", label: "Insights generated" },
  { key: "drillsPrescribed", label: "Drills prescribed" },
  { key: "drillsLogged", label: "Drills logged" },
  { key: "initiativesCreated", label: "Initiatives created" },
  { key: "initiativesRecognised", label: "Initiatives recognised" },
];

const TABLE_COLUMNS: Array<{ key: MetricKey; label: string }> = [
  { key: "assessmentsStarted", label: "Started" },
  { key: "assessmentsCompleted", label: "Completed" },
  { key: "insightsGenerated", label: "Insights" },
  { key: "drillsPrescribed", label: "Prescribed" },
  { key: "drillsLogged", label: "Logged" },
  { key: "initiativesCreated", label: "Created" },
  { key: "initiativesRecognised", label: "Recognised" },
];

function ModuleFunnel({ totals }: { totals: ModuleMetrics["totals"] }) {
  return (
    <div className="flex flex-wrap items-center gap-y-4">
      {FUNNEL_STEPS.map((step, i) => (
        <div key={step.key} className="flex items-center">
          <div className="text-center px-3">
            <div className="text-2xl font-bold tabular-nums leading-none">
              {totals[step.key]}
            </div>
            <div className="text-[0.65rem] dt-text-dim uppercase tracking-wide mt-1.5 max-w-26 mx-auto">
              {step.label}
            </div>
          </div>
          {i < FUNNEL_STEPS.length - 1 && (
            <ChevronRight className="w-4 h-4 dt-text-dim shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

function MetricsTable({
  rows,
  totals,
  activeUsers,
}: {
  rows: ModuleMetricRow[];
  totals: ModuleMetrics["totals"];
  activeUsers: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="table table-sm">
        <thead>
          <tr>
            <th>Person</th>
            {TABLE_COLUMNS.map((c) => (
              <th key={c.key} className="text-center">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.uid}>
              <td className="font-medium text-black">{r.name}</td>
              {TABLE_COLUMNS.map((c) => (
                <td key={c.key} className="text-center">
                  {r[c.key]}
                </td>
              ))}
            </tr>
          ))}
          <tr className="font-semibold border-t-2 border-base-300">
            <td className="text-black">
              Total ({rows.length} people, {activeUsers} active)
            </td>
            {TABLE_COLUMNS.map((c) => (
              <td key={c.key} className="text-center">
                {totals[c.key]}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function MetricsView() {
  const { data: cohort, isLoading, error } = useCohort(true);
  const data = cohort ? toMetrics(cohort) : null;

  return (
    <Section>
      <Section.Header
        title="Module metrics"
        subtitle="Everyone in the organisation who has used HCD. Started counts every assessment opened; drills prescribed includes drills already logged."
      />
      <Section.Body>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-sm" />
          </div>
        ) : error ? (
          <EmptyState
            size="sm"
            variant="error"
            title="Couldn't load module metrics"
            subtitle="You may not have access, or there's no data yet."
          />
        ) : !data?.rows.length ? (
          <EmptyState
            size="sm"
            title="No activity yet"
            subtitle="Once people use the module, metrics fill in here."
          />
        ) : (
          <div className="space-y-6">
            <ModuleFunnel totals={data.totals} />
            <MetricsTable rows={data.rows} totals={data.totals} activeUsers={data.activeUsers} />
          </div>
        )}
      </Section.Body>
    </Section>
  );
}
