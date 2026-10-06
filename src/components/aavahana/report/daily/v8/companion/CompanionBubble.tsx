"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sprout } from "lucide-react";

interface CompanionBubbleProps {
  text: string;
  /** Only the newest line animates (thinks → types); older lines render whole. */
  animate: boolean;
  /** Fired once the line has fully typed out — parent reveals the input then. */
  onDone?: () => void;
}

/**
 * The guide's voice. A fresh line first shows a "thinking" pause (three pulsing
 * dots), then streams character by character with a blinking caret — the small
 * touches that make it read as someone typing to you, not a label appearing.
 * Already-seen lines (animate=false) render instantly and stay put, so the
 * transcript above the fold behaves like a real chat history.
 */
export function CompanionBubble({ text, animate, onDone }: CompanionBubbleProps) {
  const [phase, setPhase] = useState<"thinking" | "typing" | "done">(
    animate ? "thinking" : "done",
  );
  const [shown, setShown] = useState(animate ? 0 : text.length);
  const doneRef = useRef(false);

  // Thinking pause → typing.
  useEffect(() => {
    if (!animate) return;
    const t = setTimeout(() => setPhase("typing"), 480);
    return () => clearTimeout(t);
  }, [animate]);

  // Stream characters while typing.
  useEffect(() => {
    if (phase !== "typing") return;
    if (shown >= text.length) {
      setPhase("done");
      return;
    }
    // Slightly faster on long lines so it never drags.
    const step = text.length > 90 ? 2 : 1;
    const t = setTimeout(() => setShown((n) => Math.min(text.length, n + step)), 16);
    return () => clearTimeout(t);
  }, [phase, shown, text.length]);

  // Signal completion exactly once.
  useEffect(() => {
    if (phase === "done" && !doneRef.current) {
      doneRef.current = true;
      onDone?.();
    }
  }, [phase, onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2.5"
    >
      <motion.span
        aria-hidden
        animate={
          phase === "thinking"
            ? { rotate: [0, -6, 6, 0] }
            : { y: [0, -2, 0] }
        }
        transition={{ duration: phase === "thinking" ? 0.9 : 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-success/25 to-primary/20 text-success shadow-sm"
      >
        <Sprout className="h-5 w-5" />
      </motion.span>

      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-base-200/70 px-4 py-2.5 text-[15px] leading-relaxed text-base-content">
        {phase === "thinking" ? (
          <span className="inline-flex items-center gap-1 py-1" aria-label="typing">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-base-content/40"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
              />
            ))}
          </span>
        ) : (
          <>
            {text.slice(0, shown)}
            {phase === "typing" && (
              <motion.span
                className="ml-0.5 inline-block h-4 w-0.5 -translate-y-0.5 bg-base-content/50 align-middle"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              />
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

/** The user's answer, shown as a chat reply on the right. */
export function UserReply({
  text,
  onEdit,
}: {
  text: string;
  onEdit?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-end"
    >
      <button
        type="button"
        onClick={onEdit}
        disabled={!onEdit}
        className="group max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2 text-left text-[15px] leading-relaxed text-primary-content shadow-sm disabled:cursor-default"
      >
        {text}
        {onEdit && (
          <span className="ml-2 text-[11px] text-primary-content/60 opacity-0 transition-opacity group-hover:opacity-100">
            edit
          </span>
        )}
      </button>
    </motion.div>
  );
}
