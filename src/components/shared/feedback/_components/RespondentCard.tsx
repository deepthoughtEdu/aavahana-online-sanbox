"use client";

import React from "react";
import { cn } from "@/utils";
import type { FeedbackTarget } from "@/types/shared/feedback.types";

interface RespondentCardProps {
  target: FeedbackTarget;
  isSelected: boolean;
  onSelect(): void;
}

export function RespondentCard({ target, isSelected, onSelect }: RespondentCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors",
        isSelected
          ? "border-primary bg-primary/10"
          : "border-base-300 bg-base-200 hover:bg-[var(--dt-tealDim)]"
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-base-300 flex items-center justify-center text-sm font-bold dt-text-muted">
        {target.avatarUrl
          /* eslint-disable-next-line @next/next/no-img-element */
          ? <img src={target.avatarUrl} alt={target.name ?? ""} className="w-10 h-10 rounded-full object-cover" />
          : (target.name?.charAt(0) || "?").toUpperCase()
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-black truncate">{target.name || "Unnamed"}</p>
        <p className="text-xs dt-text-muted truncate">{target.role}</p>
        {target.lastFeedbackAt && (
          <p className="text-xs text-[var(--dt-textDim)]">Last: {target.lastFeedbackAt}</p>
        )}
      </div>

      {/* Period badge */}
      {target.submittedThisPeriod ? (
        <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--dt-greenDim)] text-success">
          Done
        </span>
      ) : (
        <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--dt-redDim)] text-error">
          Pending
        </span>
      )}
    </button>
  );
}
