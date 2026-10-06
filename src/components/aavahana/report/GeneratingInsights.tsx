"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { pickWaitingLine } from "./daily/v8/companion/care";

/**
 * The "AI is thinking" state. Instead of a dead spinner and a "reading your
 * key" line, we hold the moment with rotating insights on growth, reflection
 * and communication — so the wait feels like a beat of inspiration, not lag.
 *
 * Attributed quotes are real; the unattributed lines are original prompts (no
 * invented attributions).
 */
const INSIGHTS: { text: string; by: string | null }[] = [
  {
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    by: "Will Durant",
  },
  {
    text: "The single biggest problem in communication is the illusion that it has taken place.",
    by: "George Bernard Shaw",
  },
  {
    text: "Success is the sum of small efforts, repeated day in and day out.",
    by: "Robert Collier",
  },
  {
    text: "Between stimulus and response there is a space. In that space is our power to choose our response.",
    by: "Viktor Frankl",
  },
  {
    text: "The most important thing in communication is hearing what isn't said.",
    by: "Peter Drucker",
  },
  { text: "Feedback is the breakfast of champions.", by: "Ken Blanchard" },
  {
    text: "Knowing yourself is the beginning of all wisdom.",
    by: "Aristotle",
  },
  {
    text: "It's not the load that breaks you down, it's the way you carry it.",
    by: "Lou Holtz",
  },
  {
    text: "The leaders who rise fastest aren't the loudest in the room — they're the ones who listen, reflect, and adjust.",
    by: null,
  },
  {
    text: "Reflection turns experience into insight. Insight, repeated daily, turns into mastery.",
    by: null,
  },
];

interface GeneratingInsightsProps {
  /** A tighter layout for inline use (inside a panel). */
  compact?: boolean;
  /** Line under the quote. Defaults to a friendly waiting message. */
  caption?: string;
}

export function GeneratingInsights({ compact, caption }: GeneratingInsightsProps) {
  const [i, setI] = useState(0);
  // A caring line, picked once per wait, so every wait feels personally held.
  const [careLine] = useState(() => pickWaitingLine());
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % INSIGHTS.length), 4200);
    return () => clearInterval(t);
  }, []);
  const q = INSIGHTS[i];

  return (
    <div
      className={`flex w-full flex-col items-center gap-5 text-center ${
        compact ? "" : "max-w-xl"
      }`}
    >
      {/* Animated crest */}
      <div className="relative flex items-center justify-center">
        <motion.span
          className="absolute inline-flex rounded-full bg-primary/15"
          style={{ width: 64, height: 64 }}
          animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-success/25 text-primary"
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="h-6 w-6" />
        </motion.span>
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-base-content/70">
          Reading your reflection
          <span className="inline-flex gap-0.5">
            {[0, 1, 2].map((d) => (
              <motion.span
                key={d}
                className="h-1 w-1 rounded-full bg-base-content/50"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: d * 0.18 }}
              />
            ))}
          </span>
        </p>
        <p className="text-xs text-base-content/45">{caption ?? careLine}</p>
      </div>

      {/* Rotating insight */}
      <div
        className={`flex ${compact ? "min-h-[5.5rem]" : "min-h-[7rem]"} w-full items-center justify-center`}
      >
        <AnimatePresence mode="wait">
          <motion.blockquote
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-2"
          >
            <p
              className={`font-medium leading-relaxed text-base-content/85 ${
                compact ? "text-base" : "text-lg sm:text-xl"
              }`}
            >
              &ldquo;{q.text}&rdquo;
            </p>
            {q.by && (
              <cite className="text-xs font-medium not-italic text-base-content/45">
                — {q.by}
              </cite>
            )}
          </motion.blockquote>
        </AnimatePresence>
      </div>

      {/* Indeterminate shimmer */}
      <div className="h-1 w-40 overflow-hidden rounded-full bg-base-200">
        <motion.div
          className="h-full w-1/3 rounded-full bg-primary/60"
          animate={{ x: ["-140%", "340%"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
