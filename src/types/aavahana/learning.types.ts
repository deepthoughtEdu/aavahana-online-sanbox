/**
 * The learning loop: one suggestion at a time.
 *
 * Replaces the old growth panel, which produced ten to fifteen suggestions a
 * day behind a collapsed "Keep growing (12)" line and recorded nothing about
 * whether any of them were read, followed or useful.
 *
 * The rule the whole shape follows: a person holds at most one open suggestion,
 * and a new one is only issued once they have said what happened to the last.
 * Saying "not yet" is a complete answer and costs nothing.
 */

export type SuggestionKind =
  | "framework"
  | "skill"
  | "habit"
  | "reading"
  | "viewing"
  /** The always-on template-engine line. No AI key needed, so most people get this. */
  | "learning";

export type SuggestionStatus = "open" | "applied" | "not_useful" | "dropped";

/** What the person can say about the open suggestion. */
export type SuggestionAction =
  /**
   * They said they would try it. Keeps the challenge open rather than closing
   * it: the point is to record intent, so "never appealed" and "appealed but
   * was not realistic" stop looking like the same failure.
   */
  | "accepted"
  | "completed"
  | "started"
  | "not_started"
  | "not_relevant"
  | "applied"
  | "not_useful"
  | "dropped"
  /** Not yet. Keeps it open, unlocks nothing, holds nothing against them. */
  | "deferred";

/**
 * What the challenge asks you to DO (PRD §7), as opposed to `kind`, which is
 * what the material is. Rotated by the backend so the same shape of ask does
 * not arrive every morning.
 */
export type ChallengeMode =
  | "apply"
  | "think"
  | "discover"
  | "communicate"
  | "experiment"
  | "observe";

export type ChallengeOutcome =
  | "completed"
  | "started"
  | "not_started"
  | "not_relevant";

export interface LearningSuggestion {
  id: string;
  /** ai = BYOK growth coach. engine = template engine, available to everyone. */
  source: "ai" | "engine";
  kind: SuggestionKind;
  title: string;
  reason: string | null;
  /** Exact source when verified; otherwise an honest search fallback. */
  searchUrl: string | null;
  /**
   * Where the idea lives and how much of it to take: "Chapter 1 of Thinking in
   * Systems (Donella Meadows), about 15 pages". `title` is the idea; this is the
   * container. Nobody is asked to read a whole book.
   */
  sourceNote: string | null;
  /** Honest minutes. Capped at 10 server-side. Five is the target. */
  effortMins: number | null;
  /** Public-source evidence captured by the backend before this was issued. */
  verified: boolean;
  sourceProvider: string | null;
  sourceTitle: string | null;
  author: string | null;
  publisher: string | null;
  year: number | null;
  /** Full source duration. The suggested focus can still be shorter. */
  sourceDurationMins: number | null;
  /**
   * The deeper version, present only once the person pressed "go deeper".
   * Not pushed at anybody: wanting more is rare, and serving that minority by
   * default is how the old panel ended up with fifteen items nobody opened.
   */
  expansion: string | null;
  expandedAt: string | null;

  /**
   * Evidence from the catalogue row behind this, when it came from there.
   * Shown on the card: a confirmed author and year, and how many people have
   * said it worked, are the two most persuasive things we can put on screen and
   * they cost nothing because the catalogue already holds them.
   */
  provenCount: number | null;
  frameworkId: number | null;
  /** Null on anything issued before challenge modes existed. */
  mode: ChallengeMode | null;
  modeLabel: string | null;
  /** Set once, the first time they said they would try it. */
  acceptedAt: string | null;
  /** One-tap answer after a practical challenge. */
  challengeOutcome: ChallengeOutcome | null;
  challengeOutcomeLabel: string | null;
  challengeOutcomeAt: string | null;
  status: SuggestionStatus;
  appliedNote: string | null;
  notUsefulNote: string | null;
  deferCount: number;
  issuedForDate: string | null;
  issuedAt: string;
  closedAt: string | null;
  seenCount: number;
}

export interface DeferReason {
  id: string;
  label: string;
}

/** Per-kind conversion, used server-side to bias the next pick. */
export interface KindStats {
  applied: number;
  notUseful: number;
  dropped: number;
  deferrals: number;
  issued: number;
  score: number;
}

export interface SuggestionTotals {
  issued: number;
  applied: number;
  notUseful: number;
  dropped: number;
  started: number;
  notStarted: number;
  notRelevant: number;
  open: number;
  answered: number;
}

/** GET /v3/pdgms/loops/daily-report/v7/suggestion */
export interface OpenSuggestionResponse {
  open: LearningSuggestion | null;
  deferReasons: DeferReason[];
  totals: SuggestionTotals;
  byKind: Record<SuggestionKind, KindStats>;
}

/** POST /v3/pdgms/loops/daily-report/v7/suggestion/respond */
export interface SuggestionRespondPayload {
  suggestionId: string;
  action: SuggestionAction;
  /** How they applied it, or why it wasn't useful. Always optional. */
  note?: string;
  /** Deferral chip id. Always optional. */
  reason?: string;
  date?: string;
}

export interface SuggestionRespondResponse {
  saved: boolean;
  suggestion: LearningSuggestion;
  /** True once the slot is free, so the next report submit issues a new one. */
  slotOpen: boolean;
}

export interface SuggestionHistoryItem extends LearningSuggestion {
  deferrals: { reason: string | null; onDate: string | null }[];
}

/** GET /v3/pdgms/loops/daily-report/v7/suggestions/history */
export interface SuggestionHistoryResponse {
  totals: SuggestionTotals;
  byKind: Record<SuggestionKind, KindStats>;
  items: SuggestionHistoryItem[];
}

/** Display labels. The backend never sends prose for these. */
export const KIND_LABEL: Record<SuggestionKind, string> = {
  framework: "Framework",
  skill: "Skill",
  habit: "Habit",
  reading: "Read",
  viewing: "Watch",
  learning: "Learn",
};

/**
 * Something to DO versus something to READ or WATCH.
 *
 * The two are presented differently, and the difference is not decoration. A
 * challenge gets a mode label and an "I'll try it" commitment, because doing it
 * is a decision. An article gets neither: you do not "try" a chapter, you read
 * it, and the button for that already exists on the card.
 *
 * The backend decides which one a person gets from how their day went. Named a
 * blocker, they get a challenge aimed at it. Smooth day, they get material.
 */
const DOING_KINDS: SuggestionKind[] = ["framework", "skill", "habit", "learning"];

export function isChallenge(kind: SuggestionKind): boolean {
  return DOING_KINDS.includes(kind);
}

/** POST /v3/pdgms/loops/daily-report/v7/suggestion/expand */
export interface SuggestionExpandPayload {
  suggestionId: string;
  /** BYOK creds. Passed through, never stored. Without them the server refuses. */
  apiKey?: string;
  provider?: string;
  model?: string;
}

export interface SuggestionExpandResponse {
  expansion: string;
  /** True when it was already written, so no second charge on their key. */
  cached: boolean;
}
