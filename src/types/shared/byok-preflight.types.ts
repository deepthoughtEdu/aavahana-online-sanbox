/**
 * BYOK preflight + provider-switch consent.
 *
 * Shapes returned by POST /v3/pdgms/ai/byok/preflight. Every headroom number
 * carries where it came from, because three of the seven providers report
 * nothing back and a confident wrong figure in front of an operator is worse
 * than an honest "unknown".
 *
 * Plan: PDGMS-Backend/PDGMSDocs/ToDo/byok-provider-switch-consent-plan.md (P3/P4)
 */

/** provider = the provider said so. ours = our own count. unknown = nobody knows. */
export type ByokProvenance = "provider" | "ours" | "unknown";

export interface ByokMeter {
  unit: "tokens" | "requests";
  window: "minute" | "hour" | "day" | "month" | "second";
  /** Anthropic splits input and output token budgets; null elsewhere. */
  side: "input" | "output" | null;
  /** null = not knowable. Never render null as 0. */
  remaining: number | null;
  limit: number | null;
  used: number | null;
  provenance: ByokProvenance;
  header: string | null;
}

export interface ByokKeyHeadroom {
  keyId: number;
  label: string;
  provider: string;
  model: string | null;
  ownershipType: "individual" | "group" | "org";
  meters: ByokMeter[];
  provenance: ByokProvenance;
  /** ISO timestamp, or null when the provider did not say. Never guessed. */
  resetAt: string | null;
  exhausted: boolean;
  limitsSource: string | null;
  usage: { requests: number; inputTokens: number; outputTokens: number };
  /** null = this model's window is not known, not that it is unlimited. */
  contextWindow: number | null;
  /** true / false / null-for-unknown. Null must render as unknown, not as a verdict. */
  fitsHeadroom: boolean | null;
  fitsContextWindow: boolean | null;
}

export interface ByokPreflight {
  estimate: {
    inputTokens: number;
    chars: number;
    exact: boolean;
    basis: string;
    /** Always null: output length is unknowable before the model runs. */
    outputTokens: null;
  };
  current: ByokKeyHeadroom | null;
  alternatives: ByokKeyHeadroom[];
  supportedProviders: string[];
  meterSpec: Record<string, { reports: boolean | "partial"; units: string[]; note: string }>;
}

export interface ByokSwitchPayload {
  fromProvider: string;
  fromModel?: string | null;
  toProvider: string;
  toModel?: string | null;
  tokensResent?: number;
  trigger: "quota" | "preflight";
  surface?: string;
}

/**
 * The structured half of an LLM failure, carried on `response.detail`.
 * The human sentence still arrives in the error message; this is what code
 * branches on so nothing has to pattern-match English.
 */
export interface ByokFailureDetail {
  kind: "quota" | "auth" | "overloaded" | "model" | "unknown";
  provider: string;
  model: string;
  resetAt: string | null;
}
