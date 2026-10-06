import type { PlannedDeliverable } from "@/types/aavahana/report-engine.types";
import type {
  V7Dictionaries,
  V7SynthesizeResponse,
} from "@/types/aavahana/report-v7.types";
import { needsReportExplanation } from "@/utils/aavahana/report-explanation";
import type { V8Selection } from "../types";

/**
 * "Help me with my report": the rules behind the helper, kept apart from the
 * screen so they can be tested on their own.
 *
 * The model's part is small on purpose. It reads the person's answers and says
 * which task went how, what got in the way and how they felt, picking from the
 * same lists the report's own chips use. Everything the person reads is written
 * here: the questions, the sentence about their day, the labels. The narrative
 * is their own words, quoted by the backend rather than rewritten.
 */

/** The parts of the report the helper can fill in, as the report holds them. */
export interface ReportDraft {
  deliverables: PlannedDeliverable[];
  feeling: V8Selection | null;
  constraint: V8Selection | null;
  navigation: V8Selection | null;
  /** Never changed by the helper. Carried so the explanation rule can see it. */
  framework: V8Selection | null;
  smoothDay: boolean;
  smoothDayNote: string;
  narrative: string;
  wentWell: string[];
}

export type Proposal = V7SynthesizeResponse["proposed"];

/** The longest exchange the backend accepts. */
export const MAX_EXCHANGE = 12;

export const CHANGE_QUESTION =
  "What would you like to add or change? Say it or type it, and I'll update the report.";

/** Shown instead of a question when the report already has everything the helper would ask. */
export const READY_MESSAGE =
  "Your report already has your answers. Here it is: submit it, or tell me what to add or change.";

/**
 * The three statuses in the words people use. The report stores them as done,
 * partial and not_done.
 */
export const STATUS_CHOICES: { id: NonNullable<PlannedDeliverable["status"]>; label: string }[] = [
  { id: "done", label: "Done" },
  { id: "partial", label: "In progress" },
  { id: "not_done", label: "Not started" },
];

export function statusLabel(status: PlannedDeliverable["status"]): string | null {
  return STATUS_CHOICES.find((c) => c.id === status)?.label ?? null;
}

function listNames(labels: string[]): string {
  const quoted = labels.map((label) => `"${label}"`);
  if (quoted.length === 1) return quoted[0];
  return `${quoted.slice(0, -1).join(", ")} and ${quoted[quoted.length - 1]}`;
}

/** The tasks a question is about: named when there are few, counted when many. */
function whichTasks(open: PlannedDeliverable[], all: PlannedDeliverable[]): string {
  if (open.length <= 3) return listNames(open.map((t) => t.label));
  return open.length === all.length
    ? `your ${open.length} planned tasks`
    : `the ${open.length} tasks not marked yet`;
}

/**
 * The opening question for a report with nothing in it yet. It asks how far
 * each task got rather than how it went: "it went well" says nothing about
 * whether a task is finished, and a status read into an answer like that is
 * how an unfinished task got marked Done.
 */
export function firstQuestion(tasks: PlannedDeliverable[]): string {
  if (tasks.length === 0) {
    return "Tell me about your day. What did you work on, and did anything slow you down?";
  }
  return `Tell me about your day. How far did you get with ${whichTasks(tasks, tasks)}, and did anything slow you down?`;
}

/** Whether the report already holds anything the person said or picked. */
export function hasAnswers(report: ReportDraft): boolean {
  return (
    report.deliverables.some((d) => d.status !== null) ||
    report.feeling !== null ||
    report.constraint !== null ||
    report.smoothDay ||
    report.wentWell.length > 0 ||
    report.narrative.trim() !== "" ||
    report.smoothDayNote.trim() !== ""
  );
}

/**
 * The helper's first question, asking only for what the report does not say
 * yet. A task already marked is not asked about again, and "did anything slow
 * you down" is not asked once the report has a blocker or a smooth day.
 *
 * Null when nothing is missing: the helper then opens on the report itself.
 */
export function openingQuestion(report: ReportDraft): string | null {
  const tasks = report.deliverables;
  const open = tasksWithoutStatus(report);
  const blockerKnown = report.constraint !== null || report.smoothDay;
  if (tasks.length === 0) return blockerKnown ? null : firstQuestion([]);
  if (open.length > 0 && !blockerKnown) {
    return `Tell me about your day. How far did you get with ${whichTasks(open, tasks)}, and did anything slow you down?`;
  }
  if (open.length > 0) {
    return `How far did you get with ${whichTasks(open, tasks)}? Tell me anything else about your day too.`;
  }
  if (!blockerKnown) {
    return "Did anything slow you down today? Tell me anything else about your day too.";
  }
  return null;
}

/**
 * Asked when the answer did not say where some tasks stand. It comes with a row
 * of three choices for each of those tasks, so ten unplaced tasks take ten taps
 * rather than ten more questions, and no status is guessed or left blank.
 * Answering in words still works.
 */
export function statusQuestion(missing: PlannedDeliverable[]): string {
  return missing.length === 1
    ? `Where is "${missing[0].label}" now: done, in progress, or not started yet?`
    : "Where is each of these now? Tap one for each, or tell me in your own words.";
}

export function tasksWithoutStatus(draft: ReportDraft): PlannedDeliverable[] {
  return draft.deliverables.filter((d) => d.status === null);
}

/** The same test the report's own submit button uses. */
export function readyToSubmit(draft: ReportDraft): boolean {
  return draft.deliverables.length > 0 && tasksWithoutStatus(draft).length === 0;
}

/** Whether submitting will first ask for the longer written note. */
export function needsLongerExplanation(draft: ReportDraft): boolean {
  return needsReportExplanation({
    constraintMacroId: draft.constraint?.macroId,
    frameworkMacroId: draft.framework?.macroId,
    frameworkMicroId: draft.framework?.microId,
    narrative: draft.narrative,
    smoothDayNote: draft.smoothDayNote,
  });
}

function pick(
  options: { id: string; label: string }[] | undefined,
  id: string | null,
): { id: string; label: string } | null {
  if (!id || !options) return null;
  return options.find((o) => o.id === id) ?? null;
}

/**
 * The report with the model's proposal applied.
 *
 * Built from the report as it was when the helper opened, never from the last
 * draft: each proposal reads the whole exchange, corrections included, so it
 * is already the complete picture. Only what the proposal names changes.
 *
 * Every id is looked up in the lists the report's own chips use, so a draft can
 * only hold answers the person could have tapped themselves. An id those lists
 * do not have is ignored.
 */
export function applyProposal(
  base: ReportDraft,
  proposal: Proposal,
  dictionaries: V7Dictionaries,
): ReportDraft {
  const next: ReportDraft = { ...base };

  if (proposal.taskStatuses.length > 0) {
    const statusById = new Map(
      proposal.taskStatuses.map((t) => [String(t.id), t.status] as const),
    );
    next.deliverables = base.deliverables.map((d) => {
      const status = statusById.get(String(d.id));
      return status ? { ...d, status } : d;
    });
  }

  // The mood step records the broad feeling only, so the draft does too.
  const feeling = pick(dictionaries.feelings.macro, proposal.feelingMacroId);
  if (feeling) {
    next.feeling = {
      macroId: feeling.id,
      macroLabel: feeling.label,
      microId: null,
      microLabel: null,
    };
  }

  const blocker = pick(dictionaries.constraints.macro, proposal.constraintMacroId);
  if (blocker) {
    const detail = pick(dictionaries.constraints.micro[blocker.id], proposal.constraintMicroId);
    next.constraint = {
      macroId: blocker.id,
      macroLabel: blocker.label,
      microId: detail?.id ?? null,
      microLabel: detail?.label ?? null,
    };
    next.smoothDay = false;
    // The same blocker keeps the way round it they already picked.
    const sameBlocker =
      base.constraint?.macroId === blocker.id &&
      (base.constraint?.microId ?? null) === (detail?.id ?? null);
    next.navigation = sameBlocker ? base.navigation : null;
    const ways = detail ? dictionaries.navigations[detail.id] : undefined;
    const way = ways ? pick(ways.macro, proposal.navigationMacroId) : null;
    if (ways && way) {
      const wayDetail = pick(ways.micro[way.id], proposal.navigationMicroId);
      next.navigation = {
        macroId: way.id,
        macroLabel: way.label,
        microId: wayDetail?.id ?? null,
        microLabel: wayDetail?.label ?? null,
      };
    }
  } else if (proposal.smoothDayNote?.trim()) {
    next.smoothDay = true;
    next.smoothDayNote = proposal.smoothDayNote.trim();
    next.constraint = null;
    next.navigation = null;
  }

  // Their words are added to what the report already says, never swapped for
  // it: the helper may have been opened on a report that was half written.
  const words = proposal.narrative?.trim();
  if (words && !base.narrative.includes(words)) {
    next.narrative = base.narrative.trim() ? `${base.narrative.trim()}\n\n${words}` : words;
  }

  // Went-well answers add to the ones already picked. "Nothing specific" never
  // sits beside a real answer, the same rule the report's own chips follow.
  if (proposal.wentWell.length > 0) {
    const merged = Array.from(new Set([...base.wentWell, ...proposal.wentWell]));
    next.wentWell = merged.length > 1 ? merged.filter((id) => id !== "nothing") : merged;
  }
  return next;
}

/**
 * One sentence about the day, chosen from what the draft says. Written here
 * from the task counts and the blocker, so it can never praise a day the report
 * does not describe.
 */
export function dayLine(draft: ReportDraft): string {
  const tasks = draft.deliverables;
  const done = tasks.filter((d) => d.status === "done").length;
  const moved = tasks.filter((d) => d.status === "done" || d.status === "partial").length;
  if (tasks.length > 0 && done === tasks.length) {
    return "You finished everything you planned today. Good work.";
  }
  if (moved > 0 && draft.constraint) {
    return `You moved ${moved} of ${tasks.length} tasks forward, even with something in the way.`;
  }
  if (moved > 0) return `You moved ${moved} of ${tasks.length} tasks forward today.`;
  if (draft.constraint) {
    return "Today got stuck, and your report now says why. That makes tomorrow easier to plan.";
  }
  return "Here is your day as you described it.";
}

/** The lines of the draft the person reads, in the report's own order. */
export function draftFacts(
  draft: ReportDraft,
  wentWellOptions: { id: string; label: string }[],
): { term: string; value: string }[] {
  const facts: { term: string; value: string }[] = [];
  if (draft.feeling) facts.push({ term: "How you felt", value: draft.feeling.macroLabel });
  const wentWell = wentWellOptions
    .filter((o) => draft.wentWell.includes(o.id))
    .map((o) => o.label);
  if (wentWell.length > 0) facts.push({ term: "What went well", value: wentWell.join(", ") });
  if (draft.smoothDay) {
    facts.push({ term: "What got in the way", value: "Nothing, it was a smooth day" });
  }
  if (draft.constraint) {
    facts.push({
      term: "What got in the way",
      value: draft.constraint.microLabel ?? draft.constraint.macroLabel,
    });
  }
  if (draft.navigation) {
    facts.push({
      term: "What you did about it",
      value: draft.navigation.microLabel ?? draft.navigation.macroLabel,
    });
  }
  return facts;
}

/**
 * A fingerprint of what the report says. The helper is keyed on it, so a report
 * changed outside the helper (in the steps, or by using the helper's own draft)
 * starts the helper again from what the report says now. Without this, a draft
 * built on the report as it was could overwrite the newer answers on submit.
 */
export function reportKey(report: ReportDraft): string {
  return JSON.stringify([
    report.deliverables.map((d) => [d.id, d.status]),
    report.feeling?.macroId ?? null,
    report.constraint ? [report.constraint.macroId, report.constraint.microId] : null,
    report.navigation ? [report.navigation.macroId, report.navigation.microId] : null,
    report.framework ? [report.framework.macroId, report.framework.microId] : null,
    report.smoothDay,
    report.smoothDayNote,
    report.wentWell,
    report.narrative,
  ]);
}
