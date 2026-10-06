import React from "react";
import { cn } from "@/utils";
import { getScoreColor } from "@/utils/shared/design.utils";

interface CompositeScoreBadgeProps {
  score: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "giver" | "display";
}

export function CompositeScoreBadge({
  score,
  label = "Overall Signal",
  size = "md",
  variant = "display",
}: CompositeScoreBadgeProps) {
  const { text, bg } = getScoreColor(score);
  const isGiver = variant === "giver";

  return (
    <div className={cn("rounded-xl text-center", isGiver ? "bg-base-200" : bg, size === "sm" ? "p-3" : "p-4")}>
      <p className="text-xs dt-text-muted mb-1">{label}</p>
      <p className={cn("font-bold", isGiver ? "text-black" : text, size === "lg" ? "text-5xl" : size === "md" ? "text-4xl" : "text-2xl")}>
        {score > 0 ? score.toFixed(1) : "–"}
      </p>
      <p className="text-xs text-[var(--dt-textDim)] mt-1">Weighted across dimensions</p>
    </div>
  );
}
