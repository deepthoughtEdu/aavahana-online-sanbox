import { api, type ApiResult } from "@/lib/api/client";
import type {
  SupportPayload, SupportReply, SupportFollowUpResponse,
  SupportRememberPayload, SupportOutcome,
} from "@/types/aavahana/compassion.types";

const PATH = "/v3/pdgms/loops/daily-report/v7/support";
// withGuard logs successful response bodies by default. Support classifications
// and follow-up choices must not enter that client-side diagnostic log either.
const OPTIONS = { toast: false, log: false, track: false, performance: false };

export const CompassionService = {
  respond: (data: SupportPayload): Promise<ApiResult<SupportReply>> =>
    api.post(PATH, data, OPTIONS),
  followUp: (): Promise<ApiResult<SupportFollowUpResponse>> =>
    api.get(`${PATH}/follow-up`, undefined, OPTIONS),
  remember: (data: SupportRememberPayload): Promise<ApiResult<SupportFollowUpResponse>> =>
    api.put(`${PATH}/follow-up`, data, OPTIONS),
  answer: (data: { id: string; outcome: SupportOutcome }): Promise<ApiResult<{ saved: true }>> =>
    api.post(`${PATH}/follow-up/respond`, data, OPTIONS),
};
