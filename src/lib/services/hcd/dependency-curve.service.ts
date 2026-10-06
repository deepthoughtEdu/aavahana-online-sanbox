import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import { ExportService } from "@/lib/services/shared/export.service";

// Growth Execution W3.3 — the dependency curve.
// Per client (org), per month: the share of newly-originated Improvement Objects
// that client employees originated independently (not coached). Zero-activity
// months read 0% honestly — the backend seeds every month at zero, no smoothing.

export interface DependencyCurveMonth {
  month: string; // "YYYY-MM"
  total: number;
  independent: number;
  pct: number; // 0..100, one decimal
}

export interface DependencyCurveSummary {
  total: number;
  independent: number;
  pct: number;
  latestPct: number;
}

export interface DependencyCurve {
  orgId: string;
  months: DependencyCurveMonth[];
  summary: DependencyCurveSummary;
}

const BASE = "/v3/pdgms/hcd/initiatives/dependency-curve";

export class DependencyCurveService {
  static async getCurve(months?: number): Promise<ApiResult<DependencyCurve>> {
    return api.get<DependencyCurve>(BASE, months ? { months } : undefined);
  }

  // The investor artifact as CSV, streamed by the backend (?format=csv).
  static async downloadCsv(months?: number): Promise<void> {
    const endpoint = months ? `${BASE}?months=${months}` : BASE;
    await ExportService.downloadCsv(endpoint, "dependency-curve.csv");
  }
}
