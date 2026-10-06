"use client";

import { useMemo } from "react";
import { ReflectiveAssessmentEngine } from "@/components/reflective-assessment";
import { useAssessment } from "@/lib/hooks/assessments/use-assessment";
import { createBlockActivities } from "./lnd-block-registry";
import type { McqBlockData } from "./data/types";

interface LndBlockEngineProps {
  block: McqBlockData;
  contextType?: string;
  contextId?: number;
}

const LND_COMPLETION = {
  title: "Block Complete.",
  subtitle: "Your competency profile has been updated.",
  reportLabel: "View Results",
  revisitLabel: "Revisit Questions",
} as const;

export default function LndBlockEngine({
  block,
  contextType = "standalone",
  contextId,
}: LndBlockEngineProps) {
  // Memoize so the activity array — and the per-question component closures it
  // holds — keep a stable identity across renders. Rebuilding them every render
  // gave each question a new component *type*, which forced React to unmount and
  // remount the whole question on every answer submit (the "refresh/buffering
  // glitch"). `block` is identity-stable while cached, so this settles it.
  const activities = useMemo(() => createBlockActivities(block), [block]);

  const persistence = useAssessment("lnd-block", {
    contextType,
    contextId,
    metadata: { blockId: block.id },
    autoCreate: true,
  });

  return (
    <ReflectiveAssessmentEngine
      activities={activities}
      persistence={persistence}
      completion={LND_COMPLETION}
    />
  );
}
