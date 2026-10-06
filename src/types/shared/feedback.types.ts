/**
 * feedback.types.ts — Shared types for the multi-directional feedback system.
 *
 * Covers L1↔L2, L1↔L3, L2↔L3, and peer feedback at every layer.
 * Single source of truth — replaces aavahana/pdgms.types.ts feedback section
 * and mimamsaka/feedback.types.ts.
 */

// ─── Primitives ───────────────────────────────────────────────────────────────

export type PdgmsLayer = "L1" | "L2" | "L3" | "L4";

export type FeedbackDirectionKey =
  | "L2_TO_L1"   // Supervisor → Employee (named, weekly)
  | "L1_TO_L2"   // Employee → Supervisor (anonymous, weekly)
  | "L3_TO_L1"   // TPM → Member (named, sprint-scoped)
  | "L1_TO_L3"   // Member → TPM (anonymous, sprint-scoped)
  | "L3_TO_L2"   // TPM → Supervisor (named, sprint-scoped)
  | "L2_TO_L3"   // Supervisor → TPM (named, sprint-scoped)
  | "PEER_L1"    // Employee → Employee (semi-anon, monthly)
  | "PEER_L2"    // Supervisor → Supervisor (named, monthly)
  | "PEER_L3";   // TPM → TPM (named, monthly)

// ─── Direction Config ─────────────────────────────────────────────────────────

export interface FeedbackDirectionConfig {
  key: FeedbackDirectionKey;
  fromLayer: PdgmsLayer;
  toLayer: PdgmsLayer;
  /** True = recipient only ever sees aggregate, never individual submissions */
  isAnonymous: boolean;
  /** True = requires programId to be provided */
  isProgramScoped: boolean;
  cadence: "weekly" | "fortnightly" | "sprint" | "monthly";
  /** CTA label on the give-feedback tab */
  label: string;
  /** Short label used for the tab header */
  tabLabel: string;
  /** Label shown on the received-feedback tab */
  receivedLabel: string;
}

export const FEEDBACK_DIRECTION_CONFIGS: Record<FeedbackDirectionKey, FeedbackDirectionConfig> = {
  L2_TO_L1: {
    key: "L2_TO_L1", fromLayer: "L2", toLayer: "L1",
    isAnonymous: false, isProgramScoped: false, cadence: "weekly",
    label: "Reflect on Your Team", tabLabel: "Reflect on Team",
    receivedLabel: "Supervisor's Reflection",
  },
  L1_TO_L2: {
    key: "L1_TO_L2", fromLayer: "L1", toLayer: "L2",
    isAnonymous: true, isProgramScoped: false, cadence: "weekly",
    label: "Reflect on Your Supervisor", tabLabel: "Reflect on Supervisor",
    receivedLabel: "How Your Team Sees You",
  },
  L3_TO_L1: {
    key: "L3_TO_L1", fromLayer: "L3", toLayer: "L1",
    isAnonymous: false, isProgramScoped: true, cadence: "sprint",
    label: "Reflect on Program Members", tabLabel: "Reflect on Members",
    receivedLabel: "TPM's Reflection",
  },
  L1_TO_L3: {
    key: "L1_TO_L3", fromLayer: "L1", toLayer: "L3",
    isAnonymous: true, isProgramScoped: true, cadence: "sprint",
    label: "Reflect on Your TPM", tabLabel: "Reflect on TPM",
    receivedLabel: "How Members See You",
  },
  L3_TO_L2: {
    key: "L3_TO_L2", fromLayer: "L3", toLayer: "L2",
    isAnonymous: false, isProgramScoped: true, cadence: "sprint",
    label: "Reflect on Supervisors", tabLabel: "Reflect on Supervisors",
    receivedLabel: "TPM's Reflection",
  },
  L2_TO_L3: {
    key: "L2_TO_L3", fromLayer: "L2", toLayer: "L3",
    isAnonymous: false, isProgramScoped: true, cadence: "sprint",
    label: "Reflect on Your TPM", tabLabel: "Reflect on TPM",
    receivedLabel: "Supervisor's Reflection",
  },
  PEER_L1: {
    key: "PEER_L1", fromLayer: "L1", toLayer: "L1",
    isAnonymous: false, isProgramScoped: false, cadence: "monthly",
    label: "Reflect on a Peer", tabLabel: "Peer Reflection",
    receivedLabel: "Peer Reflections",
  },
  PEER_L2: {
    key: "PEER_L2", fromLayer: "L2", toLayer: "L2",
    isAnonymous: false, isProgramScoped: false, cadence: "monthly",
    label: "Reflect on a Peer", tabLabel: "Peer Reflection",
    receivedLabel: "Peer Reflections",
  },
  PEER_L3: {
    key: "PEER_L3", fromLayer: "L3", toLayer: "L3",
    isAnonymous: false, isProgramScoped: false, cadence: "monthly",
    label: "Reflect on a Peer", tabLabel: "Peer Reflection",
    receivedLabel: "Peer Reflections",
  },
};

// ─── Tab layout per viewer layer ──────────────────────────────────────────────

export interface FeedbackViewConfig {
  viewerLayer: PdgmsLayer;
  /** Directions the viewer can submit feedback for */
  giveTabs: FeedbackDirectionKey[];
  /** Directions where the viewer can see feedback they received */
  receiveTabs: FeedbackDirectionKey[];
  /** Direction used for the multi-member scoring overview (null = no overview) */
  overviewTab: FeedbackDirectionKey | null;
}

export const FEEDBACK_VIEW_CONFIGS: Record<PdgmsLayer, FeedbackViewConfig> = {
  L1: {
    viewerLayer: "L1",
    giveTabs: ["L1_TO_L2", "L1_TO_L3", "PEER_L1"],
    receiveTabs: ["L2_TO_L1"],
    overviewTab: null,
  },
  L2: {
    viewerLayer: "L2",
    giveTabs: ["L2_TO_L1", "L2_TO_L3", "PEER_L2"],
    receiveTabs: ["L1_TO_L2"],
    overviewTab: "L2_TO_L1",
  },
  L3: {
    viewerLayer: "L3",
    giveTabs: ["L3_TO_L1", "L3_TO_L2", "PEER_L3"],
    receiveTabs: ["L1_TO_L3"],
    overviewTab: "L3_TO_L1",
  },
  L4: {
    viewerLayer: "L4",
    giveTabs: [],
    receiveTabs: [],
    overviewTab: null,
  },
};

// ─── Rubric ──────────────────────────────────────────────────────────────────

export interface RubricDimension {
  id: string;
  name: string;
  description: string;
  scale: {
    min: number;
    max: number;
    step?: number;
    /** Per-level short labels (index 0 === score `min`). */
    labels?: string[];
    /** Per-level descriptions, aligned with `labels`. */
    descriptions?: string[];
    /** Named score bands for grouping/reference (e.g. "Performance" 7–10). */
    bands?: { name: string; min: number; max: number }[];
  };
  /** 0–1, all dimension weights sum to 1 per rubric */
  weight: number;
}

export interface FeedbackRubric {
  id: string;
  directionKey: FeedbackDirectionKey;
  name: string;
  dimensions: RubricDimension[];
  cadence: "weekly" | "fortnightly" | "sprint" | "monthly";
  programId?: string;
  isActive: boolean;
  designedBy?: string;
  approvedBy?: string;
}

// ─── Targets ─────────────────────────────────────────────────────────────────

/** A person you can give feedback to for a given direction */
export interface FeedbackTarget {
  id: string;
  name: string;
  role: string;
  layer: PdgmsLayer;
  avatarUrl?: string;
  programId?: string;
  lastFeedbackAt?: string | null;
  submittedThisPeriod: boolean;
}

// ─── Submissions ─────────────────────────────────────────────────────────────

export interface FeedbackScore {
  dimensionId: string;
  score: number;
  comment?: string;
}

export interface FeedbackSubmission {
  id: string;
  directionKey: FeedbackDirectionKey;
  rubricId: string;
  scorerId: string;
  targetId: string;
  period: string;
  scores: FeedbackScore[];
  composite: number;
  overallNote?: string;
  submittedAt: string;
}

export interface SubmitFeedbackPayload {
  directionKey: FeedbackDirectionKey;
  targetId: string;
  period: string;
  scores: FeedbackScore[];
  overallNote?: string;
  programId?: string;
}

// ─── Aggregate (anonymous received) ──────────────────────────────────────────

export interface FeedbackAggregate {
  directionKey: FeedbackDirectionKey;
  targetId: string;
  period: string;
  respondentCount: number;
  compositeAvg: number;
  dimensionAvgs: Array<{ dimensionId: string; dimensionName: string; avg: number; observations?: string[] }>;
  trend: Array<{ period: string; compositeAvg: number; respondentCount?: number }>;
}

// ─── Scoring Overview (multi-member, L2/L3 view) ─────────────────────────────

export interface MemberScoringStatus {
  targetId: string;
  targetName: string;
  targetRole: string;
  targetLayer: PdgmsLayer;
  supervisorId?: string;
  supervisorName?: string;
  latestComposite: number | null;
  trend: Array<{ period: string; composite: number }>;
  submittedThisPeriod: boolean;
}

// ─── Pending Scoring (who the scorer still owes a score this period) ──────────

/** A direct report the scorer has NOT yet scored in the current period (G6). */
export interface PendingScoringTarget {
  targetId: string;
  displayName: string;
  periodId: string;
  scored: boolean;
}

// ─── Target Deliverables (Phase 3 context display) ────────────────────────────

/** A delivered ticket shown in the rubric form so the giver evaluates in context */
export interface FeedbackTargetDeliverable {
  id: string;
  label: string;
  quantity?: number;
  deliveredAt: string;
  /** Present only for scope-level (anonymous direction) results */
  ownerName?: string;
}

// ── Weekly evidence (the target's daily plans + reports for the reflected week) ─
export interface FeedbackWeekTask {
  text: string;
  status: "notStarted" | "inProgress" | "completed";
  actualMins?: number | null;
}
export interface FeedbackWeekReport {
  submitted: boolean;
  narrative: string | null;
  tasks: FeedbackWeekTask[];
  doneCount: number;
  totalCount: number;
  totalActualMins: number;
}
export interface FeedbackWeekDay {
  date: string;
  plan: { text: string; status: string; type?: string }[];
  report: FeedbackWeekReport | null;
  hasPlan: boolean;
  hasReport: boolean;
}
export interface FeedbackWeek {
  weekStart: string;
  days: FeedbackWeekDay[];
}

/**
 * The org's standard holistic rating scale: one 1–10 judgement with a named
 * behavioural anchor + description at each level, grouped into three bands.
 */
export interface HolisticLevel { value: number; label: string; description: string; }

export const HOLISTIC_RATING_LEVELS: HolisticLevel[] = [
  { value: 1, label: "Not Interested", description: "Shows no interest in work or tasks." },
  { value: 2, label: "Lacks Discipline", description: "Works only when instructed by a manager; lacks self-initiative." },
  { value: 3, label: "Motivated but Directionless", description: "Highly motivated but doesn't know where or how to focus efforts." },
  { value: 4, label: "Careless and Inconsistent", description: "Moderately productive but careless; needs better discipline to improve." },
  { value: 5, label: "Consistent Performer", description: "Meets required standards, serious about work, and shows consistent productivity, but there's room for improvement." },
  { value: 6, label: "Reliable and Productive", description: "Completes all assigned tasks efficiently and shows reliability in delivery." },
  { value: 7, label: "Problem Identifier", description: "Productive and consistently identifies problem areas or challenges that need attention." },
  { value: 8, label: "Problem Solver", description: "Identifies problems and proactively suggests creative and practical solutions." },
  { value: 9, label: "Innovative and Experimental", description: "Actively solves problems, experiments with solutions, and builds models or MVPs to address challenges." },
  { value: 10, label: "Exceptional Performer", description: "Excels in identifying, solving, and executing solutions flawlessly, delivering extraordinary results that others can learn from." },
];

export const HOLISTIC_RATING_BANDS = [
  { name: "Need Attention", min: 1, max: 3 },
  { name: "Productivity", min: 4, max: 6 },
  { name: "Performance", min: 7, max: 10 },
];

/**
 * Fallback rubric used when the backend has no configured rubric for a
 * direction: a single holistic 1–10 dimension on the HOLISTIC_RATING_LEVELS
 * scale. A real backend rubric (one that actually has dimensions) always wins.
 */
export function buildHolisticRubric(directionKey: FeedbackDirectionKey): FeedbackRubric {
  return {
    id: "holistic-default",
    directionKey,
    name: "Holistic rating",
    cadence: "weekly",
    isActive: true,
    dimensions: [
      {
        id: "overall",
        name: "Overall rating",
        description: "Pick the level that best describes them this period.",
        scale: {
          min: 1,
          max: 10,
          step: 1,
          labels: HOLISTIC_RATING_LEVELS.map((l) => l.label),
          descriptions: HOLISTIC_RATING_LEVELS.map((l) => l.description),
          bands: HOLISTIC_RATING_BANDS,
        },
        weight: 1,
      },
    ],
  };
}
