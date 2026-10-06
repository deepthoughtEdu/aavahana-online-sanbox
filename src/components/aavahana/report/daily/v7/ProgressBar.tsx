"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils";
import type { FlowStep } from "./data/types";

type ActSegment = "act1" | "act2" | "act3";

const SEGMENT_STEPS: Record<ActSegment, FlowStep[]> = {
  act1: ["act1"],
  act2: ["act2_tapping", "act2_voice", "act2_confirm"],
  act3: ["act3", "summary", "done"],
};

const SEGMENT_LABELS: Record<ActSegment, string> = {
  act1: "Work",
  act2: "Story",
  act3: "Close",
};

function getSegmentState(segment: ActSegment, currentStep: FlowStep): "active" | "completed" | "upcoming" {
  const steps = SEGMENT_STEPS[segment];
  if (steps.includes(currentStep)) return "active";

  const allSegments: ActSegment[] = ["act1", "act2", "act3"];
  const segIdx = allSegments.indexOf(segment);
  const currentSegIdx = allSegments.findIndex((s) => SEGMENT_STEPS[s].includes(currentStep));
  return currentSegIdx > segIdx ? "completed" : "upcoming";
}

// C-1: compute actual fill % to show sub-step progress within a segment
function getSegmentFill(segment: ActSegment, currentStep: FlowStep): string {
  const state = getSegmentState(segment, currentStep);
  if (state === "upcoming") return "0%";
  if (state === "completed") return "100%";
  // active segment: map sub-steps
  if (segment === "act2") {
    if (currentStep === "act2_tapping") return "33%";
    if (currentStep === "act2_voice") return "66%";
    return "100%"; // act2_confirm
  }
  return "100%";
}

interface ProgressBarProps {
  currentStep: FlowStep;
}

export function ProgressBar({ currentStep }: ProgressBarProps) {
  const segments: ActSegment[] = ["act1", "act2", "act3"];

  return (
    <div className="flex w-full gap-1.5 px-4 py-2">
      {segments.map((segment) => {
        const state = getSegmentState(segment, currentStep);
        const fillWidth = getSegmentFill(segment, currentStep); // C-1
        return (
          <div key={segment} className="flex flex-1 flex-col gap-1">
            <div className="relative h-2 overflow-hidden rounded-full bg-base-200">
              <motion.div
                animate={{ width: fillWidth }}
                initial={false}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full",
                  state === "active" && "bg-primary",
                  state === "completed" && "bg-primary/70",
                )}
              />
            </div>
            <span
              className={cn(
                "text-center text-[11px] font-medium transition-all duration-300",
                state === "active" && "font-bold text-primary",
                state === "completed" && "text-primary/60",
                state === "upcoming" && "text-base-content/30"
              )}
            >
              {SEGMENT_LABELS[segment]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
