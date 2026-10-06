"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  Loader2,
} from "lucide-react";
import { ReportV7Service } from "@/lib/services/aavahana/report-v7.service";
import { SuggestionCard } from "./SuggestionCard";
import {
  isChallenge,
  type LearningSuggestion,
  type DeferReason,
  type SuggestionAction,
} from "@/types/aavahana/learning.types";

/**
 * "Last time we suggested X. Did you get to it?"
 *
 * Sits at the top of the next day's report, above the questions.
 *
 * The risk with putting it here is that it reads as being checked up on before
 * you have even started, so three things are deliberate:
 *   - It never blocks. There is a dismiss control, and ignoring it entirely has
 *     no consequence anywhere in the system.
 *   - "Not yet" is a first-class answer sitting alongside "yes", not hidden
 *     behind it. If saying yes were the only way forward, people would say yes,
 *     and the record of what actually helped would be worthless.
 *   - Nothing is mandatory. Every text box and every reason chip can be skipped
 *     and the answer still counts.
 */

interface SuggestionCheckInProps {
  suggestion: LearningSuggestion;
  deferReasons: DeferReason[];
  onRespond: (
    action: SuggestionAction,
    opts: { note?: string; reason?: string },
  ) => Promise<boolean>;
  onDismiss: () => void;
}

type Stage =
  | "asking"
  | "applied"
  | "not_useful"
  | "deferring"
  | "saving"
  | "thanks"
  | "failed";

/** What we say back, per answer. Never scolding, never congratulating a lie. */
const THANKS: Record<string, string> = {
  completed: "Noted. We'll use that to choose the next one.",
  started: "Noted. The next one can be smaller.",
  not_started: "Noted. That is about timing, not a failure.",
  not_relevant: "Noted. We'll adjust what we send next.",
  applied: "Noted. That's what makes the next one better.",
  not_useful: "Fair. We'll send you a different kind next time.",
  deferred: "No problem. Try applying it today if you get a window.",
  dropped: "Dropped. You'll get a fresh one when you close today.",
};

export function SuggestionCheckIn({
  suggestion,
  deferReasons,
  onRespond,
  onDismiss,
}: SuggestionCheckInProps) {
  const [stage, setStage] = useState<Stage>("asking");
  const [note, setNote] = useState("");
  const [outcome, setOutcome] = useState<string>("deferred");

  // Record that the suggestion was genuinely put in front of somebody. The old
  // panel could not tell "ignored it" from "never saw it", which made every
  // usage number it might have produced meaningless. Fire and forget: failing
  // to log a view must never disturb the card.
  useEffect(() => {
    void ReportV7Service.getOpenSuggestion(false).catch(() => {});
  }, [suggestion.id]);

  const send = async (
    action: SuggestionAction,
    opts: { note?: string; reason?: string } = {},
  ) => {
    setStage("saving");
    const ok = await onRespond(action, opts);
    if (!ok) {
      setStage("failed");
      return;
    }
    setOutcome(action);
    setStage("thanks");
    // The card retires itself once the answer is in. Leaving it on screen for
    // the rest of the report would turn an answered question into clutter.
    window.setTimeout(onDismiss, 2600);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mx-4 shrink-0 rounded-2xl border border-primary/25 bg-base-100/80 p-4 shadow-sm backdrop-blur lg:mx-8"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/70">
          Last time we suggested
          {suggestion.deferCount > 0 && ` · asked ${suggestion.deferCount + 1}x`}
        </p>
      </div>

      {/* The same card the summary shows. Being asked "did you do it?" about a
          grey one-line label is easy to brush off; being asked about something
          that looks worth doing is not. */}
      <SuggestionCard suggestion={suggestion} className="mt-2" />

      <div className="mt-3">
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            {stage === "asking" && isChallenge(suggestion.kind) && (
              <motion.div
                key="challenge-outcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3"
              >
                <p className="mb-2 text-sm text-base-content/75">
                  How did this challenge go?
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => send("completed")}
                    className="btn btn-primary btn-xs"
                  >
                    Completed it
                  </button>
                  <button
                    type="button"
                    onClick={() => send("started")}
                    className="btn btn-outline btn-xs"
                  >
                    Started but didn&apos;t finish
                  </button>
                  <button
                    type="button"
                    onClick={() => send("not_started")}
                    className="btn btn-ghost btn-xs text-base-content/60"
                  >
                    Didn&apos;t get to it
                  </button>
                  <button
                    type="button"
                    onClick={() => send("not_relevant")}
                    className="btn btn-ghost btn-xs text-base-content/60"
                  >
                    Not relevant today
                  </button>
                </div>
                <p className="mt-2 text-xs text-base-content/45">
                  This changes future suggestions. Missing one never counts against you.
                </p>
              </motion.div>
            )}

            {stage === "asking" && !isChallenge(suggestion.kind) && (
              <motion.div
                key="material-feedback"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3"
              >
                <p className="mb-2 text-sm text-base-content/75">
                  Did you get to it?
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setStage("applied")}
                    className="btn btn-primary btn-xs"
                  >
                    Yes, I used it
                  </button>
                  <button
                    type="button"
                    onClick={() => setStage("deferring")}
                    className="btn btn-outline btn-xs"
                  >
                    Not yet
                  </button>
                  <button
                    type="button"
                    onClick={() => setStage("not_useful")}
                    className="btn btn-ghost btn-xs text-base-content/60"
                  >
                    It didn&apos;t help
                  </button>
                </div>
              </motion.div>
            )}

            {/* Applied: how did you use it. Optional. */}
            {stage === "applied" && (
              <Composer
                key="applied"
                question="How did you use it?"
                placeholder="I tried it on…"
                hint="Optional. Skipping still counts as applied."
                value={note}
                onChange={setNote}
                primaryLabel="Save"
                onPrimary={() => send("applied", { note })}
                onBack={() => setStage("asking")}
              />
            )}

            {/* Didn't help: we don't ask whether they applied it, we ask what
                was wrong with it. That answer is what steers the next pick. */}
            {stage === "not_useful" && (
              <Composer
                key="not_useful"
                question="What didn't work about it?"
                placeholder="It didn't fit because…"
                hint="Optional. This is how we stop sending you this kind."
                value={note}
                onChange={setNote}
                primaryLabel="Send"
                onPrimary={() => send("not_useful", { note })}
                onBack={() => setStage("asking")}
              />
            )}

            {/* Not yet: one tap on a reason, or none at all. */}
            {stage === "deferring" && (
              <motion.div
                key="deferring"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3"
              >
                <p className="mb-2 text-sm text-base-content/75">
                  May I know the reason?
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {deferReasons.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => send("deferred", { reason: r.id })}
                      className="rounded-full border border-base-300 bg-base-100 px-3 py-1 text-xs text-base-content/70 transition-colors hover:border-primary/50 hover:text-primary"
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => send("deferred", {})}
                    className="text-xs font-medium text-base-content/50 hover:text-base-content/80"
                  >
                    Rather not say
                  </button>
                  {/* The escape hatch. Without it, somebody who is never going
                      to do this one is stuck with it forever. */}
                  <button
                    type="button"
                    onClick={() => send("dropped", {})}
                    className="text-xs font-medium text-base-content/50 hover:text-error"
                  >
                    Drop it, not for me
                  </button>
                </div>
              </motion.div>
            )}

            {stage === "saving" && (
              <motion.p
                key="saving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 flex items-center gap-2 text-sm text-base-content/60"
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Saving
              </motion.p>
            )}

            {stage === "thanks" && (
              <motion.p
                key="thanks"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex items-center gap-2 text-sm font-medium text-success"
              >
                <Check className="h-4 w-4" aria-hidden />
                {THANKS[outcome] ?? "Noted."}
              </motion.p>
            )}

            {stage === "failed" && (
              <motion.div
                key="failed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 flex items-center gap-3"
              >
                <p className="text-sm text-error">That didn&apos;t save.</p>
                <button
                  type="button"
                  onClick={() => setStage("asking")}
                  className="btn btn-ghost btn-xs"
                >
                  Try again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Not now"
          title="Not now"
          className="shrink-0 rounded-md p-1 text-base-content/35 transition-colors hover:bg-base-200 hover:text-base-content/70"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </motion.div>
  );
}

/** Shared text box for the two answers that invite an explanation. */
function Composer({
  question,
  placeholder,
  hint,
  value,
  onChange,
  primaryLabel,
  onPrimary,
  onBack,
}: {
  question: string;
  placeholder: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  primaryLabel: string;
  onPrimary: () => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mt-3"
    >
      <p className="text-sm text-base-content/75">{question}</p>
      <textarea
        autoFocus
        rows={2}
        maxLength={2000}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full resize-none rounded-lg border border-base-300 bg-base-100 p-2.5 text-sm text-base-content outline-none placeholder:text-base-content/35 focus:border-primary"
      />
      <div className="mt-1.5 flex items-center justify-between gap-3">
        <span className="text-xs text-base-content/45">{hint}</span>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={onBack} className="btn btn-ghost btn-xs">
            Back
          </button>
          <button
            type="button"
            onClick={onPrimary}
            className="btn btn-primary btn-xs"
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
