/**
 * Display mappings for HCD Intelligence — severity → Badge colour variant, plus
 * human labels for categories and statuses. Colours resolve through the shared
 * design tokens (Badge data-color), never hardcoded values.
 */

import type { ColorVariant } from "@/utils/shared/design.utils";
import type {
  InsightSeverity,
  InsightCategory,
  InsightStatus,
} from "@/types/intelligence/intelligence.types";

export const severityVariant: Record<InsightSeverity, ColorVariant> = {
  critical: "error",
  high: "error",
  medium: "warning",
  low: "info",
  info: "neutral",
};

export const severityLabel: Record<InsightSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
};

// High → low, for sorting a page of insights client-side.
export const severityRank: Record<InsightSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

export const categoryLabel: Record<InsightCategory, string> = {
  bottleneck: "Bottleneck",
  repeated_blocker: "Recurring blocker",
  missed_commitment: "Missed commitment",
  dependency: "Dependency",
  productivity: "Productivity",
  communication: "Communication",
  learning_gap: "Learning gap",
  process_inefficiency: "Process inefficiency",
  high_delivery: "Strong delivery",
  deep_focus: "Deep focus",
  collaboration: "Collaboration",
  well_being: "Well-being",
};

export const statusLabel: Record<InsightStatus, string> = {
  open: "Open",
  acknowledged: "Acknowledged",
  in_progress: "In progress",
  resolved: "Resolved",
  dismissed: "Dismissed",
  superseded: "Superseded",
};

export const statusVariant: Record<InsightStatus, ColorVariant> = {
  open: "warning",
  acknowledged: "info",
  in_progress: "info",
  resolved: "success",
  dismissed: "neutral",
  superseded: "neutral",
};

// Allowed forward transitions (mirrors taxonomy.STATUS_TRANSITIONS) — drives the
// action buttons shown in the detail modal.
export const statusTransitions: Record<InsightStatus, InsightStatus[]> = {
  open: ["acknowledged", "in_progress", "resolved", "dismissed"],
  acknowledged: ["in_progress", "resolved", "dismissed"],
  in_progress: ["resolved", "dismissed"],
  resolved: ["in_progress"],
  dismissed: [],
  superseded: [],
};
