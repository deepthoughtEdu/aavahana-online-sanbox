"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useAtom, useAtomValue } from "jotai";
import { Provider } from "jotai";
import { ProgressBar } from "./ProgressBar";
import { Act1Work } from "./Act1Work/Act1Work";
import { Act2Story } from "./Act2Story/Act2Story";
import { Act3Close } from "./Act3Close/Act3Close";
import { SummaryCard } from "./SummaryCard";
import { currentStepAtom, reportAtom, goToStepAtom } from "./data/atoms";
import { MOCK_PLANNED_DELIVERABLES, MOCK_FEEDBACK } from "./data/mockData";
import type { FlowStep } from "./data/types";

const STEP_ORDER: FlowStep[] = [
  "act1",
  "act2_tapping",
  "act2_voice",
  "act2_confirm",
  "act3",
  "summary",
  "done",
];

function useElapsedTimer(startedAt: number, running: boolean): string {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt, running]);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function DailyReportV6Inner() {
  const step = useAtomValue(currentStepAtom);
  const [state, setState] = useAtom(reportAtom);
  const [, _goToStep] = useAtom(goToStepAtom);
  const [prevStepIdx, setPrevStepIdx] = useState(STEP_ORDER.indexOf(step));
  const currentIdx = STEP_ORDER.indexOf(step);
  const shouldReduceMotion = useReducedMotion(); // D-1

  const direction: 1 | -1 = currentIdx >= prevStepIdx ? 1 : -1;

  useEffect(() => {
    setPrevStepIdx(currentIdx);
  }, [currentIdx]);

  // F-2: set startedAt on mount (not module load)
  useEffect(() => {
    setState((prev) => prev.startedAt === 0 ? { ...prev, startedAt: Date.now() } : prev);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const timerStr = useElapsedTimer(state.startedAt, step !== "summary" && step !== "done");
  const isShowingSummary = step === "summary";
  const isDone = step === "done";
  const dur = (d: number) => (shouldReduceMotion ? 0 : d);

  const freshState = () => ({
    step: "act1" as FlowStep,
    startedAt: Date.now(),
    deliverables: MOCK_PLANNED_DELIVERABLES.map((d) => ({ ...d })),
    unplanned: [],
    constraint: null,
    navigation: null,
    narrative: "",
    skippedAct2: false,
    framework: null,
    feeling: null,
    constraintDetail: "",
    smoothDayNote: "",
    frameworkHelpedConstraint: null,
  });

  // B-1: preserve state data when transitioning to "done" so echo screen can read it
  function handleSummaryDismiss() {
    setState((prev) => ({ ...prev, step: "done" }));
  }

  function handleStartNew() {
    setState(freshState());
  }

  if (isDone) {
    // Echo screen — not a void
    const lastFeeling = state.feeling?.macroLabel;
    const lastFramework = state.framework?.microLabel;
    const lastConstraint = state.constraint?.macroLabel;
    const lastNav = state.navigation?.macroLabel;

    // E-5: signal strength from report completeness
    const hasConstraint = Boolean(state.constraint?.microId);
    const hasNarrative = state.narrative.trim().length >= 10;
    const hasDetail = state.constraintDetail.trim().length > 0;
    const signalScore = state.skippedAct2 ? 0 : [hasConstraint, hasNarrative, hasDetail].filter(Boolean).length;
    const signal =
      signalScore === 3
        ? { label: "Strong", cls: "text-success" }
        : signalScore >= 2
          ? { label: "Moderate", cls: "text-warning" }
          : { label: "Weak", cls: "text-error" };

    const dur = (d: number) => (shouldReduceMotion ? 0 : d);

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: dur(0.5), ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-5 text-center"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: dur(0.15), duration: dur(0.4), ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl"
          >
            🔥
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: dur(0.3), duration: dur(0.4), ease: [0.16, 1, 0.3, 1] }}
            className="text-lg font-bold text-primary"
          >
            {MOCK_FEEDBACK.streak}-day streak
          </motion.p>

          {/* E-5: signal strength badge */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: dur(0.4), duration: dur(0.3) }}
            className="text-sm"
          >
            Signal: <span className={`font-semibold ${signal.cls}`}>{signal.label}</span>
          </motion.p>

          {(lastConstraint || lastFramework) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: dur(0.5), duration: dur(0.4) }}
              className="flex flex-col gap-1 text-sm text-base-content/60"
            >
              {lastConstraint && lastNav && (
                <p>
                  {lastConstraint} → {lastNav}
                </p>
              )}
              {lastFramework && lastFeeling && (
                <p>
                  {lastFramework} · {lastFeeling}
                </p>
              )}
            </motion.div>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: dur(0.7), duration: dur(0.4) }}
            className="text-sm text-base-content/40"
          >
            See you tomorrow.
          </motion.p>

          <motion.button
            type="button"
            onClick={handleStartNew}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: dur(0.9), duration: dur(0.3) }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-ghost btn-sm mt-4"
          >
            Start new report
          </motion.button>
        </motion.div>
      </div>
    );
  }

  function renderCurrentAct() {
    if (step === "act1") return <Act1Work key="act1" />;
    if (step === "act2_tapping" || step === "act2_voice" || step === "act2_confirm")
      return <Act2Story key="act2" />;
    if (step === "act3") return <Act3Close key="act3" />;
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-base-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-base-100/90 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between px-4 pt-2">
          {/* D-5: timer is a live region for screen readers */}
          <span
            role="timer"
            aria-live="polite"
            aria-label="Elapsed time"
            className="font-mono text-xs text-base-content/40 tabular-nums"
          >
            {timerStr}
          </span>
          <span className="text-xs text-base-content/40">Daily Report</span>
        </div>
        <ProgressBar currentStep={step} />
      </div>

      {/* Act content — real transitions */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step === "act2_tapping" || step === "act2_voice" || step === "act2_confirm" ? "act2" : step}
          initial={{ x: shouldReduceMotion ? 0 : direction * 120, opacity: 0, scale: shouldReduceMotion ? 1 : 0.92 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: shouldReduceMotion ? 0 : direction * -120, opacity: 0, scale: shouldReduceMotion ? 1 : 0.92 }}
          transition={{ duration: dur(0.4), ease: [0.16, 1, 0.3, 1] }}
          className="pt-2"
        >
          {renderCurrentAct()}
        </motion.div>
      </AnimatePresence>

      {/* Summary overlay */}
      <AnimatePresence>
        {isShowingSummary && <SummaryCard onDismiss={handleSummaryDismiss} />}
      </AnimatePresence>
    </div>
  );
}

export function DailyReportV6() {
  return (
    <Provider>
      <DailyReportV6Inner />
    </Provider>
  );
}
