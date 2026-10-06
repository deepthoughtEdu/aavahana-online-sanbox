"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AssessmentProgressTracker from "./AssessmentProgressTracker";
import AssessmentConsolidatedView from "./AssessmentConsolidatedView";
import VoiceExplanation from "./VoiceExplanation";
import type {
  ActivityRegistration,
  AssessmentPersistence,
  AssessmentResult,
  CompletionConfig,
} from "./types";

interface ReflectiveAssessmentEngineProps {
  activities: ActivityRegistration[];
  persistence: AssessmentPersistence;
  completion?: CompletionConfig;
  enableExplanation?: boolean;
}

export default function ReflectiveAssessmentEngine({
  activities,
  persistence,
  completion,
  enableExplanation = true,
}: ReflectiveAssessmentEngineProps) {
  const { activities: savedActivities, isLoading, submitActivity } = persistence;
  const total = activities.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [results, setResults] = useState<Partial<Record<number, AssessmentResult>>>({});
  const [showFinalReveal, setShowFinalReveal] = useState(false);
  const [showConsolidated, setShowConsolidated] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [pendingResult, setPendingResult] = useState<AssessmentResult | null>(null);

  const pendingResultRef = useRef<AssessmentResult | null>(null);

  useEffect(() => {
    if (isLoading || hydrated) return;
    if (savedActivities.length === 0) {
      setHydrated(true);
      return;
    }

    const completed = new Set<number>();
    const restored: Partial<Record<number, AssessmentResult>> = {};

    for (const a of savedActivities) {
      completed.add(a.activityId);
      restored[a.activityId] = {
        activityId: a.activityId,
        choices: a.choices as Record<string, unknown>,
        revealSeen: true,
      };
    }

    setCompletedIds(completed);
    setResults(restored);

    let highestIndex = -1;
    for (const a of savedActivities) {
      const idx = activities.findIndex((r) => r.meta.id === a.activityId);
      if (idx > highestIndex) highestIndex = idx;
    }

    if (highestIndex >= total - 1) {
      setShowFinalReveal(true);
    } else {
      setCurrentIndex(Math.min(highestIndex + 1, total - 1));
    }

    setHydrated(true);
  }, [savedActivities, isLoading, hydrated, activities, total]);

  const advanceAfterSubmit = useCallback(
    (result: AssessmentResult) => {
      const idx = activities.findIndex((a) => a.meta.id === result.activityId);
      if (idx < total - 1) {
        setCurrentIndex(idx + 1);
      } else {
        setShowFinalReveal(true);
      }
    },
    [activities, total]
  );

  const submitAndAdvance = useCallback(
    async (result: AssessmentResult, explanation?: string) => {
      setResults((prev) => ({ ...prev, [result.activityId]: result }));
      setCompletedIds((prev) => new Set(prev).add(result.activityId));

      try {
        await submitActivity({
          activityId: result.activityId,
          choices: result.choices,
          score: result.choices,
          explanation,
        });
      } catch {
        // saved locally even if backend fails
      }

      advanceAfterSubmit(result);
    },
    [submitActivity, advanceAfterSubmit]
  );

  const handleComplete = useCallback(
    (result: AssessmentResult) => {
      if (enableExplanation) {
        pendingResultRef.current = result;
        setPendingResult(result);
      } else {
        submitAndAdvance(result);
      }
    },
    [enableExplanation, submitAndAdvance]
  );

  const handleExplanationSubmit = useCallback(
    (explanation: string) => {
      const result = pendingResultRef.current;
      if (!result) return;
      setPendingResult(null);
      pendingResultRef.current = null;
      submitAndAdvance(result, explanation);
    },
    [submitAndAdvance]
  );

  const handleExplanationSkip = useCallback(() => {
    const result = pendingResultRef.current;
    if (!result) return;
    setPendingResult(null);
    pendingResultRef.current = null;
    submitAndAdvance(result);
  }, [submitAndAdvance]);

  const handleNavigate = useCallback(
    (id: number) => {
      const idx = activities.findIndex((a) => a.meta.id === id);
      if (idx >= 0) {
        setCurrentIndex(idx);
        setShowFinalReveal(false);
        setShowConsolidated(false);
        setPendingResult(null);
        pendingResultRef.current = null;
      }
    },
    [activities]
  );

  const handleShowConsolidated = useCallback(() => {
    setShowConsolidated(true);
    setShowFinalReveal(false);
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-500 text-sm font-mono uppercase tracking-widest">
          Loading...
        </div>
      </div>
    );
  }

  const current = activities[currentIndex];
  const ActivityComponent = current.component;
  const pendingMeta = pendingResult
    ? activities.find((a) => a.meta.id === pendingResult.activityId)?.meta
    : null;

  const gridCols =
    total <= 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-4";

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <AnimatePresence mode="wait">
        {showConsolidated ? (
          <motion.div
            key="consolidated"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AssessmentConsolidatedView
              activities={activities}
              results={results}
              onNavigate={handleNavigate}
              completionBanner={completion?.banner}
            />
          </motion.div>
        ) : showFinalReveal ? (
          <motion.div
            key="final"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center px-4"
          >
            <div className="text-center max-w-2xl">
              <div className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 font-mono mb-6">
                {total} Activities Complete
              </div>

              <div className={`grid ${gridCols} gap-3 mb-10`}>
                {activities.map((reg) => (
                  <div
                    key={reg.meta.id}
                    className="rounded-lg border border-slate-700 bg-slate-800/50 p-3"
                  >
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500 font-mono mb-1">
                      {reg.meta.id}
                    </div>
                    <div className="text-xs text-slate-300 font-medium">
                      {reg.meta.name}
                    </div>
                  </div>
                ))}
              </div>

              {completion ? (
                <>
                  <div className="space-y-4 mb-10">
                    <p className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white">
                      {completion.title}
                    </p>
                    <p className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-blue-500">
                      {completion.subtitle}
                    </p>
                  </div>
                  {completion.footnote && (
                    <p className="text-xs text-slate-500 font-medium max-w-md mx-auto leading-relaxed mb-8">
                      {completion.footnote}
                    </p>
                  )}
                </>
              ) : (
                <div className="space-y-4 mb-10">
                  <p className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white">
                    Assessment Complete.
                  </p>
                </div>
              )}

              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={handleShowConsolidated}
                  className="px-8 py-3 bg-blue-600 text-white font-black uppercase tracking-widest text-sm rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                >
                  {completion?.reportLabel ?? "View Full Report"}
                </button>
                <button
                  onClick={() => handleNavigate(activities[0].meta.id)}
                  className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
                >
                  &larr; {completion?.revisitLabel ?? "Revisit activities"}
                </button>
              </div>
            </div>
          </motion.div>
        ) : pendingResult && pendingMeta ? (
          <motion.div
            key={`explain-${pendingResult.activityId}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-screen flex items-center justify-center"
          >
            <VoiceExplanation
              activityName={pendingMeta.name}
              onSubmit={handleExplanationSubmit}
              onSkip={handleExplanationSkip}
            />
          </motion.div>
        ) : (
          <motion.div
            key={current.meta.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <ActivityComponent
              onComplete={handleComplete}
              savedResult={results[current.meta.id]}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AssessmentProgressTracker
        activities={activities}
        currentId={current.meta.id}
        completedIds={completedIds}
        onNavigate={handleNavigate}
        showConsolidated={showConsolidated}
        onShowConsolidated={handleShowConsolidated}
      />
    </div>
  );
}
