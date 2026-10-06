"use client";

import { useState } from "react";
import type {
  ByokPreflight,
  ByokKeyHeadroom,
  ByokMeter,
  ByokFailureDetail,
} from "@/types/shared/byok-preflight.types";
import type { ByokSwitchChoice } from "@/lib/hooks/shared/use-byok-switch";

/**
 * The consent card (P4). Shown when the model a session is running on has run
 * out, or when the payload provably will not fit what is left.
 *
 * D-2: nothing switches without a click. There is no "remember this" and no
 * automatic fallback — every switch asks.
 *
 * Everything on this card is either a fact we can source or is labelled as
 * unknown. Three of the seven providers report no headroom at all, so "unknown"
 * appears here by design and must never be rendered as zero or as unlimited.
 */

const PROVENANCE_LABEL: Record<string, string> = {
  provider: "reported by the provider",
  ours: "by our count",
  unknown: "not reported",
};

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function formatReset(iso: string | null): string | null {
  if (!iso) return null;
  const at = new Date(iso);
  if (isNaN(at.getTime())) return null;
  return at.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });
}

/** One meter, in the provider's own unit, with where the number came from. */
function MeterLine({ meter }: { meter: ByokMeter }) {
  const per = `per ${meter.window}`;
  const side = meter.side ? `${meter.side} ` : "";

  if (meter.remaining === null) {
    return (
      <li className="text-gray-500">
        {side}
        {meter.unit} {per}: <span className="font-medium text-gray-700">unknown</span>
        {meter.used !== null && <> · {formatNumber(meter.used)} used today</>}
        <span className="text-gray-400"> · {PROVENANCE_LABEL.unknown}</span>
      </li>
    );
  }

  return (
    <li className={meter.remaining === 0 ? "text-red-600" : "text-gray-600"}>
      <span className="font-medium">{formatNumber(meter.remaining)}</span>
      {meter.limit ? ` of ${formatNumber(meter.limit)}` : ""} {side}
      {meter.unit} left {per}
      <span className="text-gray-400"> · {PROVENANCE_LABEL[meter.provenance]}</span>
    </li>
  );
}

function FitNote({ option, estimateTokens }: { option: ByokKeyHeadroom; estimateTokens: number }) {
  if (option.fitsContextWindow === false) {
    return (
      <p className="mt-1 text-xs text-amber-700">
        This model holds {formatNumber(option.contextWindow ?? 0)} tokens. The session is{" "}
        {formatNumber(estimateTokens)}, so it has to be compacted before it can move here.
      </p>
    );
  }
  if (option.fitsHeadroom === false) {
    return <p className="mt-1 text-xs text-amber-700">Not enough left here to take the whole session.</p>;
  }
  if (option.fitsHeadroom === null) {
    return (
      <p className="mt-1 text-xs text-gray-400">
        This provider does not report what is left, so whether it fits is unknown.
      </p>
    );
  }
  return null;
}

interface Props {
  preflight: ByokPreflight;
  failure: ByokFailureDetail | null;
  isSwitching?: boolean;
  onSwitch: (choice: ByokSwitchChoice) => void;
  onWait: () => void;
}

export function ProviderSwitchCard({ preflight, failure, isSwitching, onSwitch, onWait }: Props) {
  const [selected, setSelected] = useState<number | null>(
    preflight.alternatives.find((a) => !a.exhausted)?.keyId ?? preflight.alternatives[0]?.keyId ?? null
  );

  const current = preflight.current;
  const resetAt = formatReset(failure?.resetAt ?? current?.resetAt ?? null);
  const chosen = preflight.alternatives.find((a) => a.keyId === selected) ?? null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
      <h3 className="font-semibold text-gray-900">
        {failure?.provider ?? current?.provider ?? "This provider"} has no headroom left
      </h3>

      {current && (
        <ul className="mt-2 space-y-0.5 text-xs">
          {current.meters.map((m, i) => (
            <MeterLine key={i} meter={m} />
          ))}
        </ul>
      )}

      <p className="mt-1 text-xs text-gray-600">
        {resetAt ? `Resets ${resetAt}.` : "The provider did not say when this resets."}
      </p>

      <p className="mt-3 text-gray-700">
        Continuing means re-sending this session: {formatNumber(preflight.estimate.inputTokens)} input
        tokens{preflight.estimate.exact ? "" : " (estimated)"}. The new provider charges for all of it
        again, and what it will produce in reply is not known in advance.
      </p>

      <p className="mt-2 text-xs text-gray-600">
        Switching sends this session&apos;s context to a different vendor.
      </p>

      {preflight.alternatives.length === 0 ? (
        <p className="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500">
          No other key is available to you. Wait for the reset, or ask an admin to add one.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {preflight.alternatives.map((option) => (
            <li key={option.keyId}>
              <label
                className={`flex cursor-pointer gap-2 rounded-lg border px-3 py-2 ${
                  selected === option.keyId ? "border-gray-900 bg-white" : "border-gray-200 bg-white/60"
                } ${option.exhausted ? "opacity-60" : ""}`}
              >
                <input
                  type="radio"
                  name="byok-switch-target"
                  className="mt-1"
                  checked={selected === option.keyId}
                  onChange={() => setSelected(option.keyId)}
                  disabled={option.exhausted}
                />
                <span className="min-w-0 flex-1">
                  <span className="font-medium text-gray-900">
                    {option.provider}
                    {option.model ? ` · ${option.model}` : ""}
                  </span>
                  <span className="ml-1 text-xs text-gray-400">({option.label})</span>
                  <ul className="mt-1 space-y-0.5 text-xs">
                    {option.meters.map((m, i) => (
                      <MeterLine key={i} meter={m} />
                    ))}
                  </ul>
                  <FitNote option={option} estimateTokens={preflight.estimate.inputTokens} />
                  {option.exhausted && (
                    <p className="mt-1 text-xs text-red-600">This one is out too.</p>
                  )}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={!chosen || chosen.exhausted || isSwitching}
          onClick={() => chosen && onSwitch({ provider: chosen.provider, model: chosen.model })}
          className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-700 disabled:opacity-40"
        >
          {isSwitching ? "Switching…" : "Switch and continue"}
        </button>
        <button
          type="button"
          onClick={onWait}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-white"
        >
          Wait
        </button>
      </div>
    </div>
  );
}
