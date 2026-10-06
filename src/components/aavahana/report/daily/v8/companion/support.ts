import type { ReactionCtx } from "./reactions";

export type CareNeed = "listen" | "lighter_tomorrow" | "work_problem" | "quick";

export type TomorrowStep =
  | "protect_focus"
  | "ask_for_help"
  | "move_one_task"
  | "smallest_step";

export interface CareChoice {
  id: CareNeed;
  label: string;
  description: string;
}

export interface TomorrowChoice {
  id: TomorrowStep;
  label: string;
}

export const CARE_CHOICES: CareChoice[] = [
  {
    id: "listen",
    label: "Let me talk it out",
    description: "Give me a private space to get the day out of my head.",
  },
  {
    id: "lighter_tomorrow",
    label: "Make tomorrow lighter",
    description: "Help me choose one small change for the next workday.",
  },
  {
    id: "work_problem",
    label: "Help with the work problem",
    description: "Help me name what got in the way and what I can do next.",
  },
  {
    id: "quick",
    label: "Just keep this quick",
    description: "Acknowledge it and help me finish the report quickly.",
  },
];

export const TOMORROW_CHOICES: TomorrowChoice[] = [
  { id: "protect_focus", label: "Protect one quiet focus block" },
  { id: "ask_for_help", label: "Ask someone for help early" },
  { id: "move_one_task", label: "Move one non-critical task" },
  { id: "smallest_step", label: "Start with the smallest useful step" },
];

export function shouldOfferCare(ctx: ReactionCtx): boolean {
  return ctx.mood?.valence === "negative";
}

export function offerCare(ctx: ReactionCtx): string {
  const feeling = ctx.mood?.label.trim().toLowerCase() || "difficult";
  return `You said today felt ${feeling}. Before we talk about tasks, what would help you most right now?`;
}

export function afterCare(
  need: CareNeed | null,
  tomorrowStep: TomorrowStep | null,
): string {
  if (need === "listen") {
    return "When you're ready, let's look at the practical part of the day. What did you get done?";
  }

  if (need === "lighter_tomorrow") {
    const step = TOMORROW_CHOICES.find((choice) => choice.id === tomorrowStep);
    return step
      ? `Good. Keep just this one thing in view: ${step.label.toLowerCase()}. Now, what did you get done today?`
      : "Good. One small change is enough for tomorrow. What did you get done today?";
  }

  if (need === "work_problem") {
    return "You can decide what to do with that next step. What did you get done today?";
  }

  return "Understood. We'll keep this short. What did you get done today?";
}
