"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils";
import { Scene } from "./scenes";
import { TellMeMore } from "./TellMeMore";
import {
  readMemory,
  rememberPicks,
  resolveVariant,
  type RecognitionCtx,
  type RecognitionVariant,
  type ToneRegister,
} from "./variants";

/**
 * The recognition screen.
 *
 * WHY IT IS AN OVERLAY AND NOT A PAGE
 * v8 deliberately dropped the old post-submit interstitial ("straight into the
 * report, one less click"). Putting recognition back as a gate would undo that:
 * a screen you have to dismiss to reach your own data is a toll booth, and a
 * toll booth is exactly the feeling this is supposed to cure. So the summary
 * mounts underneath immediately and this plays on top of it, dismisses itself,
 * and can be tapped through at any moment. The reward costs zero clicks.
 *
 * It renders only on a fresh submit. Re-opening a day you already closed shows
 * the summary alone — the celebration is for the act of finishing, not for
 * navigating to a URL.
 */

interface RecognitionOverlayProps {
  ctx: RecognitionCtx;
  onDismiss: () => void;
  onSaveHighlight: (
    text: string,
    promptId: string,
    question: string,
  ) => Promise<boolean>;
}

/**
 * The colour tint only. Legibility is owned by the opaque scrim underneath it,
 * not by this gradient.
 *
 * The first version carried both jobs in one layer, and the ends of the gradient
 * were nearly transparent, so the summary's own headings showed through at full
 * contrast exactly where the celebration headline sat. Two overlapping headlines
 * are unreadable no matter how good either one is. Separating the two layers
 * means the page is evenly covered everywhere and the tint can stay subtle.
 */
const WASH: Record<ToneRegister, string> = {
  triumph: "from-warning/30 via-transparent to-success/20",
  steady: "from-primary/18 via-transparent to-transparent",
  tender: "from-info/22 via-transparent to-transparent",
  milestone: "from-primary/30 via-transparent to-warning/25",
};

export function RecognitionOverlay({
  ctx,
  onDismiss,
  onSaveHighlight,
}: RecognitionOverlayProps) {
  const [variant, setVariant] = useState<RecognitionVariant | null>(null);
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(true);
  const [showHint, setShowHint] = useState(false);
  /** Set once the person interacts. Cancels auto-dismiss for good. */
  const engagedRef = useRef(false);

  // Resolve the variant on the client. Reading localStorage or drawing a
  // seeded pick during render would be a hydration mismatch.
  useEffect(() => {
    setReduced(
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
    );
    const v = resolveVariant(ctx, readMemory());
    setVariant(v);
    rememberPicks({ scene: v.scene, copy: v.copy.id, layout: v.layout });
    // ctx is rebuilt on every render of the parent; the date is what identifies
    // the day, and re-resolving mid-celebration would swap the scene underfoot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.dateISO]);

  const close = useCallback(() => {
    setVisible(false);
    // Let the exit transition finish before unmounting upstream.
    window.setTimeout(onDismiss, 260);
  }, [onDismiss]);

  // Auto-dismiss, unless they engaged with the prompt.
  useEffect(() => {
    if (!variant) return;
    const hint = window.setTimeout(() => setShowHint(true), 1300);
    const timer = window.setTimeout(() => {
      if (!engagedRef.current) close();
    }, variant.dwellMs);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(hint);
    };
  }, [variant, close]);

  // Esc always closes, engaged or not.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const engage = useCallback(() => {
    engagedRef.current = true;
    setShowHint(false);
  }, []);

  if (!variant) return null;

  const { layout, tone, scene, intensity, copy, prompt, milestoneLabel } = variant;

  const body = (
    <div
      // Clicks inside the copy block must not dismiss — the composer lives here.
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "flex flex-col gap-4",
        layout === "center" && "items-center text-center",
        layout === "rise" && "items-start text-left",
        layout === "banner" && "items-start text-left",
      )}
    >
      {milestoneLabel && (
        <motion.span
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-content"
        >
          Milestone
        </motion.span>
      )}

      <motion.h2
        initial={reduced ? { opacity: 1 } : { opacity: 0, y: 14, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.1 }}
        className={cn(
          "font-semibold tracking-tight text-base-content",
          layout === "banner"
            ? "text-2xl sm:text-3xl"
            : "text-3xl sm:text-4xl lg:text-5xl",
        )}
      >
        {copy.headline}
      </motion.h2>

      <motion.p
        initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.26 }}
        className={cn(
          "max-w-xl text-base-content/70",
          layout === "banner" ? "text-sm" : "text-base sm:text-lg",
        )}
      >
        {copy.subline}
      </motion.p>

      <div className={cn(layout === "center" && "flex justify-center")}>
        <TellMeMore
          prompt={prompt}
          onEngage={engage}
          onSave={onSaveHighlight}
          compact={layout === "banner"}
        />
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="recognition"
          role="status"
          aria-live="polite"
          aria-label={`${copy.headline} ${copy.subline}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.26 }}
          onClick={close}
          // absolute, not fixed: this lives inside the report's own content
          // area so it never covers the app shell's header or sidebar.
          className="absolute inset-0 z-30 cursor-pointer overflow-hidden backdrop-blur-xl"
        >
          {/* Scrim first, tint second. The summary underneath stays visible as
              a soft shape rather than as competing text: still there, still
              one tap away, no longer arguing with the headline. */}
          <div className="absolute inset-0 bg-base-100/92" aria-hidden />
          <div
            className={cn("absolute inset-0 bg-gradient-to-br", WASH[tone])}
            aria-hidden
          />

          {/* The scene layer. Never interactive, never the only carrier of meaning. */}
          <div
            className={cn(
              "pointer-events-none absolute",
              layout === "center" && "inset-0",
              layout === "rise" && "inset-x-0 bottom-0 top-0",
              layout === "banner" && "inset-y-0 right-0 w-1/2 lg:w-2/5",
            )}
            aria-hidden
          >
            <Scene id={scene} intensity={intensity} reduced={reduced} />
          </div>

          {/* The copy layer. */}
          <div
            className={cn(
              "relative flex h-full w-full px-6 lg:px-12",
              layout === "center" && "items-center justify-center",
              layout === "rise" && "items-end justify-start pb-16 lg:pb-24",
              layout === "banner" && "items-start justify-start pt-10 lg:pt-16",
            )}
          >
            {body}
          </div>

          <AnimatePresence>
            {showHint && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.55 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-x-0 bottom-5 text-center text-xs text-base-content/60"
              >
                Tap anywhere for your report
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
