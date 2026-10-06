import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";

// Graduation flags (growth-execution W3.5). FLAG-ONLY. The backend reads the org's
// own career ladder over the most recent weekly CareerSnapshots and surfaces a "may
// be ready for the next level" signal to a coach. It mutates nothing — no level is
// changed here or anywhere the FE can reach; a human validates and promotes elsewhere.

export interface GraduationFlagWeek {
  weekId: string;
  met: boolean;
  missing: string[];
}

export interface GraduationFlagCriteria {
  minCompositeScore?: number;
  axes: { axis: string; minScore?: number }[];
}

export interface GraduationFlagEvidence {
  ladder: string;
  sustainWeeks: number;
  nextLevelCriteria: GraduationFlagCriteria;
  weeks: GraduationFlagWeek[];
}

export interface GraduationFlag {
  eid: number;
  uid: string | null;
  fromLevel: string;
  toLevel: string;
  reason: string;
  evidence: GraduationFlagEvidence;
}

const BASE = "/v3/pdgms/hcd/initiatives/graduation-flags";

export class GraduationService {
  static async getFlags(asOf?: string): Promise<ApiResult<GraduationFlag[]>> {
    return api.get<GraduationFlag[]>(BASE, asOf ? { asOf } : undefined);
  }
}
