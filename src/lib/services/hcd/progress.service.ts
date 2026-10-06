import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";

export interface ProgressStreak {
  current: number;
  longest: number;
  lastActiveDate: string | null;
}

export interface ProgressWeekDay {
  date: string;
  active: boolean;
}

export interface ProgressTotals {
  assessmentsCompleted: number;
  drillsCompleted: number;
  initiativesVerified: number;
}

export type ProgressEventType =
  | "assessment_completed"
  | "drill_completed"
  | "initiative_created"
  | "initiative_submitted"
  | "initiative_verified";

export interface ProgressEvent {
  type: ProgressEventType;
  at: string;
  label: string;
}

export interface MyProgress {
  streak: ProgressStreak;
  activeDays: number;
  week: ProgressWeekDay[];
  totals: ProgressTotals;
  recentActivity: ProgressEvent[];
}

const BASE = "/v3/pdgms/hcd/progress";

export class HcdProgressService {
  static async getMine(): Promise<ApiResult<MyProgress>> {
    return api.get<MyProgress>(`${BASE}/mine`);
  }
}
