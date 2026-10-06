import type { ColorVariant } from "@/utils/shared/design.utils";

// Improvement Object 6-stage lifecycle — mirrors the backend state machine
// (src/pdgms/hcd/initiative-state-machine.js). One vocabulary everywhere (HG1).
export type IoStage =
  | "spotted"
  | "diagnosed"
  | "ideated"
  | "prototyped"
  | "piloted"
  | "scaled"
  | "dropped";

// Forward lifecycle order (dropped is off-line, not part of the order).
export const STAGE_ORDER: IoStage[] = [
  "spotted",
  "diagnosed",
  "ideated",
  "prototyped",
  "piloted",
  "scaled",
];

const PRE_PILOTED: IoStage[] = ["spotted", "diagnosed", "ideated", "prototyped"];

// Advancing into these stages captures structure; the others are advance-only.
export const CAPTURE_STAGES = new Set<IoStage>(["prototyped", "piloted", "scaled"]);

export const STAGE_BADGE: Record<IoStage, { label: string; variant: ColorVariant }> = {
  spotted: { label: "Spotted", variant: "neutral" },
  diagnosed: { label: "Diagnosed", variant: "info" },
  ideated: { label: "Ideated", variant: "accent" },
  prototyped: { label: "Prototyped", variant: "warning" },
  piloted: { label: "Piloted", variant: "primary" },
  scaled: { label: "Scaled", variant: "success" },
  dropped: { label: "Dropped", variant: "ghost" },
};

export function nextStage(status: IoStage): IoStage | null {
  const i = STAGE_ORDER.indexOf(status);
  if (i === -1 || i === STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[i + 1];
}

export function isPrePiloted(status: IoStage): boolean {
  return PRE_PILOTED.includes(status);
}

export const canDrop = isPrePiloted;
