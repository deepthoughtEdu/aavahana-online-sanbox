/**
 * Is this actually writing, or did somebody hold a key down?
 *
 * WHY THIS IS DELIBERATELY BLUNT
 * A free-text answer on the daily report feeds the learning suggestions, so
 * junk in it produces junk out. But the cost of the two mistakes is not
 * symmetric. Letting "asdfasdf" through wastes one suggestion. Rejecting a real
 * answer stops somebody filing their report, and they will remember that and
 * stop writing anything at all.
 *
 * So every rule here is structural rather than lexical. Nothing checks whether
 * words are in a dictionary, because the people writing these use product names
 * (Aavahana, Niyanta), initialisms (LDI, PDCA, QA), colleagues' names, and
 * Hinglish. A dictionary would reject all of it and would be right about none
 * of it.
 *
 * WHAT IT CANNOT DO
 * It catches lazy junk, not determined junk. "the the and and the and" passes
 * every rule below. That is accepted: the goal is to catch a keyboard being
 * mashed to get past a field, not to police effort.
 */

/** Words, for counting. Matches the counter shown under the field. */
export function countWords(s: string): number {
  const t = s.trim();
  return t ? t.split(/\s+/).length : 0;
}

/** The most a free-text answer may be. Beyond this it stops being a report. */
export const MAX_ANSWER_WORDS = 250;

/** Trim to the cap, keeping whole words. */
export function clampWords(s: string, max = MAX_ANSWER_WORDS): string {
  const parts = s.trim().split(/\s+/);
  if (parts.length <= max) return s;
  return parts.slice(0, max).join(" ");
}

const VOWEL = /[aeiouyà-ÿ]/i;

/**
 * The three keyboard rows. A run along one of them is the signature of somebody
 * dragging a finger across the keys, and no real word contains five of them in
 * order: "asdfg", "qwert" and "zxcvb" appear in nothing anybody writes.
 *
 * Checked in both directions, because people drag both ways.
 */
const KEYBOARD_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const KEYBOARD_RUN = 5;

function hasKeyboardRun(token: string): boolean {
  if (token.length < KEYBOARD_RUN) return false;
  for (let i = 0; i + KEYBOARD_RUN <= token.length; i += 1) {
    const window = token.slice(i, i + KEYBOARD_RUN);
    const backwards = window.split("").reverse().join("");
    if (KEYBOARD_ROWS.some((r) => r.includes(window) || r.includes(backwards))) {
      return true;
    }
  }
  return false;
}

/**
 * Longest run of consonants in a row.
 *
 * Six is the threshold. English tops out around five ("strengths" ends in
 * "ngths"), and the transliterated Hindi people write here stays well under it.
 * "asdfghjkl" has eight after its leading a.
 */
function longestConsonantRun(token: string): number {
  let run = 0;
  let best = 0;
  for (const ch of token) {
    if (VOWEL.test(ch)) run = 0;
    else {
      run += 1;
      if (run > best) best = run;
    }
  }
  return best;
}

/** Letter-bearing tokens. Numbers and punctuation are ignored, not judged. */
function letterTokens(s: string): string[] {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zà-ÿ]/gi, ""))
    .filter(Boolean);
}

/**
 * True when the text almost certainly is not writing.
 *
 * Each rule targets one specific way people defeat a required field, and each
 * is set loose enough that ordinary short answers pass. "Slow day, nothing
 * moved." and "Aaj theek tha, kaam ho gaya" both pass; so does "QA blocked,
 * PDCA helped."
 */
export function looksLikeGibberish(s: string): boolean {
  const text = s.trim();
  if (!text) return false; // Empty is empty, not gibberish. Let required-ness decide.

  const tokens = letterTokens(text);

  // Nothing but digits, punctuation or symbols. "..........", "12345".
  if (tokens.length === 0) return true;

  // Not one pronounceable token in the whole answer: "sdfgh jklm qwrt".
  // Real text has vowels somewhere, in every language this product sees.
  if (!tokens.some((t) => VOWEL.test(t))) return true;

  // One long unbroken run of letters. Nobody types a 20-letter word into a
  // daily report; a held-down key or a face on the keyboard does.
  if (tokens.some((t) => t.length >= 20)) return true;

  // A finger dragged along a keyboard row: "asdfghjkl", "qwertyuiop".
  if (tokens.some(hasKeyboardRun)) return true;

  // Unpronounceable: six consonants with no vowel between them.
  if (tokens.some((t) => longestConsonantRun(t) >= 6)) return true;

  // The same word over and over: "test test test test test test".
  if (tokens.length >= 6) {
    const distinct = new Set(tokens).size;
    if (distinct <= 2) return true;
  }

  // Barely any distinct letters across a long answer: "aaaa bbbb aaaa bbbb".
  const letters = tokens.join("");
  if (letters.length >= 12 && new Set(letters).size <= 4) return true;

  return false;
}

/**
 * Whether a free-text answer is good enough to submit on a path that requires
 * one. Length and structure only, and the message says which failed so the
 * person can fix it rather than guess.
 */
export function checkAnswer(
  s: string,
  minWords: number,
): { ok: true } | { ok: false; message: string } {
  const words = countWords(s);
  if (words < minWords) {
    const need = minWords - words;
    return {
      ok: false,
      message: `${need} more word${need === 1 ? "" : "s"} and you're done.`,
    };
  }
  if (looksLikeGibberish(s)) {
    return {
      ok: false,
      message: "That doesn't look like words. A short honest line is fine.",
    };
  }
  return { ok: true };
}
