import React from "react";
import { Modal } from "@/components/shared/Modal";
import { Button, ButtonColor } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { useUpdateInsightStatus } from "@/lib/hooks/intelligence/use-intelligence";
import {
  severityVariant,
  severityLabel,
  statusLabel,
  statusVariant,
  categoryLabel,
  statusTransitions,
} from "./severity";
import type { HcdInsight, InsightStatus } from "@/types/intelligence/intelligence.types";

const TRANSITION_COLOR: Record<InsightStatus, ButtonColor> = {
  open: "primary",
  acknowledged: "info",
  in_progress: "primary",
  resolved: "success",
  dismissed: "neutral",
  superseded: "neutral",
};

interface ConstraintDetailModalProps {
  insight: HcdInsight | null;
  isOpen: boolean;
  onClose: () => void;
  readOnly?: boolean;
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-neutral">{label}</span>
      <span className="text-sm text-black">{value}</span>
    </div>
  );
}

export const ConstraintDetailModal: React.FC<ConstraintDetailModalProps> = ({
  insight,
  isOpen,
  onClose,
  readOnly = false,
}) => {
  const mutation = useUpdateInsightStatus();
  if (!insight) return null;

  const transitions = statusTransitions[insight.status] ?? [];

  const changeStatus = (status: InsightStatus) => {
    mutation.mutate({ id: insight.id, status }, { onSuccess: onClose });
  };

  const footer = !readOnly && transitions.length > 0 ? (
    <div className="flex flex-wrap justify-end gap-2">
      {transitions.map((s) => (
        <Button
          key={s}
          color={TRANSITION_COLOR[s]}
          size="sm"
          loading={mutation.isPending}
          onClick={() => changeStatus(s)}
        >
          {s === "resolved" ? "Mark resolved" : s === "dismissed" ? "Dismiss" : statusLabel[s]}
        </Button>
      ))}
    </div>
  ) : undefined;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={insight.title} footer={footer} size="md">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={severityVariant[insight.severity]} label={severityLabel[insight.severity]} size="sm" />
          <Badge variant="neutral" label={categoryLabel[insight.category] ?? insight.category} size="sm" icon={null} />
          <Badge variant={statusVariant[insight.status]} label={statusLabel[insight.status]} size="sm" icon={null} />
        </div>

        <p className="text-sm text-black leading-relaxed">{insight.description}</p>

        {insight.suggestedImprovement && (
          <div className="bg-[var(--dt-surfaceAlt)] border border-base-300 rounded-[9px] p-4">
            <span className="text-xs uppercase tracking-wide text-neutral">Suggested improvement</span>
            <p className="text-sm text-black mt-1 leading-relaxed">{insight.suggestedImprovement}</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Meta label="Source" value={insight.source} />
          <Meta label="Occurrences" value={`${insight.occurrenceCount}×`} />
          <Meta label="Period" value={insight.periodKey} />
          <Meta label="First seen" value={new Date(insight.firstSeenAt).toLocaleDateString()} />
          <Meta label="Last seen" value={new Date(insight.lastSeenAt).toLocaleDateString()} />
          <Meta
            label="Detection"
            value={
              insight.detectionMethod +
              (insight.confidenceScore != null ? ` (${Math.round(insight.confidenceScore * 100)}%)` : "")
            }
          />
        </div>
      </div>
    </Modal>
  );
};
