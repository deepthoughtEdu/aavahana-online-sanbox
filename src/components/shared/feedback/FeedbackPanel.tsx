/**
 * FeedbackPanel — top-level panel, auto-derives tabs from viewerLayer.
 *
 * Accepts viewerLayer + optional programId / scopeId.
 * Renders the correct give-feedback tabs, received-feedback tabs,
 * and scoring overview based on FEEDBACK_VIEW_CONFIGS.
 */
"use client";

import React, { useState } from "react";
import { cn } from "@/utils";
import { OverlayLoading } from "@/components/shared/OverlayLoading";
import { EmptyState } from "@/components/shared/EmptyState";
import { RubricForm } from "./RubricForm";
import { AggregateView } from "./AggregateView";
import { ScoringOverview } from "./ScoringOverview";
import { useFeedback } from "@/lib/hooks/shared/use-feedback";
import { useFeedbackAggregate } from "@/lib/hooks/shared/use-feedback-aggregate";
import type { PdgmsLayer, FeedbackDirectionKey } from "@/types/shared/feedback.types";
import {
  FEEDBACK_VIEW_CONFIGS,
  FEEDBACK_DIRECTION_CONFIGS,
} from "@/types/shared/feedback.types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface FeedbackPanelProps {
  viewerLayer: PdgmsLayer;
  /** Required for program-scoped directions (L3_TO_L1, L1_TO_L3, etc.) */
  programId?: string;
  /** Required for dept-scoped directions (L2_TO_L1) — typically the deptId */
  scopeId?: string;
  className?: string;
}

// ─── Sub-panel: Give feedback tab ─────────────────────────────────────────────

function GiveFeedbackTab({
  directionKey,
  programId,
  scopeId,
}: {
  directionKey: FeedbackDirectionKey;
  programId?: string;
  scopeId?: string;
}) {
  const fb = useFeedback({ directionKey, programId, scopeId });

  if (fb.isLoading) {
    return (
      <div className="relative min-h-[300px] flex items-center justify-center">
        <OverlayLoading title="Loading…" size="sm" />
      </div>
    );
  }

  if (fb.error || !fb.rubric) {
    return (
      <EmptyState variant="error" title="Couldn't load the reflection form. This is a system issue, not yours — try refreshing." subtitle={fb.error?.message} />
    );
  }

  return (
    <RubricForm
      directionKey={directionKey}
      rubric={fb.rubric}
      targets={fb.targets}
      history={fb.history}
      selectedTargetId={fb.selectedTargetId}
      scores={fb.scores}
      comments={fb.comments}
      composite={fb.composite}
      isSubmitting={fb.isSubmitting}
      draftSavedAt={fb.draftSavedAt}
      period={fb.period}
      weekLabel={fb.weekLabel}
      weekDays={fb.weekDays}
      isLoadingWeek={fb.isLoadingWeek}
      atLatestWeek={fb.atLatestWeek}
      onPrevWeek={fb.goPrevWeek}
      onNextWeek={fb.goNextWeek}
      onTargetSelect={fb.selectTarget}
      onScoreChange={fb.setScore}
      onCommentChange={fb.setComment}
      onSubmit={fb.submit}
    />
  );
}

// ─── Sub-panel: Received (aggregate) tab ──────────────────────────────────────

function ReceivedFeedbackTab({
  directionKey,
  viewerId,
}: {
  directionKey: FeedbackDirectionKey;
  viewerId: string;
}) {
  const cfg = FEEDBACK_DIRECTION_CONFIGS[directionKey];
  const { data: aggregate, isLoading, error } = useFeedbackAggregate(directionKey, viewerId);

  return (
    <AggregateView
      aggregate={aggregate}
      isLoading={isLoading}
      error={error}
      label={cfg.receivedLabel}
    />
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function FeedbackPanel({
  viewerLayer,
  programId,
  scopeId,
  className,
}: FeedbackPanelProps) {
  const viewConfig = FEEDBACK_VIEW_CONFIGS[viewerLayer];

  // Filter out program-scoped give-tabs if no programId
  const visibleGiveTabs = viewConfig.giveTabs.filter((k) => {
    const cfg = FEEDBACK_DIRECTION_CONFIGS[k];
    return !cfg.isProgramScoped || !!programId;
  });

  // Build all tab entries
  type TabEntry = { key: string; label: string; kind: "give" | "receive" | "overview"; directionKey: FeedbackDirectionKey };
  const tabs: TabEntry[] = [
    ...visibleGiveTabs.map((k) => ({
      key: `give:${k}`,
      label: FEEDBACK_DIRECTION_CONFIGS[k].tabLabel,
      kind: "give" as const,
      directionKey: k,
    })),
    ...viewConfig.receiveTabs.map((k) => ({
      key: `receive:${k}`,
      label: FEEDBACK_DIRECTION_CONFIGS[k].receivedLabel,
      kind: "receive" as const,
      directionKey: k,
    })),
    ...(viewConfig.overviewTab
      ? [{ key: "overview", label: "Team Growth Map", kind: "overview" as const, directionKey: viewConfig.overviewTab }]
      : []),
  ];

  const [activeKey, setActiveKey] = useState(tabs[0]?.key ?? "");
  const activeTab = tabs.find((t) => t.key === activeKey);

  if (tabs.length === 0) {
    return <EmptyState title="No feedback actions" subtitle="No one to reflect on right now. This updates automatically as your team or program changes." />;
  }

  // Viewer ID placeholder — in production this comes from useAuth
  const VIEWER_ID = "current-user";

  return (
    <div className={cn("space-y-5", className)}>
      {/* Tab bar */}
      <div className="flex gap-1 flex-wrap bg-base-200 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveKey(tab.key)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
              activeKey === tab.key
                ? "bg-white text-black shadow-sm"
                : "text-neutral hover:text-black"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab?.kind === "give" && (
        <GiveFeedbackTab
          directionKey={activeTab.directionKey}
          programId={programId}
          scopeId={scopeId}
        />
      )}

      {activeTab?.kind === "receive" && (
        <ReceivedFeedbackTab
          directionKey={activeTab.directionKey}
          viewerId={VIEWER_ID}
        />
      )}

      {activeTab?.kind === "overview" && viewConfig.overviewTab && (
        <ScoringOverview
          directionKey={viewConfig.overviewTab}
          scopeId={scopeId ?? programId ?? ""}
        />
      )}
    </div>
  );
}
