"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, MessageSquarePlus } from "lucide-react";
import { cn } from "@/utils";
import type { PromptVariant } from "./variants";

/**
 * The optional deeper-recognition hook.
 *
 * Three rules it is built around:
 *
 *  1. IT CANNOT COST ANYTHING. The report is already submitted and locked in
 *     before this appears. Ignoring it is free, and the copy never implies
 *     otherwise ("if you want", never "don't forget to").
 *
 *  2. THE QUESTION IS SPECIFIC. A generic "anything to add?" gets nothing. The
 *     prompt names the constraint they logged or the task that finally moved,
 *     which is the signal that something actually read what they wrote.
 *
 *  3. IT SAYS WHERE IT GOES, BEFORE THEY WRITE. Recognition that vanishes into
 *     a database is worse than none, and a person deserves to know their
 *     supervisor will read this before they decide how candid to be.
 */

interface TellMeMoreProps {
  prompt: PromptVariant;
  /** Fires when the composer opens — the overlay uses it to cancel auto-dismiss. */
  onEngage: () => void;
  /** Persist. Resolves true on success. */
  onSave: (text: string, promptId: string, question: string) => Promise<boolean>;
  compact?: boolean;
}

type Stage = "invite" | "composing" | "saving" | "saved" | "failed";

const MAX_CHARS = 2000;

export function TellMeMore({
  prompt,
  onEngage,
  onSave,
  compact = false,
}: TellMeMoreProps) {
  const [stage, setStage] = useState<Stage>("invite");
  const [text, setText] = useState("");

  const open = () => {
    setStage("composing");
    onEngage();
  };

  const save = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setStage("saving");
    const ok = await onSave(trimmed, prompt.id, prompt.question);
    setStage(ok ? "saved" : "failed");
  };

  return (
    <div className={cn("w-full", compact ? "max-w-md" : "max-w-lg")}>
      <AnimatePresence mode="wait" initial={false}>
        {stage === "invite" && (
          <motion.button
            key="invite"
            type="button"
            onClick={open}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ delay: 0.22, duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-100/80 px-4 py-2 text-sm font-medium text-base-content/75 shadow-sm backdrop-blur transition-colors hover:border-primary/50 hover:text-primary"
          >
            <MessageSquarePlus className="h-4 w-4" aria-hidden />
            <span>{prompt.invite}</span>
          </motion.button>
        )}

        {(stage === "composing" || stage === "saving" || stage === "failed") && (
          <motion.div
            key="composing"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="rounded-2xl border border-base-300 bg-base-100/95 p-4 text-left shadow-lg backdrop-blur"
          >
            <p className="text-sm font-medium text-base-content">
              {prompt.question}
            </p>
            <textarea
              autoFocus
              value={text}
              maxLength={MAX_CHARS}
              onChange={(e) => setText(e.target.value)}
              placeholder={prompt.placeholder}
              rows={4}
              disabled={stage === "saving"}
              className="mt-3 w-full resize-none rounded-lg border border-base-300 bg-base-100 p-3 text-sm text-base-content outline-none placeholder:text-base-content/35 focus:border-primary"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-xs text-base-content/50">
                Your supervisor sees this on your week. Nothing here is scored.
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStage("invite")}
                  disabled={stage === "saving"}
                  className="btn btn-ghost btn-xs"
                >
                  Not now
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={!text.trim() || stage === "saving"}
                  className="btn btn-primary btn-xs gap-1.5"
                >
                  {stage === "saving" && (
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                  )}
                  Add it
                </button>
              </div>
            </div>
            {stage === "failed" && (
              <p className="mt-2 text-xs text-error">
                That didn&apos;t save. Your report is safe — try adding this again.
              </p>
            )}
          </motion.div>
        )}

        {stage === "saved" && (
          <motion.div
            key="saved"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 20 }}
            className="inline-flex items-center gap-2 rounded-full border border-success/40 bg-success/10 px-4 py-2 text-sm font-medium text-success"
          >
            <Check className="h-4 w-4" aria-hidden />
            <span>Added. Your supervisor will see it on your week.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
