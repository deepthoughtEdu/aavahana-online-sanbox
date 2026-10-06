import { atomWithStorage } from "jotai/utils";
import { atom } from "jotai";

/**
 * BYOK (Bring Your Own Key) LLM config — shared across every AI feature
 * (daily-report AI feedback, AI Shell, future talk-to-fill).
 *
 * The org supplies its own provider key; it is sent per-request in the request
 * body and never persisted server-side. Persisted in localStorage here so the
 * user sets it once per browser.
 */
export interface ByokConfig {
  apiKey: string;
  provider: string; // "anthropic" | "openai" | "gemini" | "perplexity"
  model: string;
}

/** Providers supported by the backend BYOK LLM service. */
export const BYOK_PROVIDERS = [
  "anthropic",
  "openai",
  "gemini",
  "perplexity",
  "cerebras",
  "mistral",
  "xai",
  "serper",
] as const;

export type ByokProvider = (typeof BYOK_PROVIDERS)[number];

/**
 * What we tell users about getting an API key for each provider. The catalog
 * also lists the model IDs we expose in the settings dropdown — adding a model
 * here is a one-line change. The list is curated, not exhaustive: keep recent
 * + commonly-useful, drop deprecated, never invent model names that don't
 * exist or the provider will 400 the moment they try it.
 *
 * Tier semantics:
 * - "free"  → provider has a meaningful free tier (e.g. Gemini AI Studio).
 *             Use a green badge + "Get a free key" link.
 * - "paid"  → no free tier worth mentioning. Use a neutral badge.
 */
/**
 * Per-model details surfaced in the settings UI so users see what they're
 * picking before they pick it. Numbers below are from the provider's public
 * docs as of late 2025; if a provider tightens or loosens, update here.
 */
export interface ByokModelInfo {
  id: string;
  /** Optional short label — defaults to `id` if absent. */
  displayName?: string;
  /** Context window (e.g. "1M tokens", "200K tokens"). */
  contextWindow?: string;
  /**
   * Free-tier limits when applicable, expressed as a single readable line
   * like "10 req/min · 250 req/day · 250K tokens/min". Omit on paid-only
   * providers — `tierNote` on the provider already says "tier-based".
   */
  freeTierLimits?: string;
  /** Per-model caveat shown under the details block. */
  notes?: string;
}

export interface ByokProviderInfo {
  id: ByokProvider;
  label: string;
  tier: "free" | "paid";
  /** Where to go to obtain an API key. */
  apiKeyUrl: string;
  /** Free-tier note shown on the badge tooltip / helper line. */
  tierNote: string;
  /** Whether to show free-tier limit numbers below the model picker. */
  showFreeTierLimits: boolean;
  /** Last-updated date for the limit numbers (string for display). */
  limitsAsOf: string;
  models: ByokModelInfo[];
}

export const BYOK_PROVIDER_CATALOG: Record<ByokProvider, ByokProviderInfo> = {
  gemini: {
    id: "gemini",
    label: "Gemini (Google AI Studio)",
    tier: "free",
    apiKeyUrl: "https://aistudio.google.com/apikey",
    tierNote:
      "Free tier available — Google AI Studio gives a monthly quota at no cost. Rate + token limits apply per model.",
    showFreeTierLimits: true,
    limitsAsOf: "late 2025",
    models: [
      {
        id: "gemini-2.5-flash",
        contextWindow: "1M tokens",
        freeTierLimits: "10 req/min · 250 req/day · 250K tokens/min",
        notes: "Best balance of cost, speed, and reasoning on the free tier.",
      },
      {
        id: "gemini-2.5-pro",
        contextWindow: "2M tokens",
        freeTierLimits: "2 req/min · 50 req/day · 32K tokens/min",
        notes: "Higher reasoning quality. Free quota is small — easy to hit daily cap.",
      },
      {
        id: "gemini-2.0-flash",
        contextWindow: "1M tokens",
        freeTierLimits: "10 req/min · 1500 req/day · 1M tokens/min",
        notes: "Generous daily cap. Older generation; usually fine for daily report use.",
      },
      {
        id: "gemini-1.5-flash",
        contextWindow: "1M tokens",
        freeTierLimits: "15 req/min · 1500 req/day · 1M tokens/min",
        notes: "Most permissive free quotas; older model.",
      },
      {
        id: "gemini-1.5-pro",
        contextWindow: "2M tokens",
        freeTierLimits: "2 req/min · 50 req/day · 32K tokens/min",
      },
    ],
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic (Claude)",
    tier: "paid",
    apiKeyUrl: "https://console.anthropic.com/settings/keys",
    tierNote:
      "Paid only — buy credits at console.anthropic.com. Rate limits scale with usage tier.",
    showFreeTierLimits: false,
    limitsAsOf: "late 2025",
    models: [
      {
        id: "claude-sonnet-4-7",
        contextWindow: "200K tokens",
        notes: "Latest balanced model — great for reflection and coaching.",
      },
      {
        id: "claude-sonnet-4-6",
        contextWindow: "200K tokens",
      },
      {
        id: "claude-opus-4-7",
        contextWindow: "200K tokens",
        notes: "Highest reasoning quality; most expensive per token.",
      },
      {
        id: "claude-haiku-4-5",
        contextWindow: "200K tokens",
        notes: "Cheapest and fastest. Good for high-volume use.",
      },
    ],
  },
  openai: {
    id: "openai",
    label: "OpenAI (GPT)",
    tier: "paid",
    apiKeyUrl: "https://platform.openai.com/api-keys",
    tierNote:
      "Paid only — load credits in your OpenAI billing dashboard. Rate limits scale with usage tier.",
    showFreeTierLimits: false,
    limitsAsOf: "late 2025",
    models: [
      {
        id: "gpt-4o",
        contextWindow: "128K tokens",
        notes: "Flagship multimodal model. Quality target for most teams.",
      },
      {
        id: "gpt-4o-mini",
        contextWindow: "128K tokens",
        notes: "Significantly cheaper than gpt-4o; lower reasoning quality.",
      },
      {
        id: "gpt-4-turbo",
        contextWindow: "128K tokens",
      },
      {
        id: "gpt-3.5-turbo",
        contextWindow: "16K tokens",
        notes: "Legacy model; not recommended for reflection quality.",
      },
    ],
  },
  perplexity: {
    id: "perplexity",
    label: "Perplexity (Sonar)",
    tier: "paid",
    apiKeyUrl: "https://www.perplexity.ai/settings/api",
    tierNote:
      "Paid only — requires a Perplexity Pro account. Rate limits depend on plan.",
    showFreeTierLimits: false,
    limitsAsOf: "late 2025",
    models: [
      {
        id: "sonar",
        contextWindow: "128K tokens",
        notes: "Online-search-grounded model. Best when fresh info matters.",
      },
      {
        id: "sonar-pro",
        contextWindow: "200K tokens",
      },
      {
        id: "llama-3.1-sonar-small-128k-online",
        contextWindow: "128K tokens",
      },
      {
        id: "llama-3.1-sonar-large-128k-online",
        contextWindow: "128K tokens",
      },
    ],
  },
  // Serper is a web-search grounding key (CRM research feeder / U4), not an LLM —
  // it has no model to pick. The settings UI hides the model field for it.
  cerebras: {
    id: "cerebras",
    label: "Cerebras",
    tier: "free",
    apiKeyUrl: "https://cloud.cerebras.ai",
    tierNote:
      "Free tier available — a daily token allowance per model, reset every day. Fast inference on open-weight models.",
    showFreeTierLimits: true,
    limitsAsOf: "August 2026",
    models: [
      {
        id: "gpt-oss-120b",
        contextWindow: "verify in console",
        freeTierLimits: "1M tokens/day",
        notes: "OpenAI open-weight model. Free daily allowance per Cerebras' published rate-limit table.",
      },
      {
        id: "gemma-4-31b",
        contextWindow: "verify in console",
        freeTierLimits: "1M tokens/day",
        notes: "Google open-weight model. Free daily allowance per Cerebras' published rate-limit table.",
      },
    ],
  },

  // Model IDs for Mistral and xAI are deliberately EMPTY rather than guessed.
  // The catalog rule above says never invent a model name — the provider 400s
  // the moment someone picks it. Both expose GET /v1/models, so the first live
  // key fills this in for real (services/llm.js listModels). Until then the
  // model field falls back to free text, which is honest.
  mistral: {
    id: "mistral",
    label: "Mistral",
    tier: "free",
    apiKeyUrl: "https://console.mistral.ai",
    tierNote:
      "Free 'Experiment' tier available. Mistral no longer publishes the exact numbers — read your limits at admin.mistral.ai.",
    showFreeTierLimits: false,
    limitsAsOf: "August 2026",
    models: [],
  },

  xai: {
    id: "xai",
    label: "xAI (Grok)",
    tier: "paid",
    apiKeyUrl: "https://console.x.ai",
    tierNote:
      "Tier-based — limits are requests/second and tokens/minute, and rise with cumulative spend. No documented free daily token grant.",
    showFreeTierLimits: false,
    limitsAsOf: "August 2026",
    models: [],
  },

  serper: {
    id: "serper",
    label: "Serper (Web Search)",
    tier: "paid",
    apiKeyUrl: "https://serper.dev/api-key",
    tierNote:
      "Paid search API — grounds AI content in real web results. Get a key at serper.dev. Not an LLM; no model selection.",
    showFreeTierLimits: false,
    limitsAsOf: "late 2025",
    models: [],
  },
};

/**
 * LLM providers only — the subset with a model to pick. Excludes search keys
 * like Serper. Use in model-selection surfaces (AI coach, BYOK config modal);
 * key-storage surfaces (admin/account) use the full BYOK_PROVIDERS instead.
 */
export const BYOK_LLM_PROVIDERS: ByokProvider[] = BYOK_PROVIDERS.filter(
  (p) => BYOK_PROVIDER_CATALOG[p].models.length > 0,
);

const EMPTY_BYOK_CONFIG: ByokConfig = { apiKey: "", provider: "", model: "" };

/** The user's BYOK config, persisted to localStorage. */
export const byokConfigAtom = atomWithStorage<ByokConfig>(
  "pdgms_byok_config",
  EMPTY_BYOK_CONFIG,
);

/** True only when all three fields are filled — i.e. BYOK calls can be made. */
export const byokConfiguredAtom = atom((get) => {
  const c = get(byokConfigAtom);
  return Boolean(c.apiKey && c.provider && c.model);
});

/**
 * Normalize a model string to the kebab-case ID format every major provider
 * expects: lowercase, hyphens, no spaces/underscores. Pure function.
 * Mirrored in ByokConfigModal so saved values are already clean; this also
 * defends usage sites against stale localStorage values from older sessions.
 *
 *   "Gemini 2.5 Flash"  → "gemini-2.5-flash"
 *   "GPT-4o"            → "gpt-4o"
 */
export function normalizeByokModel(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
