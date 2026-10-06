import { api, isError } from "@/lib/api/client";
import type {
  CareerRunrateData,
  CareerRunrateSnapshot,
  LadderDetails,
} from "@/types";
import type { ApiResult } from "@/lib/api/client";
import { normalizeCareerRunrate } from "@/lib/adapters/aavahana-route.adapters";

export class CareerRunrateService {
  /** Get planned + actual + projected career runrate data */
  static async getCareerRunrate(): Promise<ApiResult<CareerRunrateData | null>> {
    const result = await api.get<unknown>("/v3/pdgms/scoring/career-runrate");
    if (isError(result)) return result;
    return normalizeCareerRunrate(result);
  }

  /** Get historical snapshots */
  static async getSnapshotHistory(
    from?: string,
    to?: string
  ): Promise<ApiResult<CareerRunrateSnapshot[]>> {
    const result = await api.get<{ items: CareerRunrateSnapshot[]; total: number; page: number }>(
      "/v3/pdgms/scoring/career-runrate/snapshots",
      { from, to }
    );
    if (result && typeof result === "object" && "error" in result) return result;
    return Array.isArray(result.items) ? result.items : [];
  }

  /** Get career ladder with level criteria */
  static async getLadderDetails(): Promise<ApiResult<LadderDetails>> {
    return api.get<LadderDetails>("/v3/pdgms/scoring/career-runrate/ladder");
  }
}
