/**
 * Care lines. Small, varied moments of appreciation so arriving at (and
 * waiting inside) the daily report feels like someone noticed you showed up.
 * Plain, friendly words; no jargon, no em dashes, never the same line twice
 * in a row by accident of a large enough pool.
 */

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)] ?? arr[0];
}

const EVENING_WELCOME = [
  "There you are. Long day? This takes two minutes, and it's just for you.",
  "You've been going since morning and you're still here. That deserves a moment of notice.",
  "Somebody should ask how your day really went. So, how was it? Two minutes, that's all.",
  "Whatever today threw at you, you made it to the evening. Let's close it gently.",
  "Work is almost behind you. Two quiet minutes here, then the evening is yours.",
  "Tired is allowed. Give me two minutes and you're done for the day.",
  "However today went, you showed up, and that counts. Let's wrap it up quickly.",
  "This is the part where you stop, breathe, and give yourself some credit.",
];

const MORNING_WELCOME = [
  "Starting the day by closing the last one? Respect. This will be quick.",
  "Good to see you early. Two minutes here and it's off your plate.",
  "Fresh start today. Let's wrap this up quickly so you can get to it.",
];

const LATE_NIGHT_WELCOME = [
  "Still up? Let's make this the shortest part of your day.",
  "It's late. Two minutes here, then please get some rest.",
  "Burning the midnight oil. We'll keep this gentle and quick.",
];

const STREAK_WELCOME = [
  "Back again. Quietly consistent, and it shows.",
  "You keep showing up. Most people don't. Two minutes and you're done.",
  "Another day, another check-in. This habit is becoming yours.",
];

/**
 * The welcome screen's caring line. Time-aware, and when a streak exists it
 * sometimes acknowledges the consistency instead.
 */
export function pickWelcomeLine(hour: number, hasStreak: boolean): string {
  if (hasStreak && Math.random() < 0.4) return pick(STREAK_WELCOME);
  if (hour < 5) return pick(LATE_NIGHT_WELCOME);
  if (hour < 12) return pick(MORNING_WELCOME);
  return pick(EVENING_WELCOME);
}

const WAITING_LINES = [
  "You did your part for today. Sit back while the coach does some thinking.",
  "Take a breath, you've earned it. This won't take long.",
  "Thanks for taking these minutes for yourself. Nearly there.",
  "The report's in. Relax for a moment while the notes get written.",
  "Nothing more needed from you. Just a moment while this comes together.",
];

/** The caring caption while the AI writes its notes. */
export function pickWaitingLine(): string {
  return pick(WAITING_LINES);
}
