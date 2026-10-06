"use client";

import React from "react";
import { motion } from "framer-motion";
import { useAtom } from "jotai";
import { ChipDisplay } from "../shared/ChipDisplay";
import { reportAtom, goToStepAtom } from "../data/atoms";
import { MOCK_FEEDBACK } from "../data/mockData";
import type { FeedbackSignals } from "../data/types";

interface StoryConfirmationProps {
  // E-4: accept dynamic feedback; undefined = use mock; null = no data (empty state)
  feedbackSignals?: FeedbackSignals | null;
}

export function StoryConfirmation({ feedbackSignals }: StoryConfirmationProps) {
  const [state, setState] = useAtom(reportAtom);
  const [, goToStep] = useAtom(goToStepAtom);

  const signals = feedbackSignals === undefined ? MOCK_FEEDBACK : feedbackSignals;

  return (
    <div className="flex flex-col gap-5 px-4 pb-28">
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="text-xl font-bold text-base-content"
      >
        Your story
      </motion.h2>

      {/* Chips — pop in one by one */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="flex flex-wrap gap-2"
      >
        {state.constraint && state.constraint.microId && (
          <ChipDisplay
            macroLabel={state.constraint.macroLabel}
            microLabel={state.constraint.microLabel}
            delay={100}
          />
        )}
        {state.navigation && state.navigation.microId && (
          <ChipDisplay
            macroLabel={state.navigation.macroLabel}
            microLabel={state.navigation.microLabel}
            delay={300}
          />
        )}
      </motion.div>

      {/* Narrative — editable */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <textarea
          rows={4}
          value={state.narrative}
          onChange={(e) => setState((prev) => ({ ...prev, narrative: e.target.value }))}
          className="textarea textarea-bordered w-full resize-none text-sm transition-all duration-200 focus:border-primary focus:shadow-md focus:shadow-primary/10"
          placeholder="Edit your story…"
          aria-label="Edit your story"
        />
      </motion.div>

      {/* Feedback signals — E-4: dynamic or empty state */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-xl border-2 border-primary/25 bg-primary/8 px-4 py-3"
      >
        {signals ? (
          <>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-primary/60">
              Pattern detected
            </p>
            <div className="flex flex-col gap-1.5">
              <p className="flex items-center gap-2 text-sm text-base-content/80">
                <span className="inline-block h-2 w-2 rounded-full bg-warning" />
                <span className="font-semibold">{signals.constraintPersistence.type}</span>
                {" "}{signals.constraintPersistence.count}/{signals.constraintPersistence.days} days this week
              </p>
              <p className="flex items-center gap-2 text-sm text-base-content/80">
                <span className="inline-block h-2 w-2 rounded-full bg-info" />
                <span className="font-semibold">{signals.navigationVariety.count}</span>
                {" "}different approaches tried
              </p>
            </div>
          </>
        ) : (
          // E-4: empty state when no backend data
          <p className="text-sm text-base-content/50">
            Keep reporting — patterns emerge after 3 days.
          </p>
        )}
      </motion.div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-10 flex gap-2 border-t border-base-200 bg-base-100/90 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={() => goToStep("act2_voice")} // B-4: back to voice, not tapping
          className="btn btn-ghost flex-1 active:scale-95"
        >
          ← Back
        </button>
        <motion.button
          type="button"
          onClick={() => goToStep("act3")}
          whileTap={{ scale: 0.94 }}
          className="btn btn-primary flex-1"
        >
          Next →
        </motion.button>
      </div>
    </div>
  );
}
