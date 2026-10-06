"use client";

import React from "react";
import { motion } from "framer-motion";
import type { EngineState } from "@/lib/engine/tree-walker";

/**
 * Only these fields are read, so any state shape carrying them works — the
 * v7 engine passes its full EngineState; the v8 single-screen report passes
 * a plain object with just these.
 */
export type ReflectionRecapState = Pick<
  EngineState,
  | "constraint"
  | "navigation"
  | "framework"
  | "feeling"
  | "narrative"
  | "smoothDayNote"
  | "frameworkCommitment"
>;

interface ReflectionRecapProps {
  state: ReflectionRecapState;
}

/**
 * "Your reflection" — shows the user's own answers on the completion view.
 * DayCard above gives a compressed visual; this surfaces the textual content
 * (narrative, commitment) and the full macro→micro labels for each pick so
 * the user can re-read what they submitted alongside the AI feedback.
 */
export function ReflectionRecap({ state }: ReflectionRecapProps) {
  const { constraint, navigation, framework, feeling, narrative, smoothDayNote, frameworkCommitment } = state;

  const hasAnySelection = constraint || navigation || framework || feeling;
  const hasAnyText = narrative || smoothDayNote || frameworkCommitment;
  if (!hasAnySelection && !hasAnyText) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="flex w-full flex-col gap-4 rounded-2xl border border-base-200 bg-base-100 p-5"
    >
      <h3 className="text-sm font-semibold text-base-content/70">
        Your reflection
      </h3>

      {hasAnySelection && (
        <dl className="grid gap-2.5 text-sm">
          {constraint && (
            <SelectionRow
              label="What challenged you"
              macro={constraint.macroLabel}
              micro={constraint.microLabel}
            />
          )}
          {navigation && (
            <SelectionRow
              label="How you navigated"
              macro={navigation.macroLabel}
              micro={navigation.microLabel}
            />
          )}
          {framework && (
            <SelectionRow
              label="Framework you used"
              macro={framework.macroLabel}
              micro={framework.microLabel}
            />
          )}
          {feeling && (
            <SelectionRow
              label="How you felt"
              macro={feeling.macroLabel}
              micro={feeling.microLabel}
            />
          )}
        </dl>
      )}

      {narrative && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-base-content/40">
            In your words
          </p>
          <blockquote className="rounded-md border-l-4 border-primary/40 bg-primary/5 px-3 py-2 text-sm italic leading-relaxed text-base-content/75">
            {narrative}
          </blockquote>
        </div>
      )}

      {smoothDayNote && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-base-content/40">
            What made today smooth
          </p>
          <blockquote className="rounded-md border-l-4 border-success/40 bg-success/5 px-3 py-2 text-sm italic leading-relaxed text-base-content/75">
            {smoothDayNote}
          </blockquote>
        </div>
      )}

      {frameworkCommitment && (
        <div className="flex items-center gap-2 rounded-md bg-primary/5 px-3 py-2 text-sm">
          <span className="text-primary">{"→"}</span>
          <span className="text-base-content/65">Tomorrow you&apos;ll try:</span>
          <span className="font-medium text-primary">
            {frameworkCommitment.macroLabel}
          </span>
        </div>
      )}
    </motion.div>
  );
}

function SelectionRow({
  label,
  macro,
  micro,
}: {
  label: string;
  macro: string | null;
  micro: string | null;
}) {
  const sameMacroMicro = macro && micro && macro === micro;
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
      <dt className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-base-content/45 sm:w-40">
        {label}
      </dt>
      <dd className="text-base-content/80">
        {micro || macro}
        {macro && micro && !sameMacroMicro && (
          <span className="ml-1.5 text-xs text-base-content/45">
            ({macro})
          </span>
        )}
      </dd>
    </div>
  );
}
