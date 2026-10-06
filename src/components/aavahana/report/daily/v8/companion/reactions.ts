/**
 * The companion's brain. Deterministic but lively reactions.
 *
 * The daily report feels alive not because an LLM is wired in, but because the
 * guide reacts to what you actually did: your mood, which tasks got done, the
 * pattern in your blockers. Every function here takes real context and returns
 * a warm, simple, everyday line. The way a friend would say it, not a form.
 * No network, no key required. (If AI is configured, the exit panel still adds
 * real LLM feedback on top; this is the baseline liveness that always works.)
 */

export type Valence = "positive" | "neutral" | "negative";

export interface ReactionCtx {
  name: string;
  hour: number; // 0 to 23 local
  mood: { label: string; valence: Valence } | null;
  total: number;
  doneCount: number;
  partialCount: number;
  notDoneCount: number;
  cpLabel: string | null;
  cpDone: boolean;
  constraintLabel: string | null;
  smoothDay: boolean;
  recurring: { label: string; count: number; days: number } | null;
  navLabel: string | null;
}

/** Pick a variant. Browser runtime, so Math.random is fine here. */
function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)] ?? arr[0];
}

function fill(s: string, ctx: Partial<ReactionCtx>): string {
  return s
    .replace(/\{name\}/g, ctx.name || "there")
    .replace(/\{cp\}/g, ctx.cpLabel || "the main one")
    .replace(/\{constraint\}/g, ctx.constraintLabel || "that")
    .replace(/\{nav\}/g, ctx.navLabel || "that")
    .replace(/\{done\}/g, String(ctx.doneCount ?? 0))
    .replace(/\{total\}/g, String(ctx.total ?? 0));
}

/** Coarse valence from a feeling label. Drives tone and the background tint. */
export function feelingValence(label: string): Valence {
  const l = label.toLowerCase();
  if (/(energi|excit|inspir|thrill|proud|accompl|satisf|fulfill|confiden|happy|great|good|calm|content|grateful)/.test(l))
    return "positive";
  if (/(tired|fatigu|drain|exhaust|overwhelm|frustrat|stuck|annoy|anger|angry|anxio|worri|stress|nervous|sad|down|disappoint|discourag|rough|hard|bad|low)/.test(l))
    return "negative";
  return "neutral";
}

// 1. The opening greeting.

export function greet(ctx: ReactionCtx): string {
  const timeWord =
    ctx.hour < 5 ? "Hey" : ctx.hour < 12 ? "Morning" : ctx.hour < 17 ? "Hey" : "Evening";
  const openers = [
    `${timeWord}, {name}. How was your day?`,
    `${timeWord}, {name}. So, how did today go?`,
    `Hi {name}. How are you feeling about today?`,
    `${timeWord}, {name}. How did today feel for you?`,
  ];
  return fill(pick(openers), ctx);
}

// 2. Reaction to the mood, then on to the tasks.

export function afterMood(ctx: ReactionCtx): string {
  const byValence: Record<Valence, string[]> = {
    positive: [
      "Nice, glad it was a good one.",
      "Love to hear that.",
      "That's great.",
    ],
    neutral: [
      "Okay, a normal kind of day.",
      "Fair enough.",
      "Got it.",
    ],
    negative: [
      "Sorry it was a rough one.",
      "That's okay, hard days happen.",
      "Ah, sorry to hear that.",
    ],
  };
  const v = ctx.mood?.valence ?? "neutral";
  const q = pick([
    "What did you get done today?",
    "So what did you work on?",
    "Let's look at your tasks.",
  ]);
  return `${pick(byValence[v])} ${q}`;
}

// 3. Reaction to the tasks, then on to blockers.

export function afterWork(ctx: ReactionCtx): string {
  let react: string;
  if (ctx.total === 0) {
    react = pick([
      "No tasks planned for today.",
      "Nothing was on the plan today, that's okay.",
    ]);
  } else if (ctx.doneCount === ctx.total) {
    react = pick([
      "You finished everything. Really nice work.",
      "All done. That's a great day.",
      "Everything ticked off. Well done.",
    ]);
  } else if (ctx.cpLabel && ctx.cpDone) {
    react = fill(
      pick([
        "Good, you got the important one done ({cp}).",
        "You finished {cp}, and that was the one that mattered.",
        "{cp} is done, so that's the big win today.",
      ]),
      ctx,
    );
  } else if (ctx.doneCount === 0) {
    react = pick([
      "Looks like the day got away from you. It happens.",
      "None of it got done today. Some days are like that.",
    ]);
  } else {
    react = fill(
      pick([
        "{done} out of {total} done. Not bad.",
        "You got {done} done. A few are still open.",
        "Good chunk done today ({done} of {total}).",
      ]),
      ctx,
    );
  }
  // On to "what went well?". Tone-matched: on a day where nothing landed, the
  // bright version of this question reads as though nobody was listening, so
  // the hard-day variants ask for something small rather than something good.
  const roughDay = ctx.doneCount === 0 && ctx.total > 0;
  const q = roughDay
    ? pick([
        "Even so — was there anything good in there?",
        "Anything at all go well, even a small thing?",
        "Was there any part of it that went okay?",
      ])
    : pick([
        "What went well today?",
        "What's one thing that went well?",
        "Anything you'd call a win today?",
      ]);
  return `${react} ${q}`;
}

// 3b. Reaction to "what went well", then on to blockers.

const WIN_REACTIONS: Record<string, string[]> = {
  solved_hard: [
    "Solving the hard one is the part that counts.",
    "Difficult things are where the real work is.",
  ],
  learned: [
    "Learning something is never a wasted day.",
    "Good, that one compounds.",
  ],
  helped: [
    "Helping someone else counts, even when it isn't your work.",
    "That's the kind of thing nobody logs. Good that you did.",
  ],
  progress: [
    "Real progress is worth more than it feels like at the time.",
    "Moving it forward is the whole game.",
  ],
  finished: [
    "Finishing something is its own reward.",
    "Getting it over the line makes for a good day.",
  ],
};

/**
 * Several answers can be true at once, so this has to handle a list.
 *
 * With more than one picked, the companion says so rather than reacting to each
 * in turn: three sentences of praise for three taps is the flattery that makes
 * the whole thing feel automated. It names the count and reacts to the first,
 * which is enough to show it read the answer.
 */
export function afterWin(ctx: ReactionCtx, wentWell: string[]): string {
  const real = wentWell.filter((w) => w !== "nothing");

  let react: string;
  if (real.length === 0) {
    react = pick([
      "That's alright, not every day has a headline.",
      "Fair enough. Plenty of days are just days.",
      "That's okay. Some days just pass.",
    ]);
  } else if (real.length === 1) {
    react = pick(WIN_REACTIONS[real[0]] ?? ["Good."]);
  } else {
    const lead = pick(WIN_REACTIONS[real[0]] ?? ["Good."]);
    react = `${pick([
      `That's ${real.length} things in one day.`,
      `${real.length} good things, then.`,
      `More than one, which is a good day by any measure.`,
    ])} ${lead}`;
  }

  const q = pick([
    "Was anything a pain today?",
    "Did anything slow you down?",
    "Anything get in your way?",
  ]);
  return `${react} ${q}`;
}

// 4. Reaction to the blocker, then on to how they handled it.

export function afterConstraint(ctx: ReactionCtx, navComing: boolean): string {
  let react: string;
  if (ctx.smoothDay) {
    react = pick([
      "A smooth day with nothing in the way. Nice.",
      "Nothing got in your way? That's a good day.",
      "No blockers today. Enjoy that.",
    ]);
    return react + " " + pick(["Let's wrap up.", "Almost done."]);
  }
  if (ctx.recurring) {
    react = fill(
      pick([
        `"{constraint}" again? That's ${ctx.recurring.count} times this week. Might be worth sorting out for good.`,
        `"{constraint}" keeps coming back (${ctx.recurring.count} times lately). Worth a proper look maybe.`,
        `"{constraint}" once more. It's becoming a bit of a regular.`,
      ]),
      ctx,
    );
  } else {
    react = fill(
      pick([
        "Got it, {constraint}.",
        "Okay, {constraint}.",
        "Ah, {constraint}. Makes sense.",
      ]),
      ctx,
    );
  }
  const q = navComing
    ? pick([
        "So how did you deal with it?",
        "What did you do about it?",
        "How did you get past it?",
      ])
    : pick(["Let's finish up.", "Almost there."]);
  return `${react} ${q}`;
}

// 5. Reaction to how they handled it.

export function afterNav(ctx: ReactionCtx): string {
  const react = fill(
    pick([
      "Nice, {nav}. Good thinking.",
      `"{nav}", that's a smart way to handle it.`,
      "{nav}. Nice one.",
    ]),
    ctx,
  );
  const q = pick([
    "Want to add anything, or are you done?",
    "That's the main stuff. Anything else, or shall we finish?",
    "Good. Add a bit more, or call it a day?",
  ]);
  return `${react} ${q}`;
}

// 6. The sign off.

export function closing(ctx: ReactionCtx): string {
  return fill(
    pick([
      "That's your day done, {name}. The plant grew a little. See you tomorrow.",
      "All logged. Nice job showing up today, {name}. Get some rest.",
      "Done for today, {name}. Every one of these makes tomorrow easier. Night.",
    ]),
    ctx,
  );
}

/** Small nudge when the most important task gets marked done. */
export function cheerCriticalDone(ctx: ReactionCtx): string {
  return fill(
    pick(["Nice, the big one's done.", "There it is, {cp}.", "{cp} done. That's the one."]),
    ctx,
  );
}
