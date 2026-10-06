"use client";

import React from "react";
import { ignoreTextSelection } from "@/utils/shared/selection.utils";
import type { MyIdeasListItem, ExperimentIdea, IdeaStatus } from "@/types/shared/hvt.types";

const STATUS_CLASSES: Record<IdeaStatus, { badge: string; label: string; note: string }> = {
  submitted: { badge: "badge badge-warning",  label: "Pending Review",          note: "Pending Review — your TPM will see this. You'll be notified when it's reviewed." },
  accepted:  { badge: "badge badge-success",  label: "Accepted",                note: "Accepted — your idea is being shaped into an experiment." },
  rejected:  { badge: "badge badge-ghost",    label: "Reviewed",                note: "Reviewed — not picked up this cycle." },
  converted: { badge: "badge badge-info",     label: "Became an Experiment",    note: "Your idea became an experiment." },
};

interface IdeaCardProps {
  idea: MyIdeasListItem | ExperimentIdea;
  onClick?: () => void;
  showReviewNote?: boolean;
}

export function IdeaCard({ idea, onClick, showReviewNote: _showReviewNote }: IdeaCardProps) {
  const s = STATUS_CLASSES[idea.status];

  return (
    <div
      onClick={onClick ? ignoreTextSelection(onClick) : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => { if (onClick && e.key === "Enter") onClick(); }}
      className={`px-4 py-3.5 rounded-xl border border-base-300 bg-base-100 ${onClick ? "cursor-pointer hover:shadow-sm transition-shadow" : ""}`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <div className="text-[10px] font-bold dt-text-dim tracking-wider uppercase">
            {idea.programName}
          </div>
          <div className="text-base font-bold text-base-content mt-1">
            {idea.title}
          </div>
        </div>
        <span className={`${s.badge} badge-sm shrink-0`}>{s.label}</span>
      </div>

      {"submittedByName" in idea && (
        <div className="text-xs dt-text-dim mt-1.5">
          by {idea.submittedByName}
        </div>
      )}

      {/* Contextual status note */}
      <div className="text-xs dt-text-dim mt-2 leading-relaxed">
        {s.note}
        {idea.status === "converted" && idea.convertedToExperimentId && (
          <span className="text-primary font-semibold ml-1">View experiment →</span>
        )}
      </div>
    </div>
  );
}

