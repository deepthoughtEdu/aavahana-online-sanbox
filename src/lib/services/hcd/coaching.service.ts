import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type { HcdByokConfig } from "@/lib/store/hcd/hcd-byok.store";

export interface CoachingFeedback {
  content: string;
  provider: string;
  model: string;
  generatedAt: string;
}

export interface CoachingRequest {
  instanceId: number;
  activityId: number;
  apiKey: string;
  provider: string;
  model: string;
}

export interface FrameworkSuggestion {
  frameworkKey: string;
  frameworkName: string;
  /** The block a Fellow opens to assess against this framework. */
  suggestedBlockId: number;
  /** Why this framework fits, in the coach's voice. */
  rationale: string;
  /** The facts from the weekly report that drove the pick. */
  signals: string[];
  /** The week the analysed report covered, e.g. "Aug 10 – 16, 2026". */
  reportPeriodLabel: string;
  provider: string;
  model: string;
  generatedAt: string;
}

const BASE = "/v3/pdgms/hcd/coaching";

export class HcdCoachingService {
  static async getForResponse(
    data: CoachingRequest
  ): Promise<ApiResult<CoachingFeedback>> {
    return api.post<CoachingFeedback>(BASE, data);
  }

  // The server reads the Fellow's latest AI weekly report and asks their LLM
  // which framework fits it. A key connected this session rides along; with
  // none, the server uses the key the person saved on their account.
  static async suggestFramework(
    byok: HcdByokConfig | null
  ): Promise<ApiResult<FrameworkSuggestion>> {
    return api.post<FrameworkSuggestion>(
      `${BASE}/suggest-framework`,
      byok?.apiKey?.trim() ? { ...byok } : {}
    );
  }
}
