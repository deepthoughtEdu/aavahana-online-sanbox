/**
 * ScoringOverview — multi-member scoring table.
 *
 * Used by L2 (dept-level, L2_TO_L1 direction) and L3 (program-level, L3_TO_L1 direction).
 * Replaces the Mimamsaka-specific FeedbackScoringTable.
 */
"use client";

import React from "react";
import { cn } from "@/utils";
import { useFeedbackOverview } from "@/lib/hooks/shared/use-feedback-overview";
import { OverlayLoading } from "@/components/shared/OverlayLoading";
import { EmptyState } from "@/components/shared/EmptyState";
import type { FeedbackDirectionKey, MemberScoringStatus } from "@/types/shared/feedback.types";

interface ScoringOverviewProps {
  directionKey: FeedbackDirectionKey;
  /** deptId for L2_TO_L1, programId for L3_TO_L1 */
  scopeId: string;
  onMemberClick?(memberId: string): void;
  className?: string;
}

function TrendBars({ trend }: { trend: MemberScoringStatus["trend"] }) {
  const last3 = (trend ?? []).slice(-3);
  if (last3.length === 0) return <span className="text-xs text-[var(--dt-textDim)]">—</span>;
  return (
    <div className="flex items-end gap-1 h-7">
      {last3.map((t, i) => {
        const h = Math.max(4, Math.round(((t.composite ?? 0) / 10) * 28));
        return (
          <div
            key={t.period ?? i}
            title={`${t.period}: ${t.composite}`}
            className="w-4 rounded-sm bg-primary/60"
            style={{ height: h, opacity: 0.8 }}
          />
        );
      })}
    </div>
  );
}

export function ScoringOverview({ directionKey, scopeId, onMemberClick, className }: ScoringOverviewProps) {
  const { data: members, isLoading, error } = useFeedbackOverview(directionKey, scopeId);

  if (isLoading) {
    return (
      <div className="relative min-h-[200px] flex items-center justify-center">
        <OverlayLoading title="Loading overview…" size="sm" />
      </div>
    );
  }

  if (error || !members) {
    return <EmptyState variant="error" title="Failed to load" subtitle={error?.message} />;
  }

  if (!Array.isArray(members) || members.length === 0) {
    return <EmptyState title="No members" subtitle="No scoring data available." />;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Title + subtitle */}
      <div>
        <h3 className="text-base font-semibold text-black">Team Growth Map</h3>
        <p className="text-xs text-[var(--dt-textDim)] mt-0.5">
          This shows where each person is strong and where they could stretch. Use it to decide where your coaching time will have the most impact — not to rank.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-base-300 overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[2fr_2fr_1fr_2fr_1fr] px-4 py-2.5 bg-base-200 border-b border-base-300 text-xs font-semibold dt-text-muted uppercase tracking-wider">
          <span>Member</span>
          <span className="hidden md:block">Supervisor</span>
          <span>Signal</span>
          <span className="hidden sm:block">Trend</span>
          <span>This Period</span>
        </div>

        {/* Data rows */}
        {members.map((member, idx) => {
          const isLast = idx === members.length - 1;
          return (
            <div
              key={member.targetId ?? idx}
              onClick={() => onMemberClick?.(member.targetId)}
              className={cn(
                "grid grid-cols-[2fr_2fr_1fr_2fr_1fr] px-4 py-3 items-center",
                !isLast && "border-b border-[var(--dt-borderSubtle)]",
                onMemberClick && "cursor-pointer hover:bg-[var(--dt-surfaceAlt)] transition-colors"
              )}
            >
              <div>
                <p className="font-semibold text-sm text-black">{member.targetName}</p>
                <p className="text-xs text-[var(--dt-textDim)]">{member.targetRole}</p>
              </div>
              <div className="hidden md:block text-xs dt-text-muted">
                {member.supervisorName ?? "—"}
              </div>
              <div className="text-xl font-bold text-black">
                {member.latestComposite != null ? Number(member.latestComposite).toFixed(1) : "—"}
              </div>
              <div className="hidden sm:block">
                <TrendBars trend={member.trend} />
              </div>
              <div>
                <span className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded-full",
                  member.submittedThisPeriod
                    ? "bg-[var(--dt-greenDim)] text-success"
                    : "bg-base-200 text-[var(--dt-textDim)]"
                )}>
                  {member.submittedThisPeriod ? "Reflected" : "Open"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
