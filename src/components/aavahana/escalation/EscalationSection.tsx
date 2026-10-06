"use client";

import { useMemo } from "react";
import { DataTable, type DataTableColumn } from "@/components/shared/ui/DataTable";
import { Badge } from "@/components/shared/Badge";
import { useAuth } from "@/lib/hooks/shared/use-auth";
import {
  EscalationService,
  type EscalationMatrixEntry,
} from "@/lib/services/aavahana/escalation.service";
import { isError } from "@/lib/api/client";
import type { ColorVariant } from "@/utils/shared/design.utils";

// The escalation surface, rendered inside both the communication window (W2.5)
// and the supervisor usage grid (W2.4). One row per subject.
//
// The read is supervisor/admin-only at the API. It returns other people's escalation
// history — eids, levels, and the recipient addresses each digest was sent to — so a
// member gets nothing back and this renders nothing, which is the intended behaviour on
// a person-facing page. The per-digest recipient EMAIL list the old card rendered is
// deliberately not carried over: it was the exposure, and it is noise in a roster view.

const SOURCE_LABEL: Record<string, string> = {
  daily_report: "Daily reports",
  attendance_weekly: "Weekly attendance",
  weekly_distribution: "Weekly distribution",
  org_aggregate: "Org aggregate",
  lnd_sessions: "L&D sessions",
  fellow_quotas: "Fellow quota",
};

function sourceLabel(source: string): string {
  return SOURCE_LABEL[source] ?? source.replace(/_/g, " ");
}

function levelVariant(level: number): ColorVariant {
  if (level >= 2) return "error";
  if (level === 1) return "warning";
  return "info";
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

// The fixed PDGMS ladder the engine climbs: reminder to the person → direct
// supervisor → top of the org tree. Reached tiers derive from the current level.
const TIERS = ["Employee reminded", "Supervisor notified", "Org head notified"];

export function EscalationSection({
  subjectEids,
  names,
  title = "Escalations",
}: {
  // Restrict to these subjects (e.g. a supervisor's reportees). Omit for org-wide.
  subjectEids?: number[];
  names?: Record<number, string>;
  title?: string;
}) {
  const { selectedOrg } = useAuth();
  const orgId = selectedOrg?.orgId ?? null;

  const columns = useMemo<DataTableColumn<EscalationMatrixEntry>[]>(
    () => [
      {
        title: "Person",
        key: "subject",
        render: (_: unknown, e: EscalationMatrixEntry) => (
          <span className="font-medium text-black">
            {names?.[e.subjectEid] ?? `Employee ${e.subjectEid}`}
          </span>
        ),
      },
      {
        title: "Source",
        key: "source",
        render: (_: unknown, e: EscalationMatrixEntry) => sourceLabel(e.source),
      },
      {
        title: "Level",
        key: "level",
        render: (_: unknown, e: EscalationMatrixEntry) => (
          <Badge variant={levelVariant(e.currentLevel)} icon={null} size="sm">
            Level {e.currentLevel}
          </Badge>
        ),
      },
      {
        title: "Path",
        key: "path",
        render: (_: unknown, e: EscalationMatrixEntry) => (
          <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
            {TIERS.map((label, i) => {
              const reached = e.currentLevel >= i;
              return (
                <span key={label} className="flex items-center gap-1">
                  <span className={reached ? "text-success" : "text-neutral"}>
                    {reached ? "●" : "○"}
                  </span>
                  <span className={reached ? "text-black" : "text-neutral"}>{label}</span>
                  {i < TIERS.length - 1 && <span className="text-neutral">→</span>}
                </span>
              );
            })}
          </span>
        ),
      },
      {
        title: "Digests",
        key: "digests",
        render: (_: unknown, e: EscalationMatrixEntry) => {
          const sent = e.history.filter((h) => h.status === "sent");
          const last = sent[0]?.sentAt ?? null;
          if (!sent.length) return <span className="dt-text-dim">No digest sent yet</span>;
          return (
            <span className="dt-text-dim">
              {sent.length} sent · last {fmtDate(last)}
            </span>
          );
        },
      },
    ],
    [names],
  );

  if (!orgId) return null;

  return (
    <DataTable<EscalationMatrixEntry>
      title={title}
      subtitle="Who the engine has escalated on, and how far it has climbed"
      columns={columns}
      autoHeight
      enableSearch={false}
      enableRefresh={false}
      emptyState={{
        title: "No active escalations",
        subtitle: "Nobody is currently escalated.",
      }}
      queryFn={async () => {
        const res = await EscalationService.getMatrix();
        // Not authorised, or the read failed: show the empty state rather than an
        // error banner on a person-facing surface.
        if (isError(res)) return [];
        const allow = subjectEids ? new Set(subjectEids) : null;
        return (res ?? []).filter((e) => !allow || allow.has(e.subjectEid));
      }}
    />
  );
}

export type { EscalationMatrixEntry };
