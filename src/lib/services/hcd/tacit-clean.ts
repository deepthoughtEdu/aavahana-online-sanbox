// Deterministic cleaning for the tacit-knowledge dataset.
//
// The point of this module: turn a free-text reflection a Fellow typed at the
// end of an assessment into a training example, WITHOUT sending it through an
// LLM. Every transform here is a fixed rule, so the export carries the Fellow's
// own words — never a paraphrase a model might have invented. Low-signal
// entries are dropped, not rewritten.

/** One reflection as the server returns it — no author identity, by design. */
export interface RawReflection {
  /** The assessment attempt the reflection closed. */
  id: number;
  blockId: number;
  frameworkKey: string;
  frameworkName: string;
  gridCells: string[];
  rawText: string;
  submittedAt: string;
}

/** One line of the JSONL export. Carries no identity — see reviewRows for that. */
export interface TrainingRecord {
  id: number;
  framework: string;
  frameworkName: string;
  gridCells: string[];
  prompt: string;
  completion: string;
  charCount: number;
  sentenceCount: number;
  redactions: string[];
  source: "hcd-assessment-reflection";
  capturedAt: string;
}

export interface ReviewRow {
  raw: RawReflection;
  record: TrainingRecord | null;
  status: "included" | "excluded";
  /** Why an entry was dropped, or what cleaning changed when it was kept. */
  note: string;
  redactions: string[];
}

// Openers and closers people add to hit a character count. They carry no signal
// and, left in, teach a model to hedge and pad. Matched at the start of the
// text or of any sentence, case-insensitively.
const FILLER_PREFIXES = [
  "in this reflection i will explain how i will use this framework in my current work",
  "in this reflection i will explain how i would use this framework",
  "in this reflection i will explain",
  "in this reflection i want to explain",
  "for this reflection",
  "as asked",
  "as requested",
  "to be honest",
  "honestly speaking",
  "honestly",
  "basically",
  "essentially",
  "i think that",
  "i just want to say that",
  "i would say that",
];

// Whole sentences that are pure filler once trimmed of punctuation.
const FILLER_SENTENCES = [
  "thanks",
  "thank you",
  "thanks in advance",
  "hope this helps",
  "hope that helps",
  "that is all",
  "thats all",
  "that's all",
  "nothing else to add",
  "end of reflection",
];

const LOW_VALUE_SENTENCE = /^(n\/?a|idk|i dont know|i don't know|not sure|no comment|dunno|tbh|na)\.?$/i;

const MIN_SENTENCE_WORDS = 4;
const MIN_CLEAN_CHARS = 120;
const MIN_SENTENCES = 2;
// A near-duplicate is a sentence that opens with the same first four words as
// another. Above this share, the entry is padding.
const NEAR_DUP_LIMIT = 0.5;

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/ /g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/ *\n */g, "\n")
    .trim();
}

// Contact details are not tacit knowledge and must not enter a training corpus.
// Order matters: emails and URLs are pulled before the bare phone pass so their
// digits are not mistaken for a number.
function redact(text: string): { text: string; kinds: string[] } {
  const kinds = new Set<string>();
  let out = text;

  out = out.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, () => {
    kinds.add("email");
    return "[email]";
  });
  out = out.replace(/\bhttps?:\/\/[^\s)]+/gi, () => {
    kinds.add("url");
    return "[url]";
  });
  out = out.replace(/\bwww\.[^\s)]+/gi, () => {
    kinds.add("url");
    return "[url]";
  });
  out = out.replace(/@[A-Za-z0-9_]{2,}/g, () => {
    kinds.add("handle");
    return "[handle]";
  });
  // 8+ digit runs, tolerating spaces / dashes / a leading +country code.
  out = out.replace(/(?:\+\d{1,3}[\s-]?)?(?:\d[\s-]?){8,}\d/g, (m) => {
    if ((m.match(/\d/g) ?? []).length < 8) return m;
    kinds.add("phone");
    return "[phone]";
  });

  return { text: out, kinds: [...kinds] };
}

function stripPrefix(sentence: string): string {
  let s = sentence.trim();
  let changed = true;
  while (changed) {
    changed = false;
    const lower = s.toLowerCase();
    for (const p of FILLER_PREFIXES) {
      if (lower.startsWith(p)) {
        const rest = s.slice(p.length).replace(/^[\s,;:.-]+/, "");
        s = rest;
        changed = true;
        break;
      }
    }
  }
  if (s) s = s.charAt(0).toUpperCase() + s.slice(1);
  return s;
}

function splitSentences(text: string): string[] {
  return text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((s) => s.trim())
    .filter(Boolean);
}

function wordCount(s: string): number {
  return (s.match(/[A-Za-z0-9]+/g) ?? []).length;
}

function stemKey(s: string): string {
  return (s.toLowerCase().match(/[a-z0-9]+/g) ?? []).slice(0, 4).join(" ");
}

function buildPrompt(frameworkName: string): string {
  return `How will you apply the ${frameworkName} framework in your current work?`;
}

interface CleanOutcome {
  completion: string;
  sentenceCount: number;
  redactions: string[];
  changed: string[];
}

function cleanText(raw: string): CleanOutcome {
  const changed: string[] = [];

  const { text: redacted, kinds } = redact(normalizeWhitespace(raw));
  if (kinds.length) changed.push(`redacted ${kinds.join(", ")}`);

  const kept: string[] = [];
  const seen = new Set<string>();
  let droppedFiller = 0;
  let droppedShort = 0;
  let droppedDup = 0;

  for (const original of splitSentences(redacted)) {
    const stripped = stripPrefix(original);
    if (!stripped) {
      droppedFiller++;
      continue;
    }
    const bare = stripped.toLowerCase().replace(/[.!?]+$/, "").trim();
    if (FILLER_SENTENCES.includes(bare) || LOW_VALUE_SENTENCE.test(stripped)) {
      droppedFiller++;
      continue;
    }
    if (wordCount(stripped) < MIN_SENTENCE_WORDS) {
      droppedShort++;
      continue;
    }
    const norm = bare.replace(/\s+/g, " ");
    if (seen.has(norm)) {
      droppedDup++;
      continue;
    }
    seen.add(norm);
    kept.push(stripped);
  }

  if (droppedFiller) changed.push(`removed ${droppedFiller} filler line(s)`);
  if (droppedShort) changed.push(`removed ${droppedShort} fragment(s)`);
  if (droppedDup) changed.push(`removed ${droppedDup} repeated line(s)`);

  const completion = kept
    .map((s) => (/[.!?]$/.test(s) ? s : `${s}.`))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    completion,
    sentenceCount: kept.length,
    redactions: kinds,
    changed,
  };
}

function nearDupShare(completion: string): number {
  const sentences = splitSentences(completion);
  if (sentences.length < 3) return 0;
  const groups = new Map<string, number>();
  for (const s of sentences) {
    const key = stemKey(s);
    groups.set(key, (groups.get(key) ?? 0) + 1);
  }
  const inDup = [...groups.values()]
    .filter((n) => n >= 2)
    .reduce((a, n) => a + n, 0);
  return inDup / sentences.length;
}

function uniqueWordRatio(completion: string): number {
  const words = (completion.toLowerCase().match(/[a-z0-9]+/g) ?? []);
  if (!words.length) return 0;
  return new Set(words).size / words.length;
}

export function cleanReflection(raw: RawReflection): ReviewRow {
  const { completion, sentenceCount, redactions, changed } = cleanText(raw.rawText);

  const reject = (note: string): ReviewRow => ({
    raw,
    record: null,
    status: "excluded",
    note,
    redactions,
  });

  if (completion.length < MIN_CLEAN_CHARS) {
    return reject(
      `Too little usable content after cleaning (${completion.length} characters).`
    );
  }
  if (sentenceCount < MIN_SENTENCES) {
    return reject("Fewer than two usable sentences after cleaning.");
  }
  if (nearDupShare(completion) >= NEAR_DUP_LIMIT) {
    return reject("Too repetitive — most sentences restate one another.");
  }
  if (uniqueWordRatio(completion) < 0.35) {
    return reject("Low vocabulary variety — reads as padded text.");
  }

  const record: TrainingRecord = {
    id: raw.id,
    framework: raw.frameworkKey,
    frameworkName: raw.frameworkName,
    gridCells: raw.gridCells,
    prompt: buildPrompt(raw.frameworkName),
    completion,
    charCount: completion.length,
    sentenceCount,
    redactions,
    source: "hcd-assessment-reflection",
    capturedAt: raw.submittedAt,
  };

  return {
    raw,
    record,
    status: "included",
    note: changed.length ? changed.join("; ") : "No changes needed.",
    redactions,
  };
}

export interface TacitDataset {
  rows: ReviewRow[];
  stats: {
    total: number;
    included: number;
    excluded: number;
    withRedactions: number;
    byFramework: Array<{
      frameworkKey: string;
      frameworkName: string;
      included: number;
      excluded: number;
    }>;
  };
}

export function buildDataset(raws: RawReflection[]): TacitDataset {
  const rows = raws
    .slice()
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .map(cleanReflection);

  const frameworkOrder: string[] = [];
  const byKey = new Map<
    string,
    { frameworkKey: string; frameworkName: string; included: number; excluded: number }
  >();
  for (const row of rows) {
    const key = row.raw.frameworkKey;
    if (!byKey.has(key)) {
      frameworkOrder.push(key);
      byKey.set(key, {
        frameworkKey: key,
        frameworkName: row.raw.frameworkName,
        included: 0,
        excluded: 0,
      });
    }
    const bucket = byKey.get(key)!;
    if (row.status === "included") bucket.included++;
    else bucket.excluded++;
  }

  return {
    rows,
    stats: {
      total: rows.length,
      included: rows.filter((r) => r.status === "included").length,
      excluded: rows.filter((r) => r.status === "excluded").length,
      withRedactions: rows.filter((r) => r.redactions.length > 0).length,
      byFramework: frameworkOrder.map((k) => byKey.get(k)!),
    },
  };
}

export function toJsonl(rows: ReviewRow[]): string {
  return rows
    .filter((r) => r.record)
    .map((r) => JSON.stringify(r.record))
    .join("\n");
}
