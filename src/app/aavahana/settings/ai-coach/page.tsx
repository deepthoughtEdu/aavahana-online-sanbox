"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { ExternalLink, Gauge, Info, Sparkles, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/Section";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { ArrowLeftIcon } from "@/components/shared/icons";
import { useByokKeys, useByokKeyMutations, useOrgConfig } from "@/lib/hooks/admin";
import {
  byokConfigAtom,
  BYOK_LLM_PROVIDERS,
  BYOK_PROVIDER_CATALOG,
  normalizeByokModel,
  type ByokProvider,
} from "@/lib/store/shared/byok.store";

const CUSTOM_MODEL_SENTINEL = "__custom__";

/**
 * AI Coach Settings — where a person sets up the LLM key their AI features use.
 *
 * The key is stored on the server, encrypted (AES-256-GCM), owned by the person
 * who saved it. That is what lets it follow them between machines and be
 * genuinely deleted. It is the same store behind /account/api-keys — two doors,
 * one room. This is the busy door: nine places in the daily report link here,
 * and it is the one in the menu.
 *
 * It used to keep the key in `byokConfigAtom` (localStorage, per browser), which
 * meant a key set up on a laptop did not exist on a phone and could not really
 * be deleted. The atom is still written alongside the server save because a few
 * AI surfaces still read it; those get migrated next, and then it goes.
 */
export default function AiCoachSettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useAtom(byokConfigAtom);

  const { data: org } = useOrgConfig();
  const { data: keys, isLoading: keysLoading } = useByokKeys();
  const { store, deactivate, isStoring, isDeactivating } = useByokKeyMutations();

  // The backend only ever returns individual keys that belong to the caller, so
  // anything marked "individual" here is this person's own.
  const myKey = (keys ?? []).find(
    (k) => k.ownershipType === "individual" && k.isActive,
  );
  const byokEnabled = org?.byokEnabled ?? false;

  const [apiKey, setApiKey] = useState(config.apiKey);
  const [provider, setProvider] = useState<ByokProvider | "">(
    (config.provider as ByokProvider) || "",
  );
  const [model, setModel] = useState(config.model);
  const [customSelected, setCustomSelected] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const providerInfo = provider ? BYOK_PROVIDER_CATALOG[provider] : null;
  const selectedModelInfo = useMemo(() => {
    if (!providerInfo || !model) return null;
    return providerInfo.models.find((m) => m.id === model) ?? null;
  }, [providerInfo, model]);

  // The saved key decides what the form shows. Its provider and model come back
  // from the server; the key itself never does and the field stays empty — an
  // input pre-filled with dots you cannot verify is worse than an empty one that
  // says a key is saved.
  useEffect(() => {
    const p = ((myKey?.provider ?? config.provider) as ByokProvider) || "";
    const m = myKey?.model ?? config.model ?? "";
    setProvider(p);
    setModel(m);
    setApiKey("");
    const knownIds = p ? BYOK_PROVIDER_CATALOG[p].models.map((m2) => m2.id) : [];
    setCustomSelected(Boolean(m) && !knownIds.includes(m));
  }, [myKey?.id, myKey?.provider, myKey?.model, config.provider, config.model]);

  function handleProviderChange(next: string) {
    if (!next) {
      setProvider("");
      setModel("");
      setCustomSelected(false);
      return;
    }
    const nextProvider = next as ByokProvider;
    setProvider(nextProvider);
    const first = BYOK_PROVIDER_CATALOG[nextProvider].models[0];
    setModel(first?.id ?? "");
    setCustomSelected(false);
  }

  function handleModelSelect(value: string) {
    if (value === CUSTOM_MODEL_SENTINEL) {
      setCustomSelected(true);
      setModel("");
      return;
    }
    setCustomSelected(false);
    setModel(value);
  }

  const normalizedModel = useMemo(() => normalizeByokModel(model), [model]);
  const willNormalize =
    normalizedModel !== model.trim() && model.trim().length > 0;
  const busy = isStoring || isDeactivating;
  const canSave = Boolean(
    apiKey.trim() && provider && normalizedModel && byokEnabled && !busy,
  );
  const isConfigured = Boolean(myKey);

  async function handleSave() {
    if (!provider) return;

    // Changing provider or model means a different key row, and a key can only
    // exist once per org. Retire the old one first so the save is a replacement
    // rather than a collision.
    if (myKey) {
      await deactivate(myKey.id);
    }

    await store({
      label: `${BYOK_PROVIDER_CATALOG[provider].label} — personal`,
      provider,
      model: normalizedModel,
      ownershipType: "individual",
      apiKey: apiKey.trim(),
    });

    // Mirror into the browser store until the remaining AI surfaces read the
    // server key. Removing this line before they do would break them.
    setConfig({ apiKey: apiKey.trim(), provider, model: normalizedModel });

    setApiKey("");
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  }

  async function handleClear() {
    if (myKey) {
      await deactivate(myKey.id);
    }
    // Both copies, or "delete" would only mean "delete the one you can see".
    setConfig({ apiKey: "", provider: "", model: "" });
    setApiKey("");
    setProvider("");
    setModel("");
    setCustomSelected(false);
  }

  return (
    <>
      <PageHeader
        label="Settings"
        title="AI Coach"
        subtitle="Configure your AI provider once — it powers every AI surface in the app."
      >
        <Button
          variant="ghost"
          color="neutral"
          size="sm"
          shape="circle"
          iconBefore={<ArrowLeftIcon size="sm" color="current" />}
          tooltip={{ text: "Back to daily report", position: "right" }}
          onClick={() => router.push("/aavahana/daily-report")}
        />
        {isConfigured && <Badge label="Active" variant="success" size="sm" />}
      </PageHeader>

      <div className="flex flex-col gap-4">
        {/* BYOK is an org-level opt-in. Say so before they paste a key and get
            an error they cannot act on. */}
        {!keysLoading && !byokEnabled && (
          <div className="alert alert-warning text-sm">
            <Info className="h-4 w-4 shrink-0" />
            <span>
              Your organisation has not enabled Bring Your Own Key yet, so a key
              saved here will not be accepted. Ask an admin to turn it on under{" "}
              <strong>Admin &rarr; BYOK Settings</strong>.
            </span>
          </div>
        )}

        {/* SECTION 1 — What this controls */}
        <Section variant="default">
          <Section.Header
            icon={<Sparkles className="h-4 w-4" />}
            title="What this controls"
            size="sm"
          />
          <Section.Body>
            <p className="text-sm leading-relaxed text-base-content/80">
              Your provider key powers the post-submission AI feedback on the
              daily report, the in-flow Socratic coach, the Niyanta AI Shell,
              and the Talking-Docs CoPilot. Configure it once here — it applies
              everywhere automatically.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-base-content/60">
              Your key is encrypted (AES-256-GCM) and stored against your
              account, so it works on every machine you sign in from. Only your
              own requests use it. Deleting it removes the key itself, not just
              the label.
            </p>
          </Section.Body>
        </Section>

        {/* SECTION 2 — Provider configuration */}
        <Section variant="default">
          <Section.Header title="Provider configuration" size="sm" />
          <Section.Body>
            <div className="flex flex-col gap-5">
              {/* PROVIDER */}
              <label className="form-control w-full">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="label-text text-sm font-medium">
                    Provider
                  </span>
                  {providerInfo && <TierBadge tier={providerInfo.tier} />}
                </div>
                <select
                  className="select select-bordered w-full"
                  value={provider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                >
                  <option value="">Select a provider…</option>
                  {BYOK_LLM_PROVIDERS.map((p) => {
                    const info = BYOK_PROVIDER_CATALOG[p];
                    return (
                      <option key={p} value={p}>
                        {info.label}
                        {info.tier === "free" ? " · Free tier available" : ""}
                      </option>
                    );
                  })}
                </select>
                {providerInfo && (
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="text-base-content/60">
                      {providerInfo.tierNote}
                    </span>
                    <a
                      href={providerInfo.apiKeyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                    >
                      Get an API key
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </label>

              {/* MODEL */}
              <label className="form-control w-full">
                <span className="label-text mb-1.5 text-sm font-medium">
                  Model
                </span>
                {provider && providerInfo ? (
                  <>
                    <select
                      className="select select-bordered w-full"
                      value={customSelected ? CUSTOM_MODEL_SENTINEL : model}
                      onChange={(e) => handleModelSelect(e.target.value)}
                    >
                      {providerInfo.models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.displayName ?? m.id}
                        </option>
                      ))}
                      <option value={CUSTOM_MODEL_SENTINEL}>
                        Custom… (enter your own)
                      </option>
                    </select>

                    {customSelected && (
                      <input
                        type="text"
                        className="input input-bordered mt-2 w-full"
                        placeholder="e.g. claude-sonnet-4-7, gpt-4.1, gemini-3-…"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        spellCheck={false}
                        autoCorrect="off"
                        autoCapitalize="off"
                      />
                    )}

                    <span className="mt-1 text-xs text-base-content/60">
                      {willNormalize ? (
                        <>
                          Will save as{" "}
                          <code className="font-mono">{normalizedModel}</code> —
                          providers reject spaces and uppercase.
                        </>
                      ) : (
                        "Pick from the list, or choose Custom to enter a model ID by hand."
                      )}
                    </span>
                  </>
                ) : (
                  <select className="select select-bordered w-full" disabled>
                    <option>Select a provider first</option>
                  </select>
                )}
              </label>

              {/* MODEL TRANSPARENCY — context window, rate limits, notes. */}
              {selectedModelInfo && providerInfo && (
                <ModelDetailsCard
                  modelInfo={selectedModelInfo}
                  showFreeTierLimits={providerInfo.showFreeTierLimits}
                  limitsAsOf={providerInfo.limitsAsOf}
                  providerLabel={providerInfo.label}
                />
              )}

              {/* API KEY */}
              <label className="form-control w-full">
                <span className="label-text mb-1.5 text-sm font-medium">
                  API key
                </span>
                <input
                  type="password"
                  className="input input-bordered w-full"
                  placeholder={
                    myKey
                      ? "A key is saved — paste a new one to replace it"
                      : "Your provider API key"
                  }
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  autoComplete="off"
                />
                <span className="mt-1 text-xs text-base-content/60">
                  {myKey
                    ? "A key is saved against your account. It cannot be read back — paste a new one to replace it."
                    : "Encrypted and stored against your account, so it follows you between machines."}
                </span>
              </label>
            </div>
          </Section.Body>
          <Section.Footer>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                onClick={handleClear}
                disabled={!isConfigured || busy}
                variant="ghost"
                color="error"
                size="sm"
                iconBefore={<Trash2 className="h-3.5 w-3.5" />}
              >
                {isDeactivating ? "Deleting…" : "Delete key"}
              </Button>
              <div className="flex items-center gap-3">
                {savedFlash && (
                  <span className="text-xs font-medium text-success">
                    ✓ Saved
                  </span>
                )}
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={!canSave}
                  color="primary"
                  size="sm"
                >
                  {isStoring
                    ? "Saving…"
                    : myKey
                      ? "Replace key"
                      : "Save configuration"}
                </Button>
              </div>
            </div>
          </Section.Footer>
        </Section>

        {/* SECTION 3 — Where this key is used */}
        <Section variant="default">
          <Section.Header title="Where this key is used" size="sm" />
          <Section.Body>
            <div className="alert alert-info mb-4 text-sm">
              <Info className="h-4 w-4 shrink-0" />
              <span>
                This is <strong>your</strong> key, not the company&apos;s. It is
                encrypted against your account, so set it once and it works
                everywhere you sign in. The same key appears under{" "}
                <strong>My API Keys &amp; Storage</strong> — that is the same
                store, not a second one. An admin-approved shared key under{" "}
                <strong>Admin &rarr; BYOK Settings</strong> may be used for Daily
                and Weekly Report generation when you have no personal key. It
                is never used for private support or AI chats.
              </span>
            </div>
            <ul className="flex flex-col gap-2.5 text-sm">
              <UsageItem
                active
                title="Daily report — AI feedback after submit"
                note="Reflection rubric + Growth Coach (frameworks, skills, habits, reading, viewing)."
              />
              <UsageItem
                active
                title="Weekly report — AI generation"
                note="Drafts the weekly report from your dailies. Uses your key first, then an admin-approved report key if available."
              />
              <UsageItem
                active
                title="Daily report — In-flow Socratic coach"
                note="The sparkle button on the report screen — chat with the coach while filling out today's report."
              />
              <UsageItem
                active={false}
                title="Niyanta AI Shell"
                note="Strategy and ops queries. Same key, same provider, same model — no separate setup needed."
              />
              <UsageItem
                active={false}
                title="Talking-Docs CoPilot"
                note="Sidebar coach for the talking-document editor. Activates when the CoPilot rolls out."
              />
            </ul>
          </Section.Body>
        </Section>
      </div>
    </>
  );
}

/* ─── Subcomponents ───────────────────────────────────────────────────── */

function TierBadge({ tier }: { tier: "free" | "paid" }) {
  if (tier === "free") {
    return <Badge label="Free tier" variant="success" size="sm" icon={null} />;
  }
  return <Badge label="Paid only" variant="neutral" size="sm" icon={null} />;
}

/**
 * Per-model transparency panel — context window + free-tier limits + per-model
 * notes from the catalog. Helps the user see what they're committing to before
 * they paste their key. Hidden when the user picks Custom… (no catalog data).
 */
function ModelDetailsCard({
  modelInfo,
  showFreeTierLimits,
  limitsAsOf,
  providerLabel,
}: {
  modelInfo: {
    id: string;
    contextWindow?: string;
    freeTierLimits?: string;
    notes?: string;
  };
  showFreeTierLimits: boolean;
  limitsAsOf: string;
  providerLabel: string;
}) {
  const hasAny =
    modelInfo.contextWindow ||
    (showFreeTierLimits && modelInfo.freeTierLimits) ||
    modelInfo.notes;
  if (!hasAny) return null;

  return (
    <div className="rounded-lg border border-base-300 bg-base-200/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-base-content/60">
          <Gauge className="h-3.5 w-3.5" />
          What this model gives you
        </div>
        <span className="text-[10px] text-base-content/40">
          limits as of {limitsAsOf}
        </span>
      </div>

      <dl className="flex flex-col gap-2 text-sm">
        {modelInfo.contextWindow && (
          <DetailRow label="Context window" value={modelInfo.contextWindow} />
        )}
        {showFreeTierLimits && modelInfo.freeTierLimits && (
          <DetailRow
            label="Free-tier limits"
            value={modelInfo.freeTierLimits}
            highlight
          />
        )}
        {!showFreeTierLimits && (
          <DetailRow
            label="Rate limits"
            value="Tier-based — scales with usage on your billing tier."
          />
        )}
      </dl>

      {modelInfo.notes && (
        <p className="mt-2 flex items-start gap-1.5 border-t border-base-300/70 pt-2 text-xs text-base-content/60">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          {modelInfo.notes}
        </p>
      )}

      <p className="mt-2 text-[11px] text-base-content/45">
        Always check {providerLabel} for the latest numbers — providers tighten
        and loosen quotas over time.
      </p>
    </div>
  );
}

function DetailRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
      <dt className="text-xs uppercase tracking-wide text-base-content/55">
        {label}
      </dt>
      <dd
        className={
          highlight
            ? "text-sm font-semibold text-success"
            : "text-sm font-medium text-base-content/85"
        }
      >
        {value}
      </dd>
    </div>
  );
}

function UsageItem({
  active,
  title,
  note,
}: {
  active: boolean;
  title: string;
  note: string;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className={
          active
            ? "mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
            : "mt-1.5 h-2 w-2 shrink-0 rounded-full bg-base-300"
        }
        aria-hidden="true"
      />
      <div>
        <p
          className={
            active
              ? "font-medium text-base-content/90"
              : "font-medium text-base-content/65"
          }
        >
          {title}
        </p>
        <p className="text-xs text-base-content/60">{note}</p>
      </div>
    </li>
  );
}
