// src/lib/analytics/clarity.ts
/**
 * Microsoft Clarity — thin, typed wrapper.
 *
 * No npm dependency: the official `clarity-js` tag is a queueing stub plus a
 * remote script, and `bootClarity()` installs that stub synchronously. Anything
 * called before the remote script lands is queued and replayed, so callers
 * never have to wait for a load event.
 *
 * Everything no-ops when `NEXT_PUBLIC_CLARITY_PROJECT_ID` is unset, which is
 * the default for local dev and any preview build that has not been given a
 * project id.
 *
 * DEPLOYMENT REQUIREMENT: in the Clarity dashboard set Settings → Masking to
 * **Strict**. Masking mode is a project setting with no JS override, and the
 * PLATFORM_IMPROVEMENT consent notice (backend `seed-consent.js`, v1) promises
 * "we do not read the things you actually write". Anything looser than Strict
 * breaks that promise.
 */

export const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? "";

/**
 * Clarity sets its own cookies (_clck/_clsk) and records session replays, so it
 * is a non-essential tracker under DPDP/GDPR. Default: only run for users who
 * granted PLATFORM_IMPROVEMENT in the consent gate. Set
 * `NEXT_PUBLIC_CLARITY_REQUIRE_CONSENT=false` only if legal signs off on a
 * legitimate-interest basis instead.
 */
export const CLARITY_REQUIRES_CONSENT =
  (process.env.NEXT_PUBLIC_CLARITY_REQUIRE_CONSENT ?? "true") !== "false";

export function isClarityConfigured(): boolean {
  return CLARITY_PROJECT_ID.trim().length > 0;
}

type ClarityFn = ((command: string, ...args: unknown[]) => void) & { q?: unknown[] };

declare global {
  interface Window {
    clarity?: ClarityFn;
  }
}

const SCRIPT_ID = "ms-clarity-tag";

/**
 * Installs the Clarity queue stub and injects the tag script. Idempotent —
 * repeated calls (StrictMode double-effects, consent flips) do nothing.
 */
export function bootClarity(projectId: string = CLARITY_PROJECT_ID): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (!projectId) return false;
  if (document.getElementById(SCRIPT_ID)) return true;

  if (!window.clarity) {
    const stub: ClarityFn = function (...args: unknown[]) {
      (stub.q = stub.q || []).push(args);
    } as ClarityFn;
    window.clarity = stub;
  }

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${encodeURIComponent(projectId)}`;
  document.head.appendChild(script);

  return true;
}

function call(command: string, ...args: unknown[]): void {
  if (typeof window === "undefined") return;
  try {
    window.clarity?.(command, ...args);
  } catch {
    // Analytics must never break a render path.
  }
}

/**
 * Pseudonymous identity. `customId` is hashed by Clarity before storage — pass
 * the numeric uid, never an email or display name.
 */
export function clarityIdentify(customId: string, customPageId?: string): void {
  if (!customId) return;
  call("identify", customId, undefined, customPageId);
}

/** Session tag. Multiple values across a session are kept, so tags stack. */
export function claritySetTag(key: string, value: string | string[]): void {
  if (!key || value === "" || (Array.isArray(value) && value.length === 0)) return;
  call("set", key, value);
}

/** Custom event — shows up as a countable signal in the Clarity dashboard. */
export function clarityEvent(name: string): void {
  if (!name) return;
  call("event", name);
}

/** Cookie-consent switch. `false` keeps Clarity in cookie-less mode. */
export function claritySetConsent(granted: boolean): void {
  call("consent", granted);
}
