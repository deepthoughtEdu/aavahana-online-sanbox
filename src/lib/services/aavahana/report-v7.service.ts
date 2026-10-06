import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type {
  SuggestionExpandPayload,
  SuggestionExpandResponse,
  OpenSuggestionResponse,
  SuggestionRespondPayload,
  SuggestionRespondResponse,
  SuggestionHistoryResponse,
} from "@/types/aavahana/learning.types";
import type {
  AiFeedback,
  ConstraintsResponse,
  FrameworksResponse,
  FeelingsResponse,
  NavigationsResponse,
  V7Signals,
  V7SubmitPayload,
  V7SubmitResponse,
  V7DraftPayload,
  V7DraftResponse,
  V7RegenerateAiPayload,
  V7HighlightPayload,
  V7HighlightResponse,
  V7CoachConversation,
  V7CoachSendPayload,
  V7CoachSendResponse,
  V7SynthesizePayload,
  V7SynthesizeResponse,
  GrowthStreak,
} from "@/types/aavahana/report-v7.types";

interface SectionAContext {
  plannedItems: {
    taskId: string;
    text: string;
    budgetMins: number;
    gridSlot?: string;
    isCriticalPath?: boolean;
  }[];
  planSubmitted: boolean;
  reportStatus: string | null;
}

export class ReportV7Service {
  // ── Reuse existing endpoints ──

  static async getDeliverables(date: string): Promise<ApiResult<SectionAContext>> {
    return api.get(`/v3/pdgms/loops/daily-report/section-a-context?date=${date}`, {
      label: "v7:deliverables",
    });
  }

  static async getConstraints(): Promise<ApiResult<ConstraintsResponse>> {
    return api.get("/v3/pdgms/ontology/constraints", {
      label: "v7:constraints",
    });
  }

  static async getFrameworks(): Promise<ApiResult<FrameworksResponse>> {
    // Scoped per user: curated orgs (e.g. schools) get their department's
    // frameworks + org-wide ones; non-curated orgs get the business domains.
    return api.get("/v3/pdgms/ontology/framework-assignments/my", {
      label: "v7:frameworks",
    });
  }

  // ── New endpoints ──

  static async getFeelings(): Promise<ApiResult<FeelingsResponse>> {
    return api.get("/v3/pdgms/ontology/feelings", {
      label: "v7:feelings",
    });
  }

  static async getNavigations(): Promise<ApiResult<NavigationsResponse>> {
    return api.get("/v3/pdgms/ontology/navigations", {
      label: "v7:navigations",
    });
  }

  static async getSignals(date: string): Promise<ApiResult<V7Signals>> {
    return api.get(`/v3/pdgms/loops/daily-report/v7/signals?date=${date}`, {
      label: "v7:signals",
    });
  }

  static async submitReport(payload: V7SubmitPayload): Promise<ApiResult<V7SubmitResponse>> {
    return api.post("/v3/pdgms/loops/daily-report/v7/submit", payload, {
      label: "v7:submit",
      toast: true,
      successMessage: "Report submitted",
    });
  }

  static async saveDraft(payload: V7DraftPayload): Promise<ApiResult<{ success: boolean; savedAt: string }>> {
    return api.put("/v3/pdgms/loops/daily-report/v7/draft", payload, {
      label: "v7:draft",
    });
  }

  static async getDraft(date: string): Promise<ApiResult<V7DraftResponse>> {
    return api.get(`/v3/pdgms/loops/daily-report/v7/draft?date=${date}`, {
      label: "v7:draft-load",
    });
  }

  /**
   * Growth streak for the seed-to-plant header visual. Readable without
   * submitting, so both the plan and report headers can show it.
   */
  static async getStreak(): Promise<ApiResult<GrowthStreak>> {
    return api.get("/v3/pdgms/loops/daily-report/v7/streak", {
      label: "v7:streak",
    });
  }

  // ── Learning loop ──

  /**
   * The person's one open suggestion, plus their totals. Reading this counts as
   * showing it to them, which is how we tell "ignored it" from "never saw it".
   * Pass peek when rendering it incidentally rather than putting it in front of
   * someone, so the count stays honest.
   */
  static async getOpenSuggestion(
    peek = false,
  ): Promise<ApiResult<OpenSuggestionResponse>> {
    return api.get(
      `/v3/pdgms/loops/daily-report/v7/suggestion${peek ? "?peek=1" : ""}`,
      { label: "v7:suggestion" },
    );
  }

  /** Applied it, not useful, dropped, or not yet. Nothing here is mandatory. */
  static async respondToSuggestion(
    payload: SuggestionRespondPayload,
  ): Promise<ApiResult<SuggestionRespondResponse>> {
    return api.post("/v3/pdgms/loops/daily-report/v7/suggestion/respond", payload, {
      label: "v7:suggestion-respond",
    });
  }

  /**
   * Write the deeper version of one suggestion. Runs on the person's own AI key
   * and caches server-side, so pressing it twice costs one call.
   */
  static async expandSuggestion(
    payload: SuggestionExpandPayload,
  ): Promise<ApiResult<SuggestionExpandResponse>> {
    return api.post("/v3/pdgms/loops/daily-report/v7/suggestion/expand", payload, {
      label: "v7:suggestion-expand",
    });
  }

  /** Everything ever suggested and what they said about each. */
  static async getSuggestionHistory(
    limit?: number,
  ): Promise<ApiResult<SuggestionHistoryResponse>> {
    return api.get(
      `/v3/pdgms/loops/daily-report/v7/suggestions/history${limit ? `?limit=${limit}` : ""}`,
      { label: "v7:suggestion-history" },
    );
  }

  /**
   * Save (or clear, with an empty string) the recognition highlight for an
   * already-submitted report. Silent by design — the recognition screen shows
   * its own inline acknowledgement, and a toast on top of a celebration reads
   * as a second, competing notification.
   */
  static async saveHighlight(
    payload: V7HighlightPayload,
  ): Promise<ApiResult<V7HighlightResponse>> {
    return api.post("/v3/pdgms/loops/daily-report/v7/highlight", payload, {
      label: "v7:highlight",
    });
  }

  /**
   * Re-run the AI feedback prompts for an already-submitted report. Backend
   * caps the retry count at MAX_REGENERATIONS (2). Returns the full new
   * aiFeedback payload — caller updates the aiFeedback atom.
   */
  static async regenerateAi(
    payload: V7RegenerateAiPayload,
  ): Promise<ApiResult<AiFeedback>> {
    return api.post("/v3/pdgms/loops/daily-report/v7/regenerate-ai", payload, {
      label: "v7:regenerate-ai",
      toast: true,
      successMessage: "AI feedback refreshed",
    });
  }

  /**
   * In-flow Socratic coach — fetch today's chat thread on mount.
   * Returns empty messages if the user hasn't talked to the coach yet today.
   */
  static async getCoachConversation(
    date: string,
  ): Promise<ApiResult<V7CoachConversation>> {
    return api.get(
      `/v3/pdgms/loops/daily-report/v7/coach?date=${encodeURIComponent(date)}`,
      { label: "v7:coach-load" },
    );
  }

  /** In-flow Socratic coach — send a message, get back the AI reply. */
  static async sendCoachMessage(
    payload: V7CoachSendPayload,
  ): Promise<ApiResult<V7CoachSendResponse>> {
    return api.post("/v3/pdgms/loops/daily-report/v7/coach", payload, {
      label: "v7:coach-send",
    });
  }

  /**
   * "Help me with my report": turn the helper's short exchange into a proposed
   * report. Nothing is saved; the person checks it and submits as usual. The
   * response stays out of the client's diagnostic log, because it is their
   * report in their own words.
   */
  static async synthesize(
    payload: V7SynthesizePayload,
  ): Promise<ApiResult<V7SynthesizeResponse>> {
    return api.post("/v3/pdgms/loops/daily-report/v7/synthesize", payload, {
      label: "v7:synthesize",
      toast: false,
      log: false,
      track: false,
    });
  }
}
