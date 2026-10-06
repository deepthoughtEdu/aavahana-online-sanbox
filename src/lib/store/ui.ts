// src/lib/store/ui.ts
import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

// ============================================
// COMMAND PALETTE
// ============================================

export const commandPaletteOpenAtom = atom(false);

/** How many recents the palette remembers. Five are shown; the tail absorbs churn. */
export const MAX_RECENT_COMMANDS = 8;

// SSR-safe, same shape as the auth store's guard: localStorage only exists in the
// browser, and createJSONStorage null-checks the getter's result internally.
const recentsStorage = createJSONStorage<string[]>(
  () => (typeof window !== "undefined" ? window.localStorage : undefined) as Storage
);

/**
 * `CommandEntry.key` values, most-recent-first. Stored as keys rather than whole entries
 * so a stale recent resolves to nothing once the underlying page stops being visible —
 * see `defaultCommands` in src/lib/nav/command-index.ts.
 */
export const recentCommandsAtom = atomWithStorage<string[]>(
  "dt.command.recents",
  [],
  recentsStorage
);
