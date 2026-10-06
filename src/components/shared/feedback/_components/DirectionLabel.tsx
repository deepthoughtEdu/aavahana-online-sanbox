import React from "react";
import { cn } from "@/utils";
import type { FeedbackDirectionKey } from "@/types/shared/feedback.types";
import { FEEDBACK_DIRECTION_CONFIGS } from "@/types/shared/feedback.types";

interface DirectionLabelProps {
  directionKey: FeedbackDirectionKey;
  className?: string;
}

export function DirectionLabel({ directionKey, className }: DirectionLabelProps) {
  const cfg = FEEDBACK_DIRECTION_CONFIGS[directionKey];
  const isAnon = cfg.isAnonymous;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
      isAnon
        ? "bg-base-200 dt-text-muted"
        : "bg-primary/10 text-primary",
      className
    )}>
      {cfg.fromLayer} → {cfg.toLayer}
      {isAnon && <span className="opacity-60">· anonymous</span>}
    </span>
  );
}
