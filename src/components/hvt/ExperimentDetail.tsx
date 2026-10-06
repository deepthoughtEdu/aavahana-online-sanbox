"use client";

import React from "react";
import type { HVTExperiment } from "@/types/shared/hvt.types";

const STATUS_CLASSES: Record<string, string> = {
  idea:       "badge badge-ghost",
  planned:    "badge badge-warning",
  running:    "badge badge-info",
  concluded:  "badge badge-success",
  cancelled:  "badge badge-error",
};

interface ExperimentDetailProps {
  experiment: HVTExperiment;
  readOnly?: boolean;
  viewerLanguage?: "scientific" | "plain";
  onStart?: () => void;
  onConclude?: () => void;
  onCancel?: () => void;
  onEdit?: () => void;
  onLinkIp?: () => void;
}

export function ExperimentDetail({
  experiment,
  readOnly,
  viewerLanguage = "scientific",
  onStart,
  onConclude,
  onCancel,
  onEdit,
  onLinkIp,
}: ExperimentDetailProps) {
  const plain = viewerLanguage === "plain";
  const badgeClass = STATUS_CLASSES[experiment.status] ?? STATUS_CLASSES.idea;
  const isConcluded = experiment.status === "concluded";
  const isCancelled = experiment.status === "cancelled";
  const isTerminal = isConcluded || isCancelled;
  const hasWinner = isConcluded && experiment.result?.winner && experiment.result.winner !== "inconclusive" && experiment.result.winner !== "cancelled";

  return (
    <div className="max-w-[720px]">
      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <div className="text-[11px] font-bold dt-text-dim tracking-wider uppercase">
            {experiment.programName}
            {experiment.sprintNumber ? ` · Sprint ${experiment.sprintNumber}` : ""}
            {experiment.cellRef ? ` · ${experiment.cellRef}` : ""}
          </div>
          <h2 className="text-2xl font-extrabold text-base-content mt-1.5 mb-0">
            {experiment.title}
          </h2>
        </div>
        <span className={`${badgeClass} badge-md`}>{experiment.status}</span>
      </div>

      {/* Hypothesis / What's Being Tested */}
      <Section title={plain ? "What's Being Tested" : "Hypothesis"}>
        <p className="text-sm dt-text-dim leading-relaxed m-0">
          {experiment.hypothesis}
        </p>
      </Section>

      {/* Success Case / What Success Looks Like */}
      <Section
        title={plain ? "What Success Looks Like" : "Success Case"}
        className="bg-success/10 border-success/30"
      >
        <p className="text-sm dt-text-dim leading-relaxed m-0">
          {experiment.successCase}
        </p>
      </Section>

      {/* Variants */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {(["A", "B"] as const).map((lbl) => {
          const v = lbl === "A" ? experiment.variantA : experiment.variantB;
          const isWinner = hasWinner && experiment.result?.winner === lbl;
          const variantLabel = plain
            ? lbl === "A" ? "Current Approach" : "New Approach"
            : `Variant ${lbl} — ${v.label}`;
          return (
            <div
              key={lbl}
              className={`px-4 py-3.5 rounded-xl border-2 ${
                isWinner ? "bg-success/10 border-success" : "bg-base-200 border-base-300"
              }`}
            >
              <div className="flex justify-between mb-2">
                <span className="text-[10px] font-extrabold dt-text-dim uppercase">{variantLabel}</span>
                {isWinner && (
                  <span className="text-[10px] font-extrabold text-success">
                    {plain ? "Adopted" : "WINNER"}
                  </span>
                )}
              </div>
              <div className="text-sm dt-text-dim leading-relaxed">{v.description}</div>
              {isConcluded && experiment.result && (
                <div className={`mt-2.5 px-2.5 py-1.5 rounded-md ${isWinner ? "bg-success/20" : "bg-base-100"}`}>
                  <div className="text-[10px] font-bold dt-text-dim uppercase mb-1">Outcome</div>
                  <div className="text-sm text-base-content">
                    {lbl === "A" ? experiment.result.variantAOutcome : experiment.result.variantBOutcome}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Result / What We Found */}
      {isConcluded && experiment.result && (
        <Section
          title={plain ? "What We Found" : "Result"}
          className="bg-info/10 border-info/30"
        >
          <div className="flex items-center gap-4">
            <div className="text-2xl font-extrabold text-info">{experiment.result.delta}</div>
            <div className="border-l border-info/30 pl-3.5">
              <div className="text-[11px] dt-text-dim">{experiment.result.significance}</div>
              <div className="text-sm font-bold text-base-content mt-1">
                {plain ? "Result" : "Winner"}:{" "}
                {experiment.result.winner === "inconclusive"
                  ? "Inconclusive"
                  : `${plain ? "" : "Variant "}${experiment.result.winner}`}
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Learning / What We Learned */}
      <Section
        title={plain ? (isTerminal ? "What We Learned" : "Learning") : (isTerminal ? "Documented Learning" : "Learning")}
        className={experiment.learning ? "bg-warning/10 border-warning/30" : undefined}
      >
        {experiment.learning ? (
          <p className="text-sm dt-text-dim leading-relaxed m-0">{experiment.learning}</p>
        ) : (
          <p className="text-xs dt-text-dim italic m-0">
            {experiment.status === "planned"
              ? "Learning documented after experiment runs."
              : "In progress — documented at close."}
          </p>
        )}
      </Section>

      {/* Search space celebration */}
      {isConcluded && experiment.result?.winner === "inconclusive" && (
        <div className="px-4 py-3 rounded-xl bg-warning/10 border border-warning/30 mb-4">
          <div className="text-sm font-bold text-warning">
            One less thing to wonder about — this result rules out a possibility, which is progress.
          </div>
          <div className="text-xs text-warning/80 mt-1">
            Every inconclusive result narrows the search space. The team is learning.
          </div>
        </div>
      )}

      {/* Tags */}
      {experiment.tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-4">
          {experiment.tags.map((tag) => (
            <span key={tag} className="text-[11px] px-2.5 py-0.5 rounded-full bg-base-200 dt-text-dim font-semibold">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Lifecycle Actions (L3 only) */}
      {!readOnly && !isTerminal && (
        <div className="flex gap-2 flex-wrap pt-4 border-t border-base-300">
          {onEdit && (
            <button onClick={onEdit} className="btn btn-sm btn-ghost">Edit</button>
          )}
          {experiment.status === "planned" && onStart && (
            <button onClick={onStart} className="btn btn-sm btn-primary">Start Experiment</button>
          )}
          {experiment.status === "running" && onConclude && (
            <button onClick={onConclude} className="btn btn-sm btn-success">Conclude</button>
          )}
          {!isConcluded && onCancel && (
            <button onClick={onCancel} className="btn btn-sm btn-error btn-outline">Cancel</button>
          )}
        </div>
      )}

      {/* IP linkage for concluded */}
      {isConcluded && hasWinner && !readOnly && onLinkIp && !experiment.linkedIpId && (
        <div className="mt-3 px-3.5 py-2.5 rounded-xl bg-base-200 border border-dashed border-primary">
          <div className="text-sm font-semibold text-primary mb-1.5">
            Winner identified — link this experiment to an IP item?
          </div>
          <button onClick={onLinkIp} className="btn btn-sm btn-primary">Link to IP</button>
        </div>
      )}

      {experiment.linkedIpId && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-success/10 text-sm font-semibold text-success">
          Linked to IP item: {experiment.linkedIpId}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-4 py-3 rounded-xl border mb-4 bg-base-200 border-base-300 ${className ?? ""}`}>
      <div className="text-[10px] font-extrabold dt-text-dim uppercase tracking-widest mb-2">
        {title}
      </div>
      {children}
    </div>
  );
}
