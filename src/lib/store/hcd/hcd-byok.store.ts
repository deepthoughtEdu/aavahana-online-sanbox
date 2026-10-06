import { atom } from "jotai";

export interface HcdByokConfig {
  apiKey: string;
  provider: string;
  model: string;
}

// Session-only BYOK key, shared across HCD AI features (the Apply coach and AI
// drill generation). In-memory only — never persisted, matching the product
// promise that "keys are never stored".
export const hcdByokAtom = atom<HcdByokConfig | null>(null);
