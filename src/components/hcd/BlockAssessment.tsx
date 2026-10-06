"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { FullBleedScreen } from "@/components/shared/FullBleedScreen";
import { useAssessment } from "@/lib/hooks/assessments/use-assessment";
import { isError } from "@/lib/api/client";
import {
  HcdBlockService,
  REFLECTION_MIN_CHARS,
} from "@/lib/services/hcd/block.service";
import { ReflectionStep } from "@/components/hcd/ReflectionStep";
import type { McqBlockData, McqOption } from "@/components/lnd";

/**
 * The HCD block assessment, laid out for focus: one centred column, the
 * reading folded to a line you can open, a step tracker centred in the bar, and
 * Previous/Next paired top-right so they never move as the options change.
 * Answers stay changeable until the block is finished, then the reflection,
 * then a results list.
 *
 * It fills the content area and scrolls inside, so the whole passage is
 * readable without the page scrolling.
 *
 * Answers are upserted as the learner moves on, so a reload resumes where they
 * left off. It collects no per-question explanation, which is what the Apply
 * tab's coach reads.
 */

type Phase = "questions" | "reflection" | "results";

interface BlockAssessmentProps {
  block: McqBlockData;
  contextType?: string;
  contextId?: number;
  /** HCD: a written reflection closes the block before its results open. */
  requireReflection?: boolean;
  /** Rendered top-left, inside the screen — the caller's back button and controls. */
  header?: ReactNode;
}

function hasReflection(metadata: Record<string, unknown> | null | undefined) {
  const reflection = metadata?.reflection as { text?: unknown } | undefined;
  return typeof reflection?.text === "string" && reflection.text.trim().length > 0;
}

function StepTracker({
  total,
  currentIndex,
  answeredIndexes,
  onJump,
}: {
  total: number;
  currentIndex: number;
  answeredIndexes: Set<number>;
  onJump: (index: number) => void;
}) {
  return (
    <div className="flex items-center">
      {Array.from({ length: total }, (_, i) => {
        const answered = answeredIndexes.has(i);
        const current = i === currentIndex;
        return (
          <div key={i} className="flex items-center">
            <button
              onClick={() => onJump(i)}
              title={`Question ${i + 1}`}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                answered
                  ? "bg-primary text-primary-content"
                  : current
                    ? "bg-base-100 text-primary ring-2 ring-primary"
                    : "bg-base-300 dt-text-dim hover:bg-base-200"
              }`}
            >
              {answered ? <Check className="w-4 h-4" /> : i + 1}
            </button>
            {i < total - 1 && (
              <div
                className={`w-8 sm:w-12 h-px ${
                  answeredIndexes.has(i) ? "bg-primary" : "bg-base-300"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function BlockAssessment({
  block,
  contextType = "standalone",
  contextId,
  requireReflection = false,
  header,
}: BlockAssessmentProps) {
  const { activities: saved, isLoading, submitActivity, instance } = useAssessment(
    "lnd-block",
    {
      contextType,
      contextId,
      metadata: { blockId: block.id },
      autoCreate: true,
    }
  );
  const qc = useQueryClient();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [phase, setPhase] = useState<Phase>("questions");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hydrated = useRef(false);

  const question = block.questions[currentIndex];
  const total = block.questions.length;
  const canComplete = contextId != null;
  const answeredIndexes = new Set(
    block.questions.flatMap((q, i) => (answers[q.id] ? [i] : []))
  );

  // Reopening an attempt restores the answers already given and lands on the
  // step it stopped at — the first unanswered question, the reflection, or the
  // results.
  useEffect(() => {
    if (isLoading || hydrated.current) return;
    hydrated.current = true;
    if (!saved.length) return;

    const restored: Record<number, string> = {};
    for (const a of saved) {
      const key = (a.choices as { selectedOption?: string } | null)?.selectedOption;
      if (typeof key === "string") restored[a.activityId] = key;
    }
    setAnswers(restored);

    const firstUnanswered = block.questions.findIndex((q) => !restored[q.id]);
    if (firstUnanswered !== -1) {
      setCurrentIndex(firstUnanswered);
      return;
    }
    setPhase(
      requireReflection && !hasReflection(instance?.metadata) ? "reflection" : "results"
    );
  }, [isLoading, saved, block.questions, requireReflection, instance]);

  const handleSelect = (optionKey: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: optionKey }));
    setError(null);
  };

  const persistAnswer = async (index: number, optionKey: string) => {
    const q = block.questions[index];
    const option = q.options.find((o) => o.key === optionKey);
    if (!option) return;
    await submitActivity({
      activityId: q.id,
      choices: {
        selectedOption: option.key,
        weight: option.weight,
        gridCells: q.gridCells,
      },
      score: { weight: option.weight, gridCells: q.gridCells },
    });
  };

  // Moving off a question saves its answer first, so a reload never loses one.
  const goTo = async (index: number) => {
    if (saving || index === currentIndex) return;
    const optionKey = answers[question.id];
    setError(null);
    if (!optionKey) {
      setCurrentIndex(index);
      return;
    }
    setSaving(true);
    try {
      await persistAnswer(currentIndex, optionKey);
      setCurrentIndex(index);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your answer.");
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    const optionKey = answers[question.id];
    if (!optionKey || saving) return;
    if (currentIndex < total - 1) {
      await goTo(currentIndex + 1);
      return;
    }
    if (!canComplete) return;

    setSaving(true);
    setError(null);
    try {
      // The last answer is what completes the block server-side, and the server
      // refuses a reflection on an attempt that is still open.
      await persistAnswer(currentIndex, optionKey);
      setPhase(requireReflection ? "reflection" : "results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your answer.");
    } finally {
      setSaving(false);
    }
  };

  const handleReflectionComplete = async (text: string) => {
    if (contextId == null) return;
    setSaving(true);
    setError(null);
    try {
      const res = await HcdBlockService.recordReflection(contextId, text);
      if (isError(res)) throw new Error(res.error.message);
      qc.invalidateQueries({ queryKey: ["hcd", "recognition", "reflections"] });
      setPhase("results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your reflection.");
    } finally {
      setSaving(false);
    }
  };

  const shell = (children: ReactNode, scroll = false) => (
    <FullBleedScreen className="overflow-hidden" bgClassName="bg-base-200">
      <div className="h-full flex flex-col">
        {header && (
          <div className="shrink-0 border-b border-base-300 bg-base-100 px-4 sm:px-6 py-3">
            {header}
          </div>
        )}
        <div className={`flex-1 min-h-0 ${scroll ? "overflow-y-auto overscroll-contain" : "overflow-hidden"}`}>
          {children}
        </div>
      </div>
    </FullBleedScreen>
  );

  if (isLoading) {
    return shell(
      <div className="h-full flex items-center justify-center">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }

  if (phase === "reflection") {
    return shell(
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <ReflectionStep
          blockName={block.name}
          minChars={REFLECTION_MIN_CHARS}
          saving={saving}
          error={error}
          onBack={() => setPhase("questions")}
          onComplete={handleReflectionComplete}
        />
      </div>,
      true
    );
  }

  if (phase === "results") {
    const scores = block.questions.map((q) => {
      const selected = q.options.find((o) => o.key === answers[q.id]);
      return { question: q, selected, weight: selected?.weight ?? 0 };
    });
    // Option weights run 1-10, matching the backend. Normalised = average / 10.
    const avgScore = scores.reduce((s, r) => s + r.weight, 0) / scores.length;
    const normalized = avgScore / 10;

    return shell(
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="card bg-base-100 border border-base-300 p-10 text-center">
          <h3 className="text-2xl font-bold">Block Complete</h3>
          <p className="text-base dt-text-dim mt-2">
            Your competency profile has been updated.
          </p>
          <div className="text-5xl font-bold mt-6 text-primary">
            {Math.round(normalized * 100)}%
          </div>
          <p className="text-sm dt-text-dim mt-1">Average Score</p>
        </div>

        <div className="space-y-4">
          {scores.map((r) => (
            <div
              key={r.question.id}
              className="card bg-base-100 border border-base-300 p-6"
            >
              <p className="text-base font-medium">{r.question.prompt}</p>
              <p className="text-sm mt-3">
                <span className="font-medium">Your answer:</span>{" "}
                {r.selected?.text ?? "—"}
              </p>
              {r.selected?.rationale && (
                <p className="text-sm dt-text-dim mt-2 italic">
                  {r.selected.rationale}
                </p>
              )}
              {r.question.gridCells.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {r.question.gridCells.map((cell) => (
                    <span key={cell} className="badge badge-outline badge-sm">
                      {cell}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 mt-4">
                <div className="flex-1 bg-base-300 rounded-full h-2.5">
                  <div
                    className="bg-primary rounded-full h-2.5 transition-all"
                    style={{ width: `${r.weight * 10}%` }}
                  />
                </div>
                <span className="text-sm font-mono dt-text-dim">
                  {Math.round(r.weight * 10)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            setCurrentIndex(0);
            setPhase("questions");
          }}
          className="btn btn-outline"
        >
          Revisit Questions
        </button>
      </div>,
      true
    );
  }


  // Design A — Focus: the reading folds to one line, the question owns the
  // screen, and Previous/Next sit together in the bar so they never move.
  return shell(
    <div className="h-full flex flex-col">
      <div className="shrink-0 grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 py-3 border-b border-base-300 bg-base-100">
        <p className="font-semibold text-sm leading-tight truncate">{block.name}</p>
        <StepTracker
          total={total}
          currentIndex={currentIndex}
          answeredIndexes={answeredIndexes}
          onJump={(i) => void goTo(i)}
        />
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => void goTo(currentIndex - 1)}
            disabled={currentIndex === 0 || saving}
            className="btn btn-ghost btn-sm"
          >
            &larr; Previous
          </button>
          <button
            onClick={handleNext}
            disabled={
              !answers[question.id] ||
              saving ||
              (currentIndex === total - 1 && !canComplete)
            }
            className="btn btn-primary btn-sm"
          >
            {saving ? "Saving…" : currentIndex === total - 1 ? "Continue →" : "Next →"}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {/* A reading measure, centred — this screen owns its own width because
            it fills the content area rather than sitting in the page shell. */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
          {block.source && (
            // Open on the first question, folded after: the passage is read
            // once, and stays one line away for the rest of the block.
            <details
              key={currentIndex}
              open={currentIndex === 0}
              className="group mb-6 rounded-lg bg-base-200 border border-base-300"
            >
              <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="text-xs font-medium dt-text-dim uppercase tracking-wide">
                    {block.source.type}
                  </span>
                  <span className="text-sm font-semibold ml-2">
                    {block.source.title}
                  </span>
                </span>
                <span className="text-xs text-primary font-medium shrink-0">
                  <span className="group-open:hidden">Read ▾</span>
                  <span className="hidden group-open:inline">Hide ▴</span>
                </span>
              </summary>
              <p className="px-4 pb-4 text-sm dt-text-mid leading-relaxed whitespace-pre-wrap">
                {block.source.content}
              </p>
            </details>
          )}

          <p className="text-xs font-medium dt-text-dim uppercase tracking-wide mb-2">
            Question {currentIndex + 1} of {total}
          </p>
          <p className="text-lg font-semibold leading-snug mb-5">
            {question.prompt}
          </p>

          <div className="space-y-2">
            {question.options.map((opt: McqOption) => {
              const isSelected = answers[question.id] === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => handleSelect(opt.key)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg border transition-colors text-sm leading-relaxed ${
                    isSelected
                      ? "border-primary bg-primary/10 font-medium"
                      : "border-base-300 hover:bg-base-200"
                  }`}
                >
                  <span className="font-mono text-xs mr-3 dt-text-dim">
                    {opt.key.toUpperCase()}.
                  </span>
                  {opt.text}
                </button>
              );
            })}
          </div>

          {error && <p className="text-sm text-error mt-4">{error}</p>}
          {currentIndex === total - 1 && !canComplete && (
            <p className="text-sm text-error mt-4">
              Assessment could not be started correctly. Open this block again.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
