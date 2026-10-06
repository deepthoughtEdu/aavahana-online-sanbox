/**
 * v8 Daily Report — the single-screen "Close your day" card.
 *
 * v8 keeps the v7 backend contract (same submit payload, draft endpoint,
 * dictionaries and signals) but replaces the serial conversation with one
 * glanceable screen. These types describe the screen's local state and the
 * draft snapshot it persists.
 */

import type {
  PlannedDeliverable,
  UnplannedDeliverable,
  MacroMicroSelection,
} from "@/types/aavahana/report-engine.types";

/**
 * A macro pick with an optional micro refinement. v7 forces both levels;
 * v8 treats the micro as a refinement the user can skip, so micro fields
 * are nullable here and null is sent to the backend when skipped.
 */
export interface V8Selection {
  macroId: string;
  macroLabel: string;
  microId: string | null;
  microLabel: string | null;
}

/** Coerce a v8 selection into the strict v7 shape for shared display components. */
export function asMacroMicro(sel: V8Selection | null): MacroMicroSelection | null {
  if (!sel) return null;
  return {
    macroId: sel.macroId,
    macroLabel: sel.macroLabel,
    microId: sel.microId ?? sel.macroId,
    microLabel: sel.microLabel ?? sel.macroLabel,
  };
}

/**
 * Draft snapshot persisted via the v7 draft endpoint. Field names match the
 * v7 engine snapshot (buildDraftSnapshot) on purpose: a v7 draft restores
 * into v8 and a submitted v7 report renders in the v8 completion view. The
 * `flavor` marker tells v8 the snapshot is its own richer shape.
 */
export interface V8Snapshot {
  flavor: "v8";
  startedAt: number;
  deliverables: PlannedDeliverable[];
  unplanned: UnplannedDeliverable[];
  constraint: MacroMicroSelection | null;
  navigation: MacroMicroSelection | null;
  framework: MacroMicroSelection | null;
  feeling: MacroMicroSelection | null;
  narrative: string;
  smoothDayNote: string;
  smoothDay: boolean;
  /**
   * "What went well today?" — chip ids (PRD §12). More than one can be true in
   * a day, so this is a list. Optional on the type because drafts saved before
   * the question existed do not carry it; those restore as an empty selection,
   * which is the same as skipping.
   */
  wentWell?: string[];
  isComplete: boolean;
}
