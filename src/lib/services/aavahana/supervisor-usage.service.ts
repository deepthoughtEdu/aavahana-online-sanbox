import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";

// Supervisor usage grid (W2.4) — per reportee per week.
export interface UsageRow {
  eid: number;
  name: string;
  dailyPlans: number;
  dailyReports: number;
  weeklyPlanFiled: boolean;
  weeklyReportFiled: boolean;
  lndAttended: number;
}

export interface UsageGrid {
  weekStart: string | null;
  reportees: UsageRow[];
}

export class SupervisorUsageService {
  static async getUsageGrid(weekStart?: string): Promise<ApiResult<UsageGrid>> {
    const q = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : "";
    return api.get<UsageGrid>(`/v3/pdgms/loops/supervisor-usage${q}`);
  }
}
