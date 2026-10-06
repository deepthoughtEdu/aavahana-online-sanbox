"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { pickWelcomeLine } from "../companion/care";

interface CinematicIntroProps {
  name: string;
  hour: number; // 0–23 local, for the greeting word
  streakLabel?: string | null;
  onStart: () => void;
}

/**
 * The arrival moment — full-bleed, no card, no shadow. Just a big personal
 * greeting floating over the particle field. You're greeted, not handed a form.
 * Tap anywhere (or the button) to begin.
 */
export function CinematicIntro({
  name,
  hour,
  streakLabel,
  onStart,
}: CinematicIntroProps) {
  const timeWord =
    hour < 5
      ? "Still up"
      : hour < 12
        ? "Good morning"
        : hour < 17
          ? "Good afternoon"
          : "Good evening";

  // Picked once per arrival, so each visit greets with something different.
  const [careLine] = useState(() => pickWelcomeLine(hour, Boolean(streakLabel)));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(8px)" }}
      transition={{ duration: 0.5 }}
      onClick={onStart}
      className="absolute inset-0 z-30 flex cursor-pointer flex-col items-center justify-center gap-7 px-8 text-center"
    >
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-sm font-medium uppercase tracking-[0.3em] text-base-content/45"
      >
        {timeWord}
      </motion.p>

      <div className="flex flex-col gap-3">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, type: "spring", stiffness: 140, damping: 20 }}
          className="text-4xl font-bold leading-tight text-base-content sm:text-6xl"
        >
          You&apos;re back{name ? `, ${name}` : ""}.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mx-auto max-w-xl text-lg leading-relaxed text-base-content/60 sm:text-xl"
        >
          {careLine}
        </motion.p>
      </div>

      {streakLabel && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.95 }}
          className="text-sm font-medium text-base-content/55"
        >
          🔥 {streakLabel}, keep it going
        </motion.span>
      )}

      <motion.button
        type="button"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={(e) => {
          e.stopPropagation();
          onStart();
        }}
        className="btn btn-primary btn-wide rounded-full"
      >
        Let&apos;s check in →
      </motion.button>

      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0] }}
        transition={{ delay: 1.6, duration: 2.4, repeat: Infinity }}
        className="text-xs text-base-content/40"
      >
        tap anywhere to begin
      </motion.span>
    </motion.div>
  );
}
