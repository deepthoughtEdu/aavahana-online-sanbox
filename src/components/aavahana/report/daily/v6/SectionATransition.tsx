"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils";
import { formatMins } from "@/types/aavahana/report-v5.types";
import type { PlannedDeliverable, UnplannedDeliverable } from "./data/types";
import { CartographerTable } from "./illustrations/CartographerTable";

interface SectionATransitionProps {
  deliverables: PlannedDeliverable[];
  unplanned: UnplannedDeliverable[];
  onContinue: () => void;
}

// ── Critical Path Map (simplified — 200px height) ──

function CriticalPathMap({
  deliverables,
}: {
  deliverables: PlannedDeliverable[];
}) {
  const cpItem = deliverables.find((d) => d.isCriticalPath);
  if (!cpItem) return null;

  const svgW = 380;
  const svgH = 200;
  const straitY = svgH * 0.5;
  const straitGap = 22;
  const straitOpen = cpItem.status === "done";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden rounded-xl border border-base-300"
    >
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="w-full"
        role="img"
        aria-label={`Critical path: ${cpItem.label}`}
      >
        <defs>
          <pattern id="water-s" width="20" height="8" patternUnits="userSpaceOnUse">
            <path d="M0 4 Q5 0, 10 4 T20 4" fill="none" className="stroke-info/15" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Ocean */}
        <rect x="0" y="0" width={svgW} height={svgH} className="fill-base-300" />
        <rect x="0" y="0" width={svgW} height={svgH} fill="url(#water-s)" />

        {/* Upper landmass */}
        <path
          d={`M 0,0 L ${svgW},0 L ${svgW},${straitY - straitGap - 8}
              Q ${svgW * 0.7},${straitY - straitGap + 4} ${svgW * 0.5},${straitY - straitGap - 6}
              Q ${svgW * 0.3},${straitY - straitGap + 6} 0,${straitY - straitGap - 4} Z`}
          className="fill-success/20"
        />

        {/* Lower landmass */}
        <path
          d={`M 0,${straitY + straitGap + 4}
              Q ${svgW * 0.3},${straitY + straitGap - 6} ${svgW * 0.5},${straitY + straitGap + 8}
              Q ${svgW * 0.7},${straitY + straitGap - 4} ${svgW},${straitY + straitGap + 6}
              L ${svgW},${svgH} L 0,${svgH} Z`}
          className="fill-success/20"
        />

        {/* Strait label */}
        <text
          x={svgW * 0.5} y={straitY - 4}
          textAnchor="middle" fontSize="8" fontWeight="bold"
          className="fill-primary"
        >
          ★ {cpItem.label.length > 22 ? cpItem.label.slice(0, 20) + ".." : cpItem.label}
        </text>
        <text
          x={svgW * 0.5} y={straitY + 8}
          textAnchor="middle" fontSize="7"
          className="fill-base-content/40"
        >
          {(cpItem.status ?? "not done").replace("_", " ")} · {formatMins(cpItem.actualMins)}/{formatMins(cpItem.estimateMins)}
        </text>

        {/* Ship */}
        <motion.g
          initial={{ x: -20 }}
          animate={{ x: straitOpen ? svgW * 0.8 : svgW * 0.3 }}
          transition={{ delay: 0.5, duration: straitOpen ? 2 : 1, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <path
            d={`M 0,${straitY + 3} L 4,${straitY + 6} L 20,${straitY + 6} L 24,${straitY + 3} Z`}
            className="fill-warning/60"
          />
          <line x1={12} y1={straitY + 3} x2={12} y2={straitY - 8} className="stroke-base-content/30" strokeWidth="1" />
          <path
            d={`M 12,${straitY - 8} L 20,${straitY - 2} L 12,${straitY + 1} Z`}
            className="fill-base-100/80"
          />
        </motion.g>

        {/* Blocked indicator */}
        {cpItem.status !== "done" && cpItem.status !== "partial" && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            <line
              x1={svgW * 0.46} y1={straitY - straitGap + 3}
              x2={svgW * 0.46} y2={straitY + straitGap - 3}
              className="stroke-error/40" strokeWidth="1.5" strokeDasharray="3 2"
            />
          </motion.g>
        )}
      </svg>
    </motion.div>
  );
}

// ── Main composite ──

export function SectionATransition({
  deliverables,
  unplanned,
  onContinue,
}: SectionATransitionProps) {
  const plannedMins = deliverables.reduce((s, d) => s + d.estimateMins, 0);
  const actualMins = deliverables.reduce((s, d) => s + d.actualMins, 0);
  const unplannedMins = unplanned.reduce((s, u) => s + u.minutesTaken, 0);
  const totalActual = actualMins + unplannedMins;

  const doneCount = deliverables.filter((d) => d.status === "done").length;
  const partialCount = deliverables.filter((d) => d.status === "partial").length;
  const notDoneCount = deliverables.filter(
    (d) => d.status === "not_done" || d.status === null,
  ).length;
  const hasCp = deliverables.some((d) => d.isCriticalPath);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -12 }}
      className="flex flex-col items-center gap-5 py-4"
    >
      {/* Stamped cartographer's table — the finished artifact */}
      <CartographerTable
        deliverables={deliverables}
        unplanned={unplanned}
        phase="stamped"
        stepsCompleted={99}
      />

      {/* Compact summary line */}
      <p className="text-center text-sm text-base-content/50">
        {doneCount > 0 && <span className="text-success">{doneCount} done</span>}
        {doneCount > 0 && (partialCount > 0 || notDoneCount > 0) && <span> · </span>}
        {partialCount > 0 && <span className="text-warning">{partialCount} partial</span>}
        {partialCount > 0 && notDoneCount > 0 && <span> · </span>}
        {notDoneCount > 0 && <span>{notDoneCount} pending</span>}
        <span className="mx-2 text-base-content/20">|</span>
        <span>Plan {formatMins(plannedMins)}</span>
        <span className="text-base-content/30"> → </span>
        <span className={cn(
          "font-semibold",
          totalActual > plannedMins ? "text-warning" : "text-success",
        )}>
          {formatMins(totalActual)}
        </span>
      </p>

      {/* Critical path map — only if CP exists */}
      {hasCp && <CriticalPathMap deliverables={deliverables} />}

      <motion.button
        type="button"
        onClick={onContinue}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        whileTap={{ scale: 0.97 }}
        className="btn btn-primary btn-sm"
      >
        Continue
      </motion.button>
    </motion.div>
  );
}
