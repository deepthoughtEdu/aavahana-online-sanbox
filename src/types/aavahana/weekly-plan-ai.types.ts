// BYOK weekly-plan AI: draft + critique returned by /weekly-cadence/ai/plan.

export interface WeeklyPlanAiDeliverable {
  label: string;
  quantity: number;
  day?: string | null;
}

export interface WeeklyPlanAiTimeBlock {
  day: string;
  block: string;
  activity: string;
}

export interface WeeklyPlanAiLearning {
  title: string;
  note: string;
}

export interface WeeklyPlanAiCritique {
  type: string; // carryover | blocker | overcommitment | capacity | focus | risk | note
  message: string;
}

export interface WeeklyPlanAiRisk {
  title: string;
}

export interface WeeklyPlanAiDraft {
  narrative: string;
  deliverables: WeeklyPlanAiDeliverable[];
  timetable: WeeklyPlanAiTimeBlock[];
  learning: WeeklyPlanAiLearning[];
  risks: WeeklyPlanAiRisk[];
}

export interface WeeklyPlanAiResponse {
  weekStart: string;
  draft: WeeklyPlanAiDraft;
  critique: WeeklyPlanAiCritique[];
  daysIncluded: number;
  provider: string;
  model: string;
  generatedAt: string;
}
