/**
 * useFeedback — hook for the "give feedback" flow.
 *
 * Loads the rubric + target list for a direction, tracks local score state,
 * and handles submission. Works for all 9 FeedbackDirectionKeys.
 */
"use client";

import { useState, useMemo, useEffect } from "react";
import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { FeedbackService } from "@/lib/services/shared/feedback.service";
import { queryClient } from "@/lib/query/client";
import type {
  FeedbackDirectionKey,
  FeedbackRubric,
  FeedbackTarget,
  FeedbackSubmission,
  FeedbackScore,
  FeedbackWeekDay,
} from "@/types/shared/feedback.types";
import { FEEDBACK_DIRECTION_CONFIGS, buildHolisticRubric } from "@/types/shared/feedback.types";
import { getIsoWeekStart, getIsoWeekEnd, getIsoWeekId, formatWeekRange, addTime } from "@/utils/shared/date.utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseFeedbackOptions {
  directionKey: FeedbackDirectionKey;
  /** Required for program-scoped directions (L3_TO_L1, L1_TO_L3, etc.) */
  programId?: string;
  /** Required for dept-scoped directions (L2_TO_L1) */
  scopeId?: string;
}

interface UseFeedbackReturn {
  rubric: FeedbackRubric | null;
  targets: FeedbackTarget[];
  history: FeedbackSubmission[];
  selectedTargetId: string | null;
  scores: Record<string, number>;
  comments: Record<string, string>;
  /** Real-time weighted composite (0–10, 1 dp) */
  composite: number;
  isLoading: boolean;
  isSubmitting: boolean;
  error: Error | null;
  draftSavedAt: number | null;
  // Weekly reflection: the week being reflected on + the target's daily evidence.
  period: string; // weekId (YYYY-Www) — the score's period
  weekStart: string; // Monday ISO date of the reflected week
  weekLabel: string; // e.g. "Week of 9–15 Jun"
  weekDays: FeedbackWeekDay[];
  isLoadingWeek: boolean;
  atLatestWeek: boolean; // on the most recent completed week (can't go forward)
  goPrevWeek(): void;
  goNextWeek(): void;
  selectTarget(targetId: string): void;
  setScore(dimensionId: string, value: number): void;
  setComment(dimensionId: string, value: string): void;
  submit(period: string): Promise<void>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useFeedback({
  directionKey,
  programId,
  scopeId,
}: UseFeedbackOptions): UseFeedbackReturn {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);

  const effectiveScopeId = scopeId ?? programId;
  const cfg = FEEDBACK_DIRECTION_CONFIGS[directionKey];

  // Weekly reflection: default to the previous completed ISO week. The score's
  // period is that week's id (YYYY-Www); the evidence is its daily plans+reports.
  const lastCompletedMonday = getIsoWeekStart(addTime(getIsoWeekStart(new Date()), -7, "day"));
  const [weekStart, setWeekStart] = useState<string>(() => lastCompletedMonday);
  const currentPeriod = getIsoWeekId(weekStart);
  const weekLabel = formatWeekRange(weekStart, getIsoWeekEnd(weekStart));
  const atLatestWeek = weekStart >= lastCompletedMonday;
  const goPrevWeek = () => setWeekStart((w) => getIsoWeekStart(addTime(w, -7, "day")));
  const goNextWeek = () =>
    setWeekStart((w) => {
      const next = getIsoWeekStart(addTime(w, 7, "day"));
      return next > lastCompletedMonday ? w : next;
    });

  // Draft key scoped to direction + target + period
  const draftKey = `feedback-draft:${directionKey}:${selectedTargetId ?? "_"}:${currentPeriod}`;

  // ── Rubric ────────────────────────────────────────────────────────────────
  const rubricQuery = useApi({
    queryKey: ["feedback", "rubric", directionKey, programId],
    queryFn: () => FeedbackService.getRubric(directionKey, programId),
    enabled: !!directionKey,
  });

  // ── Targets ───────────────────────────────────────────────────────────────
  const targetsQuery = useApi({
    queryKey: ["feedback", "targets", directionKey, effectiveScopeId],
    queryFn: () => FeedbackService.getTargets(directionKey, effectiveScopeId),
    enabled: !!directionKey,
  });

  // ── History ───────────────────────────────────────────────────────────────
  const historyQuery = useApi({
    queryKey: ["feedback", "history", directionKey, programId],
    queryFn: () => FeedbackService.getHistory(directionKey, programId),
    enabled: !!directionKey,
  });

  // ── Auto-select for anonymous single-target ────────────────────────────────
  const effectiveTargetId = cfg.isAnonymous && Array.isArray(targetsQuery.data) && targetsQuery.data.length === 1
    ? (targetsQuery.data as FeedbackTarget[])[0].id
    : selectedTargetId;

  // ── Weekly evidence: the target's daily plans + reports for the reflected week ─
  const weekQuery = useApi({
    queryKey: ["feedback", "week", effectiveTargetId, weekStart],
    queryFn: () => FeedbackService.getTargetWeek(effectiveTargetId!, weekStart),
    enabled: !cfg.isAnonymous && !!effectiveTargetId && !!weekStart,
  });

  // The backend has no rubric configured for most directions yet — fall back to
  // the org's standard holistic 0–10 scale so the form always works (and shows
  // the named level anchors). A real backend rubric with dimensions wins.
  const rubric = useMemo(
    () => ((rubricQuery.data?.dimensions?.length ?? 0) > 0 ? rubricQuery.data! : buildHolisticRubric(directionKey)),
    [rubricQuery.data, directionKey]
  );

  // ── Composite score ───────────────────────────────────────────────────────
  const composite = useMemo(() => {
    if (Object.keys(scores).length === 0) return 0;
    const totalWeight = rubric.dimensions.reduce((a, d) => a + d.weight, 0);
    if (totalWeight === 0) return 0;
    const weighted = rubric.dimensions.reduce((a, d) => a + (scores[d.id] ?? 0) * d.weight, 0);
    return Math.round((weighted / totalWeight) * 10) / 10;
  }, [rubric, scores]);

  // ── Draft restore on target change ───────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { scores: Record<string, number>; comments: Record<string, string>; savedAt: number };
        setScores(parsed.scores ?? {});
        setComments(parsed.comments ?? {});
        setDraftSavedAt(parsed.savedAt ?? null);
      } else {
        setScores({});
        setComments({});
        setDraftSavedAt(null);
      }
    } catch {
      // ignore malformed draft
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTargetId, directionKey, currentPeriod]);

  // ── Draft save on score/comment change ────────────────────────────────────
  useEffect(() => {
    if (Object.keys(scores).length === 0) return;
    const now = Date.now();
    try {
      localStorage.setItem(draftKey, JSON.stringify({ scores, comments, savedAt: now }));
      setDraftSavedAt(now);
    } catch {
      // storage unavailable
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scores, comments]);

  // ── Submit mutation ───────────────────────────────────────────────────────
  const mutation = useApiMutation({
    mutationFn: (payload: { period: string }) => {
      if (!selectedTargetId || !rubric) {
        return Promise.reject(new Error("No target or rubric selected"));
      }
      const scoreArray: FeedbackScore[] = Object.entries(scores).map(([dimensionId, score]) => ({
        dimensionId,
        score,
        comment: comments[dimensionId] || undefined,
      }));
      return FeedbackService.submitFeedback({
        directionKey,
        targetId: selectedTargetId,
        period: payload.period,
        scores: scoreArray,
        programId,
      });
    },
    onSuccess: () => {
      try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
      setScores({});
      setComments({});
      setDraftSavedAt(null);
      queryClient.invalidateQueries({ queryKey: ["feedback", "history", directionKey] });
      queryClient.invalidateQueries({ queryKey: ["feedback", "overview", directionKey] });
    },
  });

  // ── Actions ───────────────────────────────────────────────────────────────
  function selectTarget(targetId: string) {
    setSelectedTargetId((prev) => (prev === targetId ? null : targetId));
  }

  function setScore(dimensionId: string, value: number) {
    setScores((prev) => ({ ...prev, [dimensionId]: value }));
  }

  function setComment(dimensionId: string, value: string) {
    setComments((prev) => ({ ...prev, [dimensionId]: value }));
  }

  async function submit(period: string) {
    await mutation.mutateAsync({ period });
  }

  return {
    rubric,
    targets: (targetsQuery.data as FeedbackTarget[] | undefined) ?? [],
    history: (historyQuery.data as FeedbackSubmission[] | undefined) ?? [],
    selectedTargetId,
    scores,
    comments,
    composite,
    isLoading: rubricQuery.isLoading || targetsQuery.isLoading,
    isSubmitting: mutation.isPending,
    error: rubricQuery.error ?? targetsQuery.error ?? null,
    draftSavedAt,
    period: currentPeriod,
    weekStart,
    weekLabel,
    weekDays: (weekQuery.data?.days as FeedbackWeekDay[] | undefined) ?? [],
    isLoadingWeek: weekQuery.isLoading,
    atLatestWeek,
    goPrevWeek,
    goNextWeek,
    selectTarget,
    setScore,
    setComment,
    submit,
  };
}

