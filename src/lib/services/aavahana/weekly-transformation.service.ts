import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";

// Weekly Plan Transformation (W1.2) — per-level questions, report calibration,
// and recurring-constraint → Improvement Object filing.
export interface WeeklyQuestion {
  key: string;
  prompt: string;
  type: string;
  options?: string[];
  maxLen?: number;
  refPlanKey?: string;
  priorAnswer?: unknown;
}

export interface PlanQuestions {
  level: string;
  questions: WeeklyQuestion[];
}

export interface ReportQuestions {
  level: string;
  questions: WeeklyQuestion[];
  contextPhase: "raw" | "trailing" | "peer";
}

export interface FileConstraintResult {
  recurring: boolean;
  initiative?: { id: number; title: string; status: string };
}

export interface QuestionAnswer {
  key: string;
  value: unknown;
  refPlanKey?: string;
}

const BASE = "/v3/pdgms/loops";

function qs(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export class WeeklyTransformationService {
  static async getPlanQuestions(level?: string): Promise<ApiResult<PlanQuestions>> {
    return api.get<PlanQuestions>(`${BASE}/weekly-plan/questions${qs({ level })}`);
  }

  static async getReportQuestions(
    level?: string,
    weekStart?: string
  ): Promise<ApiResult<ReportQuestions>> {
    return api.get<ReportQuestions>(`${BASE}/weekly-report/questions${qs({ level, weekStart })}`);
  }

  static async savePlanAnswers(
    answers: QuestionAnswer[],
    weekStart?: string,
    level?: string
  ): Promise<ApiResult<{ id: number; level: string; questionAnswers: QuestionAnswer[] }>> {
    return api.post(`${BASE}/weekly-plan/answers`, { weekStart, answers, level });
  }

  static async saveReportAnswers(
    weekStart: string,
    answers: QuestionAnswer[],
    level?: string
  ): Promise<ApiResult<{ id: number; level: string; questionAnswers: QuestionAnswer[] }>> {
    return api.post(`${BASE}/weekly-report/answers`, { weekStart, answers, level });
  }

  static async fileRecurringConstraint(
    level?: string,
    weeks?: number
  ): Promise<ApiResult<FileConstraintResult>> {
    return api.post<FileConstraintResult>(`${BASE}/weekly-report/file-constraint`, { level, weeks });
  }
}
