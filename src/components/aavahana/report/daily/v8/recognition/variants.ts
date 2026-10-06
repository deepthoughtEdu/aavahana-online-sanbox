/**
 * The variability engine behind the recognition screen.
 *
 * THE PROBLEM THIS SOLVES
 * A fixed celebration dies in about a week. The first "You're a champ!" lands,
 * the fifth is wallpaper, the twentieth is an obstacle between the person and
 * the rest of their evening. Rotating the artwork alone does not fix it either
 * — habituation is to the *event*, not to the pixels.
 *
 * So three separate mechanisms run here:
 *
 *  1. ROTATION WITH EXCLUSION. Three axes (scene, copy, layout) each pick from
 *     a pool with the last N picks removed, so a repeat is impossible rather
 *     than merely unlikely. Random picking from 6 scenes repeats yesterday's
 *     one day in six, and that is exactly the case people notice.
 *
 *  2. TONE MATCHING. The register is derived from the day, not chosen. A day
 *     where nothing shipped and the person felt drained gets warmth and quiet,
 *     never confetti. Praise that ignores what actually happened teaches people
 *     the praise means nothing, which is worse than no praise.
 *
 *  3. DOSE DECAY. The celebration gets shorter and calmer as the habit forms
 *     (day 3 is loud, day 80 is a nod), and milestones spike it back to full.
 *     Scarcity is what keeps the big version worth something.
 *
 * DETERMINISM. Everything is seeded from (eid, date, axis) rather than
 * Math.random. Two reasons: re-opening a submitted day shows the same
 * celebration instead of a slot machine, and a random draw during render is a
 * hydration mismatch waiting to happen.
 */

export type ToneRegister = "triumph" | "steady" | "tender" | "milestone";

export type SceneId =
  | "confetti"
  | "ribbons"
  | "mascot"
  | "stamp"
  | "bloom"
  | "sunrise"
  | "lantern"
  | "fireworks"
  | "constellation";

export type LayoutId = "center" | "rise" | "banner";

/** Everything the screen knows about the day it is reacting to. */
export interface RecognitionCtx {
  name: string;
  /** Seed salt so two people closing the same day don't see the same screen. */
  eid: string;
  dateISO: string;
  total: number;
  doneCount: number;
  partialCount: number;
  notDoneCount: number;
  /** The one task that mattered ("critical path"), if the day named one. */
  cpLabel: string | null;
  cpDone: boolean;
  constraintLabel: string | null;
  unplannedCount: number;
  moodLabel: string | null;
  moodValence: "positive" | "neutral" | "negative" | "none";
  /** Consecutive days, from the growth-streak endpoint. */
  streak: number;
  /** Lifetime submitted reports — drives dose decay. */
  submittedDays: number;
  smoothDay: boolean;
}

export interface CopyVariant {
  id: string;
  /** Big line. Supports {name}. */
  headline: string;
  /** Smaller line underneath. Supports the full token set. */
  subline: string;
}

export interface PromptVariant {
  id: string;
  /** The chip the person taps. Short — it is an invitation, not a form label. */
  invite: string;
  /** The question shown once the composer opens. */
  question: string;
  /** Placeholder in the textarea. */
  placeholder: string;
}

export interface RecognitionVariant {
  tone: ToneRegister;
  scene: SceneId;
  layout: LayoutId;
  copy: CopyVariant;
  prompt: PromptVariant;
  /** 0.5 to 1.0. Scales particle counts, travel distance and duration. */
  intensity: number;
  /** Milliseconds before the overlay fades itself out. */
  dwellMs: number;
  /** Milestone label ("10 days straight") when this is a milestone day. */
  milestoneLabel: string | null;
}

// ── Seeded randomness ─────────────────────────────────────────────────────────

/** FNV-1a. Small, fast, and good enough to decorrelate the three axes. */
function hash32(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — one draw per axis is all we need. */
function seededUnit(seed: number): number {
  let t = (seed + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Pick from `pool`, skipping anything in `recent`, deterministically for the
 * given seed key. Falls back to the full pool when exclusion empties it (small
 * pools plus a long memory would otherwise deadlock).
 */
export function pickRotating<T extends { id: string }>(
  pool: T[],
  recent: string[],
  seedKey: string,
): T {
  const fresh = pool.filter((p) => !recent.includes(p.id));
  const from = fresh.length > 0 ? fresh : pool;
  const idx = Math.floor(seededUnit(hash32(seedKey)) * from.length);
  return from[Math.min(idx, from.length - 1)];
}

// ── Rotation memory ───────────────────────────────────────────────────────────

const MEMORY_KEY = "pdgms.v8.recognition.recent";

/** How many past picks each axis remembers. Tuned to pool size. */
const MEMORY_DEPTH = { scene: 4, copy: 6, layout: 2 } as const;

export type Axis = keyof typeof MEMORY_DEPTH;

export type RotationMemory = Record<Axis, string[]>;

const EMPTY_MEMORY: RotationMemory = { scene: [], copy: [], layout: [] };

/**
 * Client only — never call during render. localStorage during render is a
 * hydration mismatch, and the overlay is post-submit so there is always an
 * effect to read it from.
 */
export function readMemory(): RotationMemory {
  if (typeof window === "undefined") return EMPTY_MEMORY;
  try {
    const raw = window.localStorage.getItem(MEMORY_KEY);
    if (!raw) return EMPTY_MEMORY;
    const parsed = JSON.parse(raw) as Partial<RotationMemory>;
    return {
      scene: Array.isArray(parsed.scene) ? parsed.scene : [],
      copy: Array.isArray(parsed.copy) ? parsed.copy : [],
      layout: Array.isArray(parsed.layout) ? parsed.layout : [],
    };
  } catch {
    return EMPTY_MEMORY;
  }
}

export function rememberPicks(picks: Record<Axis, string>): void {
  if (typeof window === "undefined") return;
  try {
    const mem = readMemory();
    const next: RotationMemory = { ...mem };
    (Object.keys(MEMORY_DEPTH) as Axis[]).forEach((axis) => {
      // Re-opening the same day must not push the memory forward.
      const without = mem[axis].filter((id) => id !== picks[axis]);
      next[axis] = [picks[axis], ...without].slice(0, MEMORY_DEPTH[axis]);
    });
    window.localStorage.setItem(MEMORY_KEY, JSON.stringify(next));
  } catch {
    /* private mode, quota, storage disabled — variability degrades, nothing breaks */
  }
}

// ── Tone ──────────────────────────────────────────────────────────────────────

/** Streak counts that earn the reserved milestone treatment. */
const STREAK_MILESTONES: Record<number, string> = {
  3: "3 days in a row",
  5: "a full week of workdays",
  10: "10 days straight",
  21: "21 days, that's a habit now",
  30: "30 days straight",
  50: "50 days straight",
  100: "100 days straight",
};

/** Lifetime counts that earn it. The first report is its own moment. */
const TOTAL_MILESTONES: Record<number, string> = {
  1: "your first report",
  25: "25 reports in",
  50: "50 reports in",
  100: "100 reports in",
};

export function milestoneFor(ctx: RecognitionCtx): string | null {
  return (
    STREAK_MILESTONES[ctx.streak] ?? TOTAL_MILESTONES[ctx.submittedDays] ?? null
  );
}

/**
 * The register is read off the day, never chosen. Milestone wins outright — a
 * 10-day streak is worth marking even on a day where little shipped, and that
 * is precisely the day the person most needs to hear it.
 */
export function toneFor(ctx: RecognitionCtx): ToneRegister {
  if (milestoneFor(ctx)) return "milestone";

  const ratio = ctx.total > 0 ? ctx.doneCount / ctx.total : 0;
  const rough = ctx.moodValence === "negative";
  const nothingLanded = ctx.total > 0 && ctx.doneCount === 0;

  if (rough || nothingLanded) return "tender";
  if (ratio === 1 && ctx.total > 0) return "triumph";
  if (ctx.cpLabel !== null && ctx.cpDone && ctx.moodValence === "positive") {
    return "triumph";
  }
  return "steady";
}

// ── Scene pools ───────────────────────────────────────────────────────────────

const SCENES_LOUD: { id: SceneId }[] = [
  { id: "confetti" },
  { id: "ribbons" },
  { id: "mascot" },
  { id: "stamp" },
  { id: "bloom" },
  { id: "sunrise" },
];

/** No confetti, no stamp, no dancing. Warmth, not noise. */
const SCENES_TENDER: { id: SceneId }[] = [
  { id: "sunrise" },
  { id: "bloom" },
  { id: "lantern" },
];

/** Reserved. Never shown on an ordinary day — that is what makes them land. */
const SCENES_MILESTONE: { id: SceneId }[] = [
  { id: "fireworks" },
  { id: "constellation" },
];

const SCENES_BY_TONE: Record<ToneRegister, { id: SceneId }[]> = {
  triumph: SCENES_LOUD,
  steady: SCENES_LOUD,
  tender: SCENES_TENDER,
  milestone: SCENES_MILESTONE,
};

const LAYOUTS: { id: LayoutId }[] = [
  { id: "center" },
  { id: "rise" },
  { id: "banner" },
];

// ── Copy banks ────────────────────────────────────────────────────────────────
//
// Rules a new variant has to keep, so the bank doesn't drift off tone:
//   - Second person, contraction-friendly, the way a colleague talks.
//   - Name the thing they did wherever a token allows it. "Nice work" is noise;
//     "You got the vendor call unblocked" is recognition.
//   - Never grade. No "excellent", no scores, no comparison to other people.
//   - Tender copy never says "but" and never pivots into advice.

const COPY_TRIUMPH: CopyVariant[] = [
  {
    id: "t-cleared",
    headline: "That's the whole list, {name}.",
    subline: "{done} of {total} done. Days like this are rarer than they feel.",
  },
  {
    id: "t-mattered",
    headline: "You got the one that mattered.",
    subline: "{cp} is done. Everything else today was a bonus.",
  },
  {
    id: "t-champ",
    headline: "You're a champ, {name}.",
    subline: "Not a participation trophy. You actually moved {done} things today.",
  },
  {
    id: "t-shipped",
    headline: "Shipped.",
    subline:
      "{done} of {total}, and you wrote it down while it was still fresh. That's the hard part.",
  },
  {
    id: "t-strong",
    headline: "Strong day.",
    subline: "You went at {constraint} and it gave way.",
  },
  {
    id: "t-earned",
    headline: "Go close the laptop, {name}.",
    subline: "You've earned the evening. {done} of {total} done.",
  },
  {
    id: "t-visible",
    headline: "Today counted.",
    subline:
      "It's on your record now, in your own words. Nobody has to take your word for it later.",
  },
];

const COPY_STEADY: CopyVariant[] = [
  {
    id: "s-showedup",
    headline: "Logged, {name}.",
    subline: "{done} of {total} moved. A normal working day, honestly reported.",
  },
  {
    id: "s-progress",
    headline: "Progress is progress.",
    subline: "Partial counts. Half a thing today is a whole thing sooner.",
  },
  {
    id: "s-consistent",
    headline: "That's another one in.",
    subline:
      "Nobody remembers a single good day. They remember the run of ordinary ones.",
  },
  {
    id: "s-honest",
    headline: "Thanks for the honest version.",
    subline: "The tidied-up one would have been easier and worth much less.",
  },
  {
    id: "s-unplanned",
    headline: "The day had other plans.",
    subline:
      "{unplanned} thing(s) landed that weren't on the list, and you handled them anyway.",
  },
  {
    id: "s-momentum",
    headline: "Still moving, {name}.",
    subline: "You've closed {streakDays}. That's momentum, not luck.",
  },
  {
    id: "s-clear",
    headline: "Day closed.",
    subline: "You know what today was. Tomorrow starts from something real.",
  },
];

const COPY_TENDER: CopyVariant[] = [
  {
    id: "d-hard",
    headline: "That was a hard one.",
    subline:
      "You showed up and told the truth about it anyway. That's the part that counts today.",
  },
  {
    id: "d-stuck",
    headline: "Stuck days are still work, {name}.",
    subline:
      "Pushing at {constraint} and getting nowhere is not the same as doing nothing.",
  },
  {
    id: "d-rest",
    headline: "You can put it down now.",
    subline: "It's written down. It'll still be there tomorrow, and so will you.",
  },
  {
    id: "d-seen",
    headline: "Noted, and not held against you.",
    subline:
      "A rough day in the record is context, not a mark. Everyone's week has them.",
  },
  {
    id: "d-effort",
    headline: "You gave it the day.",
    subline:
      "Some days the outcome doesn't show what the effort cost. Today was one of those.",
  },
  {
    id: "d-return",
    headline: "Thanks for closing it out anyway.",
    subline: "The easy thing on a day like this is to skip it. You didn't.",
  },
];

const COPY_MILESTONE: CopyVariant[] = [
  {
    id: "m-run",
    headline: "{milestone}, {name}.",
    subline:
      "Almost nobody gets here. You have a written record of your own work that most people can only guess at.",
  },
  {
    id: "m-proof",
    headline: "{milestone}.",
    subline: "That's not a streak any more. That's a practice.",
  },
  {
    id: "m-stack",
    headline: "Look at that. {milestone}.",
    subline:
      "Every one of these is a day you can point at later and say exactly what you did.",
  },
];

const COPY_BY_TONE: Record<ToneRegister, CopyVariant[]> = {
  triumph: COPY_TRIUMPH,
  steady: COPY_STEADY,
  tender: COPY_TENDER,
  milestone: COPY_MILESTONE,
};

// ── The "tell me more" prompts ────────────────────────────────────────────────
//
// Specificity is the whole point. "Anything else to add?" gets nothing.
// "What finally moved on the vendor approval?" gets a paragraph, because it
// proves something actually read what they wrote.

const PROMPTS_GENERIC: PromptVariant[] = [
  {
    id: "g-bottleneck",
    invite: "Tell me what you got past",
    question: "What was in your way today, and what did you do about it?",
    placeholder: "The thing blocking me was…",
  },
  {
    id: "g-proud",
    invite: "Something you're quietly proud of?",
    question:
      "What's one thing from today you'd actually want someone to know about?",
    placeholder: "Nobody would notice this, but…",
  },
  {
    id: "g-hard",
    invite: "What was harder than it looked?",
    question:
      "Which part of today took more out of you than the plan suggested?",
    placeholder: "It looked like a small thing, but…",
  },
  {
    id: "g-learned",
    invite: "Learn anything today?",
    question: "What do you know now that you didn't know this morning?",
    placeholder: "Turns out…",
  },
];

/**
 * Picks the most specific prompt the day supports, and only falls back to the
 * rotating generic bank when the day gave us nothing to point at.
 */
export function promptFor(ctx: RecognitionCtx, seedKey: string): PromptVariant {
  if (ctx.constraintLabel && !ctx.cpDone) {
    const c = ctx.constraintLabel.toLowerCase();
    return {
      id: "c-constraint",
      invite: `Say more about ${c}`,
      question: `You named ${c} as what got in the way. What would it actually take to clear it?`,
      placeholder: "What would have to change is…",
    };
  }
  if (ctx.cpLabel && ctx.cpDone) {
    return {
      id: "c-cp-done",
      invite: "How did you get that through?",
      question: `${ctx.cpLabel} went through today. What made it move, when it hadn't before?`,
      placeholder: "What made the difference was…",
    };
  }
  if (ctx.unplannedCount > 0) {
    return {
      id: "c-unplanned",
      invite: "What was the thing that came up?",
      question:
        "Something landed that wasn't on the plan. What was it, and what did it cost you?",
      placeholder: "It came in around…",
    };
  }
  if (ctx.notDoneCount > 0 && ctx.moodValence === "negative") {
    return {
      id: "c-rough",
      invite: "Want to say what happened?",
      question:
        "What got in the way today? Plainly — this goes to your supervisor as context, not as an excuse you have to make.",
      placeholder: "What actually happened was…",
    };
  }
  return pickRotating(PROMPTS_GENERIC, [], `${seedKey}:prompt`);
}

// ── Dose ──────────────────────────────────────────────────────────────────────

/**
 * The celebration shrinks as the habit sets in. This is the anti-fatigue
 * mechanism variety alone can't provide: by report 60 the person needs no
 * convincing, so a four-second production has become a toll booth.
 */
export function intensityFor(ctx: RecognitionCtx, tone: ToneRegister): number {
  if (tone === "milestone") return 1;
  const n = ctx.submittedDays;
  if (n <= 5) return 1;
  if (n <= 20) return 0.8;
  if (n <= 60) return 0.62;
  return 0.5;
}

/**
 * Auto-dismiss timing, derived from the dose.
 *
 * The first version ran 3.2 to 4.0 seconds, which was too short to read the
 * headline, take in the animation and still reach the "tell me more" chip. The
 * window is now roughly 7.5 to 9 seconds, and about 11.5 on a milestone.
 *
 * Long is safe here because leaving is free: a tap anywhere closes it, Escape
 * closes it, and a hint saying so appears after 1.3 seconds. The cost of being
 * slightly too long is a second of waiting for somebody in a hurry. The cost of
 * being too short is that the one interactive thing on the screen is
 * unreachable, which is what was happening.
 */
export function dwellFor(intensity: number, tone: ToneRegister): number {
  const base = Math.round(6000 + 3000 * intensity);
  return tone === "milestone" ? base + 2500 : base;
}

// ── Token filling ─────────────────────────────────────────────────────────────

export function fillTokens(
  template: string,
  ctx: RecognitionCtx,
  milestoneLabel: string | null,
): string {
  const streakDays =
    ctx.streak > 1 ? `${ctx.streak} days running` : "another day";
  return (
    template
      .replace(/\{name\}/g, ctx.name || "there")
      .replace(/\{done\}/g, String(ctx.doneCount))
      .replace(/\{total\}/g, String(ctx.total))
      .replace(/\{cp\}/g, ctx.cpLabel || "the main one")
      .replace(
        /\{constraint\}/g,
        ctx.constraintLabel?.toLowerCase() || "the blocker",
      )
      .replace(/\{unplanned\}/g, String(ctx.unplannedCount))
      .replace(/\{streakDays\}/g, streakDays)
      .replace(/\{milestone\}/g, milestoneLabel || "another one in")
      // "1 thing(s)" reads like a bug report. Resolve the plural after filling.
      .replace(/\b1 thing\(s\)/g, "1 thing")
      .replace(/thing\(s\)/g, "things")
  );
}

/**
 * A copy variant is eligible only if every token it uses has real content
 * behind it. This is what stops "You got the one that mattered — the main one
 * is done" from ever reaching a screen.
 */
function copyIsEligible(v: CopyVariant, ctx: RecognitionCtx): boolean {
  const text = `${v.headline} ${v.subline}`;
  if (text.includes("{cp}") && !ctx.cpLabel) return false;
  if (text.includes("{constraint}") && !ctx.constraintLabel) return false;
  if (text.includes("{unplanned}") && ctx.unplannedCount === 0) return false;
  if (text.includes("{total}") && ctx.total === 0) return false;
  if (text.includes("{streakDays}") && ctx.streak < 2) return false;
  return true;
}

// ── The one call the component makes ──────────────────────────────────────────

/**
 * Resolve the full variant for a day. Pure — the rotation memory is passed in,
 * so this stays testable and callable from an effect.
 */
export function resolveVariant(
  ctx: RecognitionCtx,
  recent: RotationMemory,
): RecognitionVariant {
  const seedKey = `${ctx.eid}:${ctx.dateISO}`;
  const tone = toneFor(ctx);
  const milestoneLabel = milestoneFor(ctx);

  const scene = pickRotating(
    SCENES_BY_TONE[tone],
    recent.scene,
    `${seedKey}:scene`,
  ).id;

  const eligible = COPY_BY_TONE[tone].filter((v) => copyIsEligible(v, ctx));
  const copy = pickRotating(
    eligible.length > 0 ? eligible : COPY_BY_TONE[tone].slice(0, 1),
    recent.copy,
    `${seedKey}:copy`,
  );

  const layout = pickRotating(LAYOUTS, recent.layout, `${seedKey}:layout`).id;
  const intensity = intensityFor(ctx, tone);

  return {
    tone,
    scene,
    layout,
    copy: {
      id: copy.id,
      headline: fillTokens(copy.headline, ctx, milestoneLabel),
      subline: fillTokens(copy.subline, ctx, milestoneLabel),
    },
    prompt: promptFor(ctx, seedKey),
    intensity,
    dwellMs: dwellFor(intensity, tone),
    milestoneLabel,
  };
}
