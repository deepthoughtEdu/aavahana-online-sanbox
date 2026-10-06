import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";

// Fellow lifecycle quotas (growth-execution W3.4). Weekly, per Fellow, computed
// over the IO stage log: >=1 new Spotted improvement and >=1 forward stage
// movement this week. The self view is visible any time mid-week; the rollup lets
// DT-management read adherence.

export interface FellowQuota {
  weekStart: string;
  newSpotted: number;
  movements: number;
  minSpotted: number;
  minMovements: number;
  spottedMet: boolean;
  movementsMet: boolean;
  quotaMet: boolean;
}

export interface FellowQuotaRollupRow {
  uid: string;
  eid: number | null;
  name: string;
  newSpotted: number;
  movements: number;
  quotaMet: boolean;
}

export interface FellowQuotaRollup {
  weekStart: string;
  fellows: FellowQuotaRollupRow[];
}

const BASE = "/v3/pdgms/loops/fellow-quota";

export class FellowQuotaService {
  static async getSelf(weekStart?: string): Promise<ApiResult<FellowQuota>> {
    return api.get<FellowQuota>(BASE, weekStart ? { weekStart } : undefined);
  }

  static async getRollup(weekStart?: string): Promise<ApiResult<FellowQuotaRollup>> {
    return api.get<FellowQuotaRollup>(`${BASE}/rollup`, weekStart ? { weekStart } : undefined);
  }
}
