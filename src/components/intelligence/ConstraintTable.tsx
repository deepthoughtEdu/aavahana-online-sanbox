import React from "react";
import { Badge } from "@/components/shared/Badge";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  severityVariant,
  severityLabel,
  statusVariant,
  statusLabel,
  categoryLabel,
} from "./severity";
import { ignoreTextSelection } from "@/utils/shared/selection.utils";
import type { HcdInsight } from "@/types/intelligence/intelligence.types";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

interface ConstraintTableProps {
  insights: HcdInsight[];
  onSelect: (insight: HcdInsight) => void;
  showEmployee?: boolean;
}

/** Read-only list of detected constraints; row click opens the detail modal. */
export const ConstraintTable: React.FC<ConstraintTableProps> = ({ insights, onSelect, showEmployee = true }) => {
  if (!insights.length) {
    return <EmptyState title="No constraints" subtitle="No detected constraints for this filter." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr className="text-neutral">
            <th>Severity</th>
            <th>Constraint</th>
            {showEmployee && <th>Employee</th>}
            <th>Seen</th>
            <th>Last seen</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {insights.map((i) => (
            <tr
              key={i.id}
              className="cursor-pointer hover"
              onClick={ignoreTextSelection(() => onSelect(i))}
            >
              <td>
                <Badge variant={severityVariant[i.severity]} label={severityLabel[i.severity]} size="sm" />
              </td>
              <td>
                <div className="font-medium text-black">{i.title}</div>
                <div className="text-xs text-neutral">{categoryLabel[i.category] ?? i.category}</div>
              </td>
              {showEmployee && <td className="text-neutral">{i.eid ?? "—"}</td>}
              <td className="text-neutral">{i.occurrenceCount}×</td>
              <td className="text-neutral">{fmtDate(i.lastSeenAt)}</td>
              <td>
                <Badge variant={statusVariant[i.status]} label={statusLabel[i.status]} size="sm" icon={null} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
