"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useBlockList } from "@/lib/hooks/hcd/use-block";
import { ScenarioChallenge } from "@/components/hcd/ScenarioChallenge";
import type { BlockListItem } from "@/lib/services/hcd/block.service";

// Domain label per framework. Unknown frameworks fall back gracefully, so new
// ones drop in with zero config.
function domainFor(b: BlockListItem): string {
  const k = b.frameworkKey.toLowerCase();
  if (k.includes("aidca")) return "Marketing & Sales";
  if (k.includes("board")) return "Leadership & Mindset";
  return "Core Skills";
}

export function SkillPath() {
  const { data: blocks, isLoading } = useBlockList();
  const [active, setActive] = useState<BlockListItem | null>(null);
  const qc = useQueryClient();

  // Inside a framework: run the scenario quiz.
  if (active) {
    return (
      <ScenarioChallenge
        blockId={active.id}
        frameworkName={active.frameworkName}
        frameworkKey={active.frameworkKey}
        onComplete={() => {
          // Refresh the progression strip so a finished run reflects immediately.
          qc.invalidateQueries({ queryKey: ["hcd", "progress"] });
        }}
        onBack={() => setActive(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-sm" />
      </div>
    );
  }

  if (!blocks?.length) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {blocks.map((b) => (
        <button
          key={b.id}
          onClick={() => setActive(b)}
          className="text-left rounded-2xl border border-base-300 bg-base-100 p-5 hover:border-primary/40 transition-colors"
        >
          <div className="text-[10px] font-bold uppercase tracking-wide dt-text-dim">
            {domainFor(b)}
          </div>
          <div className="font-semibold mt-1">{b.frameworkName}</div>
          <div className="text-sm font-bold text-primary mt-3">▶ Start</div>
        </button>
      ))}
    </div>
  );
}
