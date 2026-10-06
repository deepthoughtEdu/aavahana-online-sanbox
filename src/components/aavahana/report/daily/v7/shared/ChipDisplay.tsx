"use client";

import React from "react";
import { motion } from "framer-motion";

interface ChipDisplayProps {
  macroLabel: string;
  microLabel: string;
  /** Stagger delay in ms for entrance animation */
  delay?: number;
}

export function ChipDisplay({ macroLabel, microLabel, delay = 0 }: ChipDisplayProps) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.7, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: delay / 1000,
        ease: [0.34, 1.1, 0.64, 1],
      }}
      className="badge badge-outline badge-lg gap-1 text-sm shadow-sm"
    >
      <span className="font-semibold">{macroLabel}</span>
      <span className="text-base-content/50">·</span>
      <span>{microLabel}</span>
    </motion.span>
  );
}
