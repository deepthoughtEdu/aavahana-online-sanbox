"use client";

import { useState } from "react";
import { useSetAtom } from "jotai";
import { Button } from "@/components/shared/Button";
import { hcdByokAtom, type HcdByokConfig } from "@/lib/store/hcd/hcd-byok.store";

const MODELS: Record<string, string[]> = {
  anthropic: ["claude-sonnet-4-6", "claude-haiku-4-5-20251001"],
  openai: ["gpt-4o", "gpt-4o-mini"],
  gemini: ["gemini-2.5-flash"],
};

// Shared BYOK key entry for HCD. Writes the connected key to the shared atom so
// every HCD AI surface (coach + drill generation) can use it without re-entry.
export function HcdByokSetup({
  onConnected,
}: {
  onConnected?: (config: HcdByokConfig) => void;
}) {
  const setByok = useSetAtom(hcdByokAtom);
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState("anthropic");
  const [model, setModel] = useState("claude-sonnet-4-6");

  const connect = () => {
    const config = { apiKey, provider, model };
    setByok(config);
    onConnected?.(config);
  };

  return (
    <div className="max-w-md space-y-3">
      <select
        value={provider}
        onChange={(e) => {
          setProvider(e.target.value);
          setModel(MODELS[e.target.value]?.[0] ?? "");
        }}
        className="select select-bordered select-sm w-full"
      >
        <option value="anthropic">Anthropic</option>
        <option value="openai">OpenAI</option>
        <option value="gemini">Google Gemini</option>
      </select>
      <select
        value={model}
        onChange={(e) => setModel(e.target.value)}
        className="select select-bordered select-sm w-full"
      >
        {(MODELS[provider] ?? []).map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="API Key"
        className="input input-bordered input-sm w-full"
      />
      <Button color="primary" size="sm" disabled={!apiKey.trim()} onClick={connect}>
        Connect
      </Button>
    </div>
  );
}
