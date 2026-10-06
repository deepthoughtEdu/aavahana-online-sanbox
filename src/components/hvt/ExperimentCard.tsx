"use client";

import React from "react";
import { ignoreTextSelection } from "@/utils/shared/selection.utils";
import type { HVTExperiment } from "@/types/shared/hvt.types";

const STATUS_CLASSES: Record<string, { badge: string; label: string }> = {
  idea:       { badge: "badge badge-ghost",   label: "Idea" },
  planned:    { badge: "badge badge-warning",  label: "Planned" },
  running:    { badge: "badge badge-info",     label: "Running" },
  concluded:  { badge: "badge badge-success",  label: "Concluded" },
  cancelled:  { badge: "badge badge-error",    label: "Cancelled" },
};

interface ExperimentCardProps {
  experiment: HVTExperiment;
  onClick?: (experiment: HVTExperiment) => void;
  compact?: boolean;
}

export function ExperimentCard({ experiment, onClick, compact }: ExperimentCardProps) {
  const s = STATUS_CLASSES[experiment.status] ?? STATUS_CLASSES.idea;
  const isConcluded = experiment.status === "concluded";
  const hasWinner = isConcluded && experiment.result?.winner && experiment.result.winner !== "inconclusive";

  return (
    <div
      onClick={ignoreTextSelection(() => onClick?.(experiment))}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => { if (onClick && e.key === "Enter") onClick(experiment); }}
      className={`rounded-xl border border-base-300 bg-base-100 ${compact ? "px-3.5 py-3" : "px-4 py-4"} ${onClick ? "cursor-pointer hover:shadow-sm transition-shadow" : ""}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <div className="text-[10px] font-bold dt-text-dim tracking-wider uppercase">
            {experiment.programName}{experiment.sprintNumber ? ` · Sprint ${experiment.sprintNumber}` : ""}
          </div>
          <div className={`${compact ? "text-sm" : "text-base"} font-bold text-base-content mt-1`}>
            {experiment.title}
          </div>
        </div>
        <span className={`${s.badge} badge-sm shrink-0`}>{s.label}</span>
      </div>

      {/* Hypothesis */}
      {!compact && (
        <div className="text-sm dt-text-dim leading-relaxed mt-2.5">
          {experiment.hypothesis}
        </div>
      )}

      {/* Variants summary */}
      {!compact && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          {(["A", "B"] as const).map((lbl) => {
            const v = lbl === "A" ? experiment.variantA : experiment.variantB;
            const isWinner = hasWinner && experiment.result?.winner === lbl;
            return (
              <div
                key={lbl}
                className={`px-2.5 py-2 rounded-lg border ${
                  isWinner
                    ? "bg-success/10 border-success/30"
                    : "bg-base-200 border-base-300"
                }`}
              >
                <div className="text-[10px] font-bold dt-text-dim uppercase">
                  Variant {lbl} — {v.label}
                  {isWinner && <span className="text-success ml-1.5">Adopted</span>}
                </div>
                <div className="text-xs dt-text-dim mt-1">{v.description}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Result delta for concluded */}
      {isConcluded && experiment.result && (
        <div className="flex items-center gap-3 mt-2.5 px-3 py-2 rounded-lg bg-info/10">
          <span className="text-base font-extrabold text-info">{experiment.result.delta}</span>
          <span className="text-[11px] dt-text-dim">{experiment.result.significance}</span>
        </div>
      )}

      {/* Tags */}
      {!compact && experiment.tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mt-2.5">
          {experiment.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-base-200 dt-text-dim font-semibold">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Search space celebration for inconclusive */}
      {isConcluded && experiment.result?.winner === "inconclusive" && (
        <div className="mt-2.5 px-2.5 py-1.5 rounded-md bg-warning/10 text-[11px] text-warning font-semibold">
          One less thing to wonder about — this result rules out a possibility, which is progress
        </div>
      )}
    </div>
  );
}
