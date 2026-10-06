"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAtom } from "jotai";
import { MacroMicroPicker } from "./MacroMicroPicker";
import { VoiceRecorder } from "./VoiceRecorder";
import { StoryConfirmation } from "./StoryConfirmation";
import { reportAtom, goToStepAtom } from "../data/atoms";
import { MOCK_CONSTRAINTS, MOCK_NESTED_NAVIGATIONS, MOCK_PROMPTS } from "../data/mockData";
import type { MacroMicroSelection } from "../data/types";

export function Act2Story() {
  const [state, setState] = useAtom(reportAtom);
  const [, goToStep] = useAtom(goToStepAtom);
  const [skipMode, setSkipMode] = useState<"none" | "prompt" | "ack">("none"); // E-3

  const step = state.step;

  const constraintComplete = Boolean(state.constraint?.microId);
  const navigationComplete = Boolean(state.navigation?.microId);
  // C-2: both required to proceed to voice
  const canProceedToVoice = constraintComplete && navigationComplete;

  // Resolve navigation dictionary scoped to selected constraint micro
  const navDict = state.constraint?.microId
    ? MOCK_NESTED_NAVIGATIONS[state.constraint.microId] ?? null
    : null;

  // F-3: merged single setState to avoid double-render flicker
  function handleConstraintSelect(selection: MacroMicroSelection) {
    setState((prev) => {
      // When constraint micro changes, reset navigation (different nav set)
      const navReset = selection.microId !== prev.constraint?.microId
        ? null
        : prev.navigation;
      return { ...prev, constraint: selection, navigation: navReset };
    });
  }

  function handleNavigationSelect(selection: MacroMicroSelection) {
    setState((prev) => ({ ...prev, navigation: selection }));
  }

  function buildVoicePrompt(): string {
    // C-2: use "your day" as fallback instead of "…"
    const constraintMicro = state.constraint?.microLabel ?? "your day";
    const navigationMicro = state.navigation?.microLabel ?? "your approach";
    return MOCK_PROMPTS.act2.voiceTemplate
      .replace("{constraintMicro}", constraintMicro)
      .replace("{navigationMicro}", navigationMicro);
  }

  // E-3: skip → show smooth day prompt
  function handleSkipClick() {
    setSkipMode("prompt");
  }

  function handleSmoothSubmit() {
    setSkipMode("ack");
    setTimeout(() => {
      setState((prev) => ({ ...prev, skippedAct2: true }));
      goToStep("act3");
    }, 600);
  }

  if (step === "act2_voice") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="px-4 pb-28 pt-4"
      >
        <VoiceRecorder
          prompt={buildVoicePrompt()}
          constraintLabel={state.constraint?.microLabel}
          navigationLabel={state.navigation?.microLabel}
          transcript={state.narrative}
          onTranscriptChange={(text) => setState((prev) => ({ ...prev, narrative: text }))}
          onDone={() => goToStep("act2_confirm")}
        />
        <div className="mt-6">
          <button
            type="button"
            onClick={() => goToStep("act2_tapping")}
            className="btn btn-ghost btn-sm active:scale-95"
          >
            ← Back to selections
          </button>
        </div>
      </motion.div>
    );
  }

  if (step === "act2_confirm") {
    return <StoryConfirmation />;
  }

  // Default: act2_tapping
  return (
    <div className="flex flex-col gap-6 px-4 pb-28 pt-4">
      {/* Skip — E-3: renamed + captures smooth day note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="flex flex-col items-end gap-2"
      >
        <AnimatePresence mode="wait">
          {skipMode === "ack" ? (
            <motion.span
              key="ack"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs font-medium text-success"
            >
              Smooth day ✓
            </motion.span>
          ) : skipMode === "prompt" ? (
            <motion.div
              key="prompt"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex w-full flex-col gap-2"
            >
              <p className="text-sm font-medium text-base-content/80">What made today smooth?</p>
              <input
                type="text"
                maxLength={100}
                autoFocus
                value={state.smoothDayNote}
                onChange={(e) => setState((prev) => ({ ...prev, smoothDayNote: e.target.value }))}
                placeholder="No major blockers, everything clicked…"
                className="input input-bordered w-full text-sm"
                aria-label="What made today smooth"
              />
              <button
                type="button"
                onClick={handleSmoothSubmit}
                className="btn btn-sm btn-primary self-end"
              >
                Done →
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="skip"
              type="button"
              onClick={handleSkipClick}
              className="text-xs text-base-content/40 underline underline-offset-2 active:text-base-content/60"
            >
              No major blockers today
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Main prompt */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="text-base font-medium text-base-content/80"
      >
        {MOCK_PROMPTS.act2.initial}
      </motion.p>

      {/* Constraint picker */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <MacroMicroPicker
          dictionary={MOCK_CONSTRAINTS}
          label="What would have enabled better performance?"
          selection={state.constraint}
          onSelect={handleConstraintSelect}
        />
      </motion.div>

      {/* E-2: specific blocker detail — shown once constraint is selected */}
      <AnimatePresence>
        {constraintComplete && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <input
              type="text"
              maxLength={100}
              value={state.constraintDetail}
              onChange={(e) => setState((prev) => ({ ...prev, constraintDetail: e.target.value }))}
              placeholder="What specifically blocked you?"
              className="input input-bordered w-full text-sm"
              aria-label="What specifically blocked you"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation picker — scoped to selected constraint micro */}
      {navDict && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <MacroMicroPicker
            dictionary={navDict}
            label="How did you handle it?"
            selection={state.navigation}
            onSelect={handleNavigationSelect}
          />
        </motion.div>
      )}

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-10 flex gap-2 border-t border-base-200 bg-base-100/90 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={() => goToStep("act1")}
          className="btn btn-ghost flex-1 active:scale-95"
        >
          ← Back
        </button>
        <AnimatePresence mode="wait">
          {canProceedToVoice ? (
            <motion.button
              key="active"
              type="button"
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.34, 1.1, 0.64, 1] }}
              onClick={() => goToStep("act2_voice")}
              whileTap={{ scale: 0.94 }}
              className="btn btn-primary flex-1 shadow-md shadow-primary/20"
            >
              Tell your story →
            </motion.button>
          ) : (
            <button
              key="disabled"
              type="button"
              disabled
              className="btn btn-primary flex-1 opacity-25"
            >
              Tell your story →
            </button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
