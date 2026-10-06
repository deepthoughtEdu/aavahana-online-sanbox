/**
 * RubricForm — dimension sliders → composite score → submit.
 *
 * Used for ALL give-feedback directions. Stateless: all state lives in useFeedback.
 */
"use client";

import React from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { RespondentCard } from "./_components/RespondentCard";
import { DimensionSlider } from "./_components/DimensionSlider";
import { CompositeScoreBadge } from "./_components/CompositeScoreBadge";
import { DirectionLabel } from "./_components/DirectionLabel";
import { WeekEvidence } from "./_components/WeekEvidence";
import { ScoreHistory } from "./ScoreHistory";
import type {
  FeedbackDirectionKey,
  FeedbackRubric,
  FeedbackTarget,
  FeedbackSubmission,
  FeedbackWeekDay,
} from "@/types/shared/feedback.types";
import { FEEDBACK_DIRECTION_CONFIGS } from "@/types/shared/feedback.types";
import { formatInstantShort } from "@/utils/shared/date.utils";

interface RubricFormProps {
  directionKey: FeedbackDirectionKey;
  rubric: FeedbackRubric;
  targets: FeedbackTarget[];
  history: FeedbackSubmission[];
  selectedTargetId: string | null;
  scores: Record<string, number>;
  comments: Record<string, string>;
  composite: number;
  isSubmitting: boolean;
  draftSavedAt?: number | null;
  onTargetSelect(targetId: string): void;
  onScoreChange(dimensionId: string, value: number): void;
  onCommentChange(dimensionId: string, value: string): void;
  onSubmit(period: string): void;
  // Weekly reflection: the score's period + the target's daily evidence for that week
  period: string;
  weekLabel: string;
  weekDays?: FeedbackWeekDay[];
  isLoadingWeek?: boolean;
  atLatestWeek?: boolean;
  onPrevWeek(): void;
  onNextWeek(): void;
}

export function RubricForm({
  directionKey,
  rubric,
  targets,
  history,
  selectedTargetId,
  scores,
  comments,
  composite,
  isSubmitting,
  draftSavedAt,
  onTargetSelect,
  onScoreChange,
  onCommentChange,
  onSubmit,
  period,
  weekLabel,
  weekDays = [],
  isLoadingWeek = false,
  atLatestWeek = false,
  onPrevWeek,
  onNextWeek,
}: RubricFormProps) {
  const cfg = FEEDBACK_DIRECTION_CONFIGS[directionKey];

  // For anonymous (single-target) directions, auto-select the only target
  const effectiveTargetId = cfg.isAnonymous && targets.length === 1
    ? targets[0].id
    : selectedTargetId;

  const selectedTarget = targets.find((t) => t.id === effectiveTargetId);
  const canSubmit = !!effectiveTargetId && (rubric.dimensions?.length ?? 0) > 0;

  return (
    <div className="space-y-5">
      {/* Direction label */}
      <DirectionLabel directionKey={directionKey} />

      {/* Target selector — hidden for anonymous single-target */}
      {!(cfg.isAnonymous && targets.length === 1) && targets.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-black">Select {cfg.toLayer} Member</p>
          <div className="space-y-2">
            {targets.map((t) => (
              <RespondentCard
                key={t.id}
                target={t}
                isSelected={t.id === selectedTargetId}
                onSelect={() => onTargetSelect(t.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Rubric sliders */}
      {(effectiveTargetId || cfg.isAnonymous) && (
        <div className="bg-white rounded-xl border border-base-300 p-4 space-y-5">
          {selectedTarget && !cfg.isAnonymous && (
            <div className="pb-3 border-b border-[var(--dt-borderSubtle)]">
              <p className="text-sm font-semibold text-black">
                {cfg.label}: <span className="text-primary">{selectedTarget.name}</span>
              </p>
              <p className="text-xs text-[var(--dt-textDim)]">Reflecting on {weekLabel}</p>
            </div>
          )}

          {cfg.isAnonymous && (
            <div className="pb-3 border-b border-[var(--dt-borderSubtle)]">
              <p className="text-sm font-semibold text-black">{cfg.label}</p>
              <p className="text-xs text-[var(--dt-textDim)]">Anonymous · {weekLabel}</p>
            </div>
          )}

          {/* Anonymity assurance banner */}
          {cfg.isAnonymous && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-info/10 border border-info/30">
              <Lock className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
              <p className="text-sm text-info-content">
                Your response is anonymous. Only the group average is visible to the
                recipient — never your individual input, and never your identity.
                This is how honest feedback becomes useful feedback.
              </p>
            </div>
          )}

          {/* Weekly evidence — the target's daily plans + reports for the reflected week */}
          {!cfg.isAnonymous && selectedTarget && (
            <WeekEvidence
              ownerName={selectedTarget.name}
              weekLabel={weekLabel}
              days={weekDays}
              isLoading={isLoadingWeek}
              atLatestWeek={atLatestWeek}
              onPrevWeek={onPrevWeek}
              onNextWeek={onNextWeek}
            />
          )}

          {(rubric.dimensions ?? []).map((dim) => (
            <DimensionSlider
              key={dim.id}
              dimension={dim}
              value={scores[dim.id] ?? dim.scale.min}
              onChange={(v) => onScoreChange(dim.id, v)}
              comment={comments[dim.id]}
              onCommentChange={(v) => onCommentChange(dim.id, v)}
              disabled={isSubmitting}
            />
          ))}

          <CompositeScoreBadge score={composite} variant="giver" />

          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--dt-textDim)]">
              {draftSavedAt ? `Draft saved · ${formatInstantShort(draftSavedAt)}` : ""}
            </span>
            <Button
              color="primary"
              size="sm"
              disabled={!canSubmit || isSubmitting}
              onClick={() => onSubmit(period)}
            >
              {isSubmitting ? "Sharing…" : "Share Reflection"}
            </Button>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && <ScoreHistory history={history} />}
    </div>
  );
}
