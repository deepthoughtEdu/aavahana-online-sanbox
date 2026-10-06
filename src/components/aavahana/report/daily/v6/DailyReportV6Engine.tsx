"use client";

import React, { useEffect, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { Provider } from "jotai";
import { ConversationRenderer } from "./ConversationRenderer";
import {
  engineAtom,
  initEngineAtom,
  type SectionTSVMap,
  type SectionTSVFiles,
} from "@/lib/engine/tree-walker";
import { MOCK_PLANNED_DELIVERABLES } from "./data/mockData";

// ── Fetch split TSVs from public/trees/ ──
async function fetchSectionFiles(section: string): Promise<SectionTSVFiles> {
  const [flow, copy, options] = await Promise.all([
    fetch(`/trees/section${section}-flow.tsv`).then((r) => r.text()),
    fetch(`/trees/section${section}-copy.tsv`).then((r) => r.text()),
    fetch(`/trees/section${section}-options.tsv`).then((r) => r.text()),
  ]);
  return { flow, copy, options };
}

async function fetchTSVs(): Promise<SectionTSVMap> {
  const [a, b, c] = await Promise.all([
    fetchSectionFiles("A"),
    fetchSectionFiles("B"),
    fetchSectionFiles("C"),
  ]);
  return { A: a, B: b, C: c };
}

// ── Phase labels (narrative arc, not form sections) ──
const PHASE_LABELS: Record<string, string> = {
  A: "Your work",
  B: "What challenged you",
  C: "How you grew",
};

// ── Inner component (needs Jotai Provider above) ──
function DailyReportV6EngineInner() {
  const [engineState] = useAtom(engineAtom);
  const initEngine = useSetAtom(initEngineAtom);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load TSVs and initialize engine on mount
  useEffect(() => {
    fetchTSVs()
      .then((tsvMap) => {
        initEngine({
          tsvMap,
          deliverables: MOCK_PLANNED_DELIVERABLES.map((d) => ({ ...d })),
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(`Failed to load decision trees: ${err.message}`);
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="alert alert-error max-w-md">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-base-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-base-100/90 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-xs font-medium text-primary">
            {PHASE_LABELS[engineState.section] ?? "Daily Reflection"}
          </span>
          <span className="text-xs text-base-content/40">
            Daily Reflection
          </span>
        </div>

        {/* Section progress bar — labeled phases */}
        <div className="flex gap-1 px-4 pb-2">
          {(["A", "B", "C"] as const).map((s) => {
            const isCurrent = engineState.section === s;
            const isPast =
              (s === "A" && (engineState.section === "B" || engineState.section === "C")) ||
              (s === "B" && engineState.section === "C");
            return (
              <div key={s} className="flex flex-1 flex-col gap-0.5">
                <div
                  className={`h-1 w-full rounded-full transition-colors duration-500 ${
                    isPast
                      ? "bg-success"
                      : isCurrent
                        ? "bg-primary"
                        : "bg-base-300"
                  }`}
                />
                <span
                  className={`text-center text-[10px] transition-colors duration-300 ${
                    isCurrent
                      ? "text-primary font-medium"
                      : isPast
                        ? "text-success/60"
                        : "text-base-content/30"
                  }`}
                >
                  {PHASE_LABELS[s]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conversation */}
      <div className="pb-24 pt-4">
        <ConversationRenderer />
      </div>
    </div>
  );
}

// ── Exported component with Jotai Provider ──
export function DailyReportV6Engine() {
  return (
    <Provider>
      <DailyReportV6EngineInner />
    </Provider>
  );
}
