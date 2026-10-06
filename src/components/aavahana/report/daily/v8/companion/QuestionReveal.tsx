"use client";

import React from "react";
import { motion } from "framer-motion";

interface QuestionRevealProps {
  text: string;
  /** Fires once the last word has settled — parent reveals the answers then. */
  onRevealed?: () => void;
  /** Skip the animation (resumed/already-seen question) — render whole. */
  instant?: boolean;
  className?: string;
}

/**
 * The question, revealed as typography in motion: each word flies in from the
 * right, one after another in a fast stagger, so the sentence assembles itself
 * like it's being spoken. When the last word lands, `onRevealed` fires and the
 * parent floats the answers in beneath. Mount it with a `key` per question so
 * every new question re-runs the reveal.
 */
export function QuestionReveal({
  text,
  onRevealed,
  instant,
  className,
}: QuestionRevealProps) {
  const words = text.split(/\s+/).filter(Boolean);
  const stagger = 0.055;

  if (instant) {
    // Still notify the parent so answers appear without animation.
    return (
      <h2
        className={
          className ??
          "text-center text-2xl font-semibold leading-snug text-base-content sm:text-3xl"
        }
      >
        {text}
        <RevealPing onRevealed={onRevealed} />
      </h2>
    );
  }

  return (
    <h2
      aria-label={text}
      className={
        className ??
        "text-center text-2xl font-semibold leading-snug text-base-content sm:text-3xl"
      }
    >
      {words.map((w, i) => (
        <motion.span
          key={`${i}-${w}`}
          aria-hidden
          className="mr-[0.28em] inline-block"
          initial={{ opacity: 0, x: 26 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            delay: i * stagger,
            duration: 0.34,
            ease: [0.16, 1, 0.3, 1],
          }}
          onAnimationComplete={
            i === words.length - 1 ? onRevealed : undefined
          }
        >
          {w}
        </motion.span>
      ))}
    </h2>
  );
}

/** Fires onRevealed on mount (used by the instant path). */
function RevealPing({ onRevealed }: { onRevealed?: () => void }) {
  React.useEffect(() => {
    onRevealed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
