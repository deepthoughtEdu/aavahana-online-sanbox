/**
 * Tree Walker Engine — drives the conversation flow from TSV decision trees.
 *
 * Three-file architecture: each section has flow, copy, options TSVs.
 * Bridge nodes with `target: SECTION_B` etc. trigger loading the next section.
 * Conversation state carries across sections.
 */

import { atom } from "jotai";
import type { TreeNode, ParsedTree } from "./tsv-parser";
import { parseSplitTSV, findStartNode } from "./tsv-parser";
import {
  findMatchingChild,
  buildContext,
  type ConversationContext,
} from "./condition-evaluator";
import type {
  PlannedDeliverable,
  UnplannedDeliverable,
  MacroMicroSelection,
} from "@/types/aavahana/report-engine.types";
import type { V7Signals } from "@/types/aavahana/report-v7.types";

// ── Section identifiers ──
export type SectionId = "A" | "B" | "C";

// ── Three-file TSV content per section ──
export interface SectionTSVFiles {
  flow: string;
  copy: string;
  options: string;
}

// ── TSV content map — split files per section ──
export type SectionTSVMap = Record<SectionId, SectionTSVFiles>;

// ── Conversation history entry ──
export interface HistoryEntry {
  nodeId: string;
  section: SectionId;
  answer: string | null; // what the user responded (null for auto-advanced nodes)
  timestamp: number;
  depth: number; // distance from root in tree
  breadth: number; // sibling index at this depth
}

// ── Engine state ──
export interface EngineState {
  // Current position
  section: SectionId;
  currentNodeId: string | null;
  tree: ParsedTree | null;

  // All section trees (parsed once)
  trees: Partial<Record<SectionId, ParsedTree>>;
  tsvMap: SectionTSVMap | null;

  // Conversation history
  history: HistoryEntry[];

  // Accumulated data from the conversation
  deliverables: PlannedDeliverable[];
  unplanned: UnplannedDeliverable[];
  cpItem: PlannedDeliverable | null;

  // Backend context signals used by decision conditions
  programCpData: { area: string } | null;
  programSampleSize: number;
  programMajorityConstraint: string | null;
  unplannedHistoryDays: number;
  historyHasFasterInstanceMap: Record<string, boolean>;
  recurringDependency: { type: string; count: number; days: number } | null;
  recurringConstraint: { micro: string; count: number; days: number } | null;
  isNewNavigationMap: Record<string, boolean>;

  constraint: MacroMicroSelection | null;
  navigation: MacroMicroSelection | null;
  lastAnswer: string | null;
  lastMacroPick: string | null;
  narrative: string;
  framework: MacroMicroSelection | null;
  feeling: MacroMicroSelection | null;
  smoothDayNote: string;

  // Section C context
  entryPath: "normal" | "smooth" | null;
  smoothStreakDays: number;
  charCount: number;
  valence: "positive" | "neutral" | "negative" | null;
  teamSampleSize: number;
  programConstraintPercent: number; // % of program members hitting same constraint this week
  frameworkCommitment: { macroId: string; macroLabel: string } | null;

  // Timing
  startedAt: number;

  // Option ID lookup — maps resolved option labels back to source IDs.
  // Populated by ConversationRenderer before each advance call.
  resolvedOptionIds: Record<string, string>;

  // Terminal state
  isComplete: boolean;
}

export interface DraftEngineSnapshot {
  section: SectionId;
  currentNodeId: string | null;
  history: HistoryEntry[];
  deliverables: PlannedDeliverable[];
  unplanned: UnplannedDeliverable[];
  cpItem: PlannedDeliverable | null;
  constraint: MacroMicroSelection | null;
  navigation: MacroMicroSelection | null;
  lastAnswer: string | null;
  lastMacroPick: string | null;
  narrative: string;
  framework: MacroMicroSelection | null;
  feeling: MacroMicroSelection | null;
  smoothDayNote: string;
  entryPath: "normal" | "smooth" | null;
  smoothStreakDays: number;
  charCount: number;
  valence: "positive" | "neutral" | "negative" | null;
  teamSampleSize: number;
  programConstraintPercent: number;
  frameworkCommitment: { macroId: string; macroLabel: string } | null;
  startedAt: number;
  resolvedOptionIds: Record<string, string>;
  isComplete: boolean;
}

// ── Initial state ──
function createInitialState(): EngineState {
  return {
    section: "A",
    currentNodeId: null,
    tree: null,
    trees: {},
    tsvMap: null,
    history: [],
    deliverables: [],
    unplanned: [],
    cpItem: null,
    programCpData: null,
    programSampleSize: 0,
    programMajorityConstraint: null,
    unplannedHistoryDays: 0,
    historyHasFasterInstanceMap: {},
    recurringDependency: null,
    recurringConstraint: null,
    isNewNavigationMap: {},
    constraint: null,
    navigation: null,
    lastAnswer: null,
    lastMacroPick: null,
    narrative: "",
    framework: null,
    feeling: null,
    smoothDayNote: "",
    entryPath: null,
    smoothStreakDays: 0,
    charCount: 0,
    valence: null,
    teamSampleSize: 0,
    programConstraintPercent: 0,
    frameworkCommitment: null,
    startedAt: 0,
    resolvedOptionIds: {},
    isComplete: false,
  };
}

function normalizeDeliverables(
  deliverables: PlannedDeliverable[],
): PlannedDeliverable[] {
  return deliverables.map((deliverable) => ({
    ...deliverable,
    actualMins: deliverable.actualMins || deliverable.estimateMins,
  }));
}

function createSignalState(signals?: V7Signals | null) {
  return {
    programCpData: signals?.programCpData ?? null,
    programSampleSize: signals?.programSampleSize ?? 0,
    programMajorityConstraint: signals?.programMajorityConstraint ?? null,
    unplannedHistoryDays: signals?.unplannedHistoryDays ?? 0,
    historyHasFasterInstanceMap: signals?.historyHasFasterInstance ?? {},
    recurringDependency: signals?.recurringDependency ?? null,
    recurringConstraint: signals?.recurringConstraint ?? null,
    isNewNavigationMap: signals?.isNewNavigation ?? {},
    smoothStreakDays: signals?.smoothStreakDays ?? 0,
    teamSampleSize: signals?.teamSampleSize ?? 0,
  };
}

function createInitializedState(params: {
  tsvMap: SectionTSVMap;
  deliverables: PlannedDeliverable[];
  signals?: V7Signals | null;
}): EngineState {
  const treeA = parseSplitTSV(
    params.tsvMap.A.flow,
    params.tsvMap.A.copy,
    params.tsvMap.A.options,
  );
  const startNode = findStartNode(treeA);

  return {
    ...createInitialState(),
    ...createSignalState(params.signals),
    section: "A",
    currentNodeId: startNode?.id ?? null,
    tree: treeA,
    trees: { A: treeA },
    tsvMap: params.tsvMap,
    deliverables: normalizeDeliverables(params.deliverables),
    startedAt: Date.now(),
  };
}

export function buildDraftSnapshot(state: EngineState): DraftEngineSnapshot {
  return {
    section: state.section,
    currentNodeId: state.currentNodeId,
    history: state.history,
    deliverables: state.deliverables,
    unplanned: state.unplanned,
    cpItem: state.cpItem,
    constraint: state.constraint,
    navigation: state.navigation,
    lastAnswer: state.lastAnswer,
    lastMacroPick: state.lastMacroPick,
    narrative: state.narrative,
    framework: state.framework,
    feeling: state.feeling,
    smoothDayNote: state.smoothDayNote,
    entryPath: state.entryPath,
    smoothStreakDays: state.smoothStreakDays,
    charCount: state.charCount,
    valence: state.valence,
    teamSampleSize: state.teamSampleSize,
    programConstraintPercent: state.programConstraintPercent,
    frameworkCommitment: state.frameworkCommitment,
    startedAt: state.startedAt,
    resolvedOptionIds: state.resolvedOptionIds,
    isComplete: state.isComplete,
  };
}

// ── Main engine atom ──
export const engineAtom = atom<EngineState>(createInitialState());

// ── Derived: current node ──
export const currentNodeAtom = atom<TreeNode | null>((get) => {
  const state = get(engineAtom);
  if (!state.tree || !state.currentNodeId) return null;
  return state.tree.nodeMap[state.currentNodeId] ?? null;
});

// ── Derived: conversation context for condition evaluation ──
export const contextAtom = atom<ConversationContext>((get) => {
  const s = get(engineAtom);
  return ctxFromState(s);
});

// ── Derived: tension summary ──
export const tensionAtom = atom((get) => {
  const s = get(engineAtom);
  const done = s.deliverables.filter((d) => d.status === "done").length;
  const partial = s.deliverables.filter((d) => d.status === "partial").length;
  const notDone = s.deliverables.filter((d) => d.status === "not_done").length;
  const plannedMins = s.deliverables.reduce(
    (sum, d) => sum + d.estimateMins,
    0,
  );
  const actualMins = s.deliverables.reduce((sum, d) => sum + d.actualMins, 0);
  const unplannedMins = s.unplanned.reduce((sum, d) => sum + d.minutesTaken, 0);
  return {
    done,
    partial,
    notDone,
    plannedMins,
    actualMins,
    unplannedMins,
    total: s.deliverables.length,
  };
});

// ── Action: Initialize engine with TSV content and deliverables ──
export const initEngineAtom = atom(
  null,
  (
    get,
    set,
    params: {
      tsvMap: SectionTSVMap;
      deliverables: PlannedDeliverable[];
      signals?: V7Signals | null;
    },
  ) => {
    const nextState = createInitializedState(params);

    set(engineAtom, nextState);

    // Auto-advance past start node
    if (nextState.currentNodeId && nextState.tree) {
      const startNode = nextState.tree.nodeMap[nextState.currentNodeId];
      if (startNode && shouldAutoAdvance(startNode)) {
        set(advanceAtom, null);
      }
    }
  },
);

export const hydrateEngineAtom = atom(
  null,
  (
    get,
    set,
    params: {
      tsvMap: SectionTSVMap;
      deliverables: PlannedDeliverable[];
      signals?: V7Signals | null;
      draftState: Record<string, unknown>;
    },
  ) => {
    const snapshot = params.draftState as Partial<DraftEngineSnapshot>;
    // Merge: API is source-of-truth for the deliverable list (so plans submitted
    // after the draft was saved still appear). Draft only contributes per-item
    // user state (status / actualMins / isCriticalPath / qaStatus) when the same
    // item is still present.
    const draftDeliverables: PlannedDeliverable[] = Array.isArray(snapshot.deliverables)
      ? (snapshot.deliverables as PlannedDeliverable[])
      : [];
    const restoredDeliverables: PlannedDeliverable[] = params.deliverables.map((apiItem) => {
      const draftMatch = draftDeliverables.find((d) =>
        apiItem.basketItemId && d.basketItemId
          ? d.basketItemId === apiItem.basketItemId
          : d.label === apiItem.label,
      );
      if (!draftMatch) return apiItem;
      return {
        ...apiItem,
        status: draftMatch.status,
        actualMins: draftMatch.actualMins,
        isCriticalPath: draftMatch.isCriticalPath,
        qaStatus: draftMatch.qaStatus,
      };
    });

    let nextState = createInitializedState({
      tsvMap: params.tsvMap,
      deliverables: restoredDeliverables,
      signals: params.signals,
    });

    nextState = {
      ...nextState,
      section:
        snapshot.section === "B" || snapshot.section === "C"
          ? snapshot.section
          : nextState.section,
      history: Array.isArray(snapshot.history)
        ? (snapshot.history as HistoryEntry[])
        : nextState.history,
      deliverables: normalizeDeliverables(restoredDeliverables),
      unplanned: Array.isArray(snapshot.unplanned)
        ? (snapshot.unplanned as UnplannedDeliverable[])
        : nextState.unplanned,
      // Re-derive from the merged deliverables so a stale draft cpItem can't
      // reference a deliverable that no longer exists in the API list.
      cpItem: restoredDeliverables.find((d) => d.isCriticalPath) ?? null,
      constraint:
        (snapshot.constraint as MacroMicroSelection | null | undefined) ??
        nextState.constraint,
      navigation:
        (snapshot.navigation as MacroMicroSelection | null | undefined) ??
        nextState.navigation,
      lastAnswer:
        typeof snapshot.lastAnswer === "string" || snapshot.lastAnswer === null
          ? (snapshot.lastAnswer ?? null)
          : nextState.lastAnswer,
      lastMacroPick:
        typeof snapshot.lastMacroPick === "string" ||
        snapshot.lastMacroPick === null
          ? (snapshot.lastMacroPick ?? null)
          : nextState.lastMacroPick,
      narrative:
        typeof snapshot.narrative === "string"
          ? snapshot.narrative
          : nextState.narrative,
      framework:
        (snapshot.framework as MacroMicroSelection | null | undefined) ??
        nextState.framework,
      feeling:
        (snapshot.feeling as MacroMicroSelection | null | undefined) ??
        nextState.feeling,
      smoothDayNote:
        typeof snapshot.smoothDayNote === "string"
          ? snapshot.smoothDayNote
          : nextState.smoothDayNote,
      entryPath:
        snapshot.entryPath === "normal" || snapshot.entryPath === "smooth"
          ? snapshot.entryPath
          : nextState.entryPath,
      smoothStreakDays:
        typeof snapshot.smoothStreakDays === "number"
          ? snapshot.smoothStreakDays
          : nextState.smoothStreakDays,
      charCount:
        typeof snapshot.charCount === "number"
          ? snapshot.charCount
          : nextState.charCount,
      valence:
        snapshot.valence === "positive" ||
        snapshot.valence === "neutral" ||
        snapshot.valence === "negative"
          ? snapshot.valence
          : nextState.valence,
      teamSampleSize:
        typeof snapshot.teamSampleSize === "number"
          ? snapshot.teamSampleSize
          : nextState.teamSampleSize,
      programConstraintPercent:
        typeof snapshot.programConstraintPercent === "number"
          ? snapshot.programConstraintPercent
          : nextState.programConstraintPercent,
      frameworkCommitment:
        (snapshot.frameworkCommitment as
          | { macroId: string; macroLabel: string }
          | null
          | undefined) ?? nextState.frameworkCommitment,
      startedAt:
        typeof snapshot.startedAt === "number"
          ? snapshot.startedAt
          : nextState.startedAt,
      resolvedOptionIds:
        snapshot.resolvedOptionIds &&
        typeof snapshot.resolvedOptionIds === "object"
          ? (snapshot.resolvedOptionIds as Record<string, string>)
          : nextState.resolvedOptionIds,
      isComplete: snapshot.isComplete === true,
    };

    nextState = loadSection(nextState, nextState.section);

    if (
      typeof snapshot.currentNodeId === "string" &&
      nextState.tree &&
      nextState.tree.nodeMap[snapshot.currentNodeId]
    ) {
      nextState = { ...nextState, currentNodeId: snapshot.currentNodeId };
    }

    set(engineAtom, nextState);

    if (!nextState.isComplete && nextState.currentNodeId && nextState.tree) {
      const restoredNode = nextState.tree.nodeMap[nextState.currentNodeId];
      if (restoredNode && shouldAutoAdvance(restoredNode)) {
        set(advanceAtom, null);
      }
    }
  },
);

// ── Action: User responds / advance the conversation ──
/**
 * Interpret a user's answer and update engine state based on node context.
 *
 * This is the single place where answers become state. It uses the node's
 * optionSource and ID pattern to determine what state field to write.
 * This prevents the "selection atoms never called" class of bugs.
 */
function interpretAnswer(
  node: TreeNode,
  answer: string,
  state: EngineState,
): EngineState {
  let s = state;

  // ── QA status — detect by options content, store on cpItem deliverable ──
  const QA_OPTIONS = ["met", "not met", "to verify", "unsure", "unknown"];
  const isQaNode =
    node.options.length > 0 &&
    QA_OPTIONS.includes(node.options[0]) &&
    QA_OPTIONS.includes(node.options[1]);
  if (isQaNode && s.cpItem) {
    const qaAnswer = answer as PlannedDeliverable["qaStatus"];
    const updatedCp = { ...s.cpItem, qaStatus: qaAnswer };
    s = {
      ...s,
      cpItem: updatedCp,
      deliverables: s.deliverables.map((d) =>
        d.id === updatedCp.id ? { ...d, qaStatus: qaAnswer } : d,
      ),
    };
  }

  // ── cpItem from probe — mark as critical path in both cpItem AND deliverables array ──
  function markCriticalPath(item: PlannedDeliverable): EngineState {
    return {
      ...s,
      cpItem: { ...item, isCriticalPath: true },
      deliverables: s.deliverables.map((d) =>
        d.id === item.id
          ? { ...d, isCriticalPath: true }
          : { ...d, isCriticalPath: false },
      ),
    };
  }

  if (!s.cpItem && node.id.includes("_PROBE_") && node.type === "question") {
    const picked = s.deliverables.find((d) => d.label === answer);
    if (picked) s = markCriticalPath(picked);
  }

  // ── cpItem from yes/no probe confirmation — infer from the same item the question named ──
  if (!s.cpItem) {
    if (node.id === "A_PROBE_TIME" && answer === "yes") {
      const sorted = [...s.deliverables].sort(
        (a, b) => b.estimateMins - a.estimateMins,
      );
      if (sorted[0]) s = markCriticalPath(sorted[0]);
    }
    if (node.id === "A_PROBE_INC" && answer === "yes, it would") {
      const item = s.deliverables.find(
        (d) =>
          d.status === "partial" ||
          d.status === "not_done" ||
          d.status === null,
      );
      if (item) s = markCriticalPath(item);
    }
  }

  // ── Option-source-driven state writes ──
  const source = node.optionSource;
  if (source) {
    const key = source.replace(/^(derived|external):/, "");

    switch (key) {
      // Constraint macro pick (B_CONSTRAINT etc.) — set macro, trigger "picks macro"
      case "constraints.micro":
        // Skip source-driven write for inline escape options (e.g. "none of these")
        if (node.options.includes(answer)) break;
        // This node shows constraint micros — answer is a micro label pick.
        // Use resolvedOptionIds to recover the SSOT ID (e.g. "1.1") from the label.
        if (s.constraint) {
          const microId = s.resolvedOptionIds[answer] ?? answer;
          s = {
            ...s,
            constraint: { ...s.constraint, microId, microLabel: answer },
            lastMacroPick: null, // Reset — this was a micro pick
          };
        }
        break;

      case "navigations.macro": {
        // Skip source-driven write for inline escape options (e.g. "none of these")
        if (node.options.includes(answer)) break;
        // Nav macro pick — use resolvedOptionIds to get SSOT ID (e.g. "1.1.1")
        const navMacroId = s.resolvedOptionIds[answer] ?? answer;
        s = {
          ...s,
          navigation: {
            macroId: navMacroId,
            macroLabel: answer,
            microId: "",
            microLabel: "",
          },
          lastMacroPick: answer,
        };
        break;
      }

      case "navigations.micro": {
        // Skip source-driven write for inline escape options (e.g. "none of these")
        if (node.options.includes(answer)) break;
        // Nav micro pick — use resolvedOptionIds to get SSOT ID (e.g. "1.1.1.1")
        const navMicroId = s.resolvedOptionIds[answer] ?? answer;
        if (s.navigation) {
          s = {
            ...s,
            navigation: {
              ...s.navigation,
              microId: navMicroId,
              microLabel: answer,
            },
          };
        }
        break;
      }

      case "frameworks.macro": {
        // Skip source-driven write for inline escape options
        if (node.options.includes(answer)) break;

        // Commitment node — write only to frameworkCommitment (handled below), not framework
        if (node.id === "C_SL1_COMMIT") break;

        // Framework macro pick — use resolvedOptionIds to get SSOT ID (e.g. "H2")
        const fwMacroId = s.resolvedOptionIds[answer] ?? answer;
        s = {
          ...s,
          framework: {
            macroId: fwMacroId,
            macroLabel: answer,
            microId: "",
            microLabel: "",
          },
          lastMacroPick: answer,
        };
        break;
      }

      case "frameworks.micro": {
        // Framework micro pick — use resolvedOptionIds to get SSOT ID (e.g. "H2F1")
        const fwMicroId = s.resolvedOptionIds[answer] ?? answer;
        if (s.framework) {
          s = {
            ...s,
            framework: {
              ...s.framework,
              microId: fwMicroId,
              microLabel: answer,
            },
          };
        }
        break;
      }

      case "deliverables":
        // Deliverable pick — may set cpItem
        if (!s.cpItem) {
          const picked = s.deliverables.find((d) => d.label === answer);
          if (picked) {
            s = { ...s, cpItem: { ...picked, isCriticalPath: true } };
          }
        }
        break;

      case "feelings.macro": {
        // Feeling macro pick — use resolvedOptionIds to get SSOT ID (e.g. "1")
        const feelMacroId = s.resolvedOptionIds[answer] ?? answer;
        s = {
          ...s,
          feeling: {
            macroId: feelMacroId,
            macroLabel: answer,
            microId: "",
            microLabel: "",
          },
          lastMacroPick: answer,
        };
        break;
      }

      case "feelings.micro": {
        // Feeling micro pick — use resolvedOptionIds to get SSOT ID (e.g. "1.1")
        const feelMicroId = s.resolvedOptionIds[answer] ?? answer;
        if (s.feeling) {
          s = {
            ...s,
            feeling: { ...s.feeling, microId: feelMicroId, microLabel: answer },
          };
        }
        break;
      }
    }
  }

  // ── ID-pattern-driven state writes (no optionSource) ──

  // Constraint macro pick — B_CONSTRAINT nodes offer macros inline
  if (
    !source &&
    (node.id.startsWith("B_CONSTRAINT") || node.id === "E_CONSTRAINT") &&
    node.type === "question" &&
    answer !== "skip"
  ) {
    s = {
      ...s,
      constraint: {
        macroId: answer.toLowerCase().replace(/ /g, "_"),
        macroLabel: answer,
        microId: "",
        microLabel: "",
      },
      lastMacroPick: answer,
    };
  }

  // SOP macro pick (E_SOP_YES) — same inline constraint macros
  if (node.id === "E_SOP_YES" && answer !== "skip") {
    s = {
      ...s,
      constraint: {
        macroId: answer.toLowerCase().replace(/ /g, "_"),
        macroLabel: answer,
        microId: "",
        microLabel: "",
      },
      lastMacroPick: answer,
    };
  }

  // Feeling macro pick — C_FEEL_ENTRY / C_FEEL_SKIP offer macros inline
  if (
    !source &&
    (node.id === "C_FEEL_ENTRY" || node.id === "C_FEEL_SKIP") &&
    answer !== "skip" &&
    answer !== "really skip"
  ) {
    const feelingMacroMap: Record<
      string,
      { id: string; valence: "positive" | "neutral" | "negative" }
    > = {
      Energized: { id: "1", valence: "positive" },
      Good: { id: "2", valence: "positive" },
      Neutral: { id: "3", valence: "neutral" },
      Drained: { id: "4", valence: "negative" },
      Overwhelmed: { id: "5", valence: "negative" },
    };
    const feelInfo = feelingMacroMap[answer];
    s = {
      ...s,
      feeling: {
        macroId: feelInfo?.id ?? answer.toLowerCase(),
        macroLabel: answer,
        microId: "",
        microLabel: "",
      },
      valence: feelInfo?.valence ?? "neutral",
      lastMacroPick: answer,
    };
  }

  // CPICK_INSIST — moved to advanceAtom (bridge auto-advances with answer=null,
  // so this block inside interpretAnswer would never execute)

  // Narrative input — voice/text nodes store narrative and update charCount
  if (
    node.id === "C_FW_NARR" ||
    node.id === "C_FW_NARR_RECORD" ||
    node.id === "NARR_YES" ||
    node.id === "NARR_NUDGE_PATTERN" ||
    node.id === "NARR_NUDGE_TIME"
  ) {
    if (
      answer !== "voice" &&
      answer !== "text" &&
      answer !== "skip" &&
      answer !== "voice/text"
    ) {
      // This is actual narrative content (from free-text or voice transcript)
      s = { ...s, narrative: answer, charCount: answer.length };
    }
  }

  // Smooth day note — capture free text
  if (node.id === "SMOOTH_NOTE" && answer !== "continue" && answer !== "skip") {
    s = { ...s, smoothDayNote: answer };
  }

  // Free-text pattern capture (E_CP_PATTERN) — store in narrative
  if (node.id === "E_CP_PATTERN" && answer !== "dismiss") {
    s = { ...s, narrative: answer, charCount: answer.length };
  }

  // Framework commitment — user picks a framework macro at the commitment node
  if (node.id === "C_SL1_COMMIT" && answer !== "not yet") {
    const macroId = s.resolvedOptionIds[answer] ?? answer;
    s = { ...s, frameworkCommitment: { macroId, macroLabel: answer } };
  }

  return s;
}

export const advanceAtom = atom(null, (get, set, answer: string | null) => {
  const state = get(engineAtom);
  if (state.isComplete) return;
  if (!state.tree || !state.currentNodeId) return;

  const currentNode = state.tree.nodeMap[state.currentNodeId];
  if (!currentNode) return;

  // Record in history with address
  const registry = state.tree.registry;
  const entry: HistoryEntry = {
    nodeId: currentNode.id,
    section: state.section,
    answer,
    timestamp: Date.now(),
    depth: registry.depth(currentNode.id),
    breadth: registry.breadth(currentNode.id),
  };

  let newState: EngineState = {
    ...state,
    history: [...state.history, entry],
    lastAnswer: answer,
  };

  // ── Clear lastMacroPick at domain boundary (framework → feeling) ──
  if (currentNode.id === "C_BRIDGE_FW_FEEL") {
    newState = { ...newState, lastMacroPick: null };
  }

  // ── Interpret answer based on node context ──
  if (answer && answer !== "skip") {
    newState = interpretAnswer(currentNode, answer, newState);
  }

  // CPICK_INSIST — bridge auto-advances (answer=null), so write sentinel here
  if (currentNode.id === "CPICK_INSIST") {
    newState = {
      ...newState,
      navigation: {
        macroId: "constraint_not_picked",
        macroLabel: "constraint not picked",
        microId: "constraint_not_picked",
        microLabel: "constraint not picked",
      },
    };
  }

  // Find next node
  const nextNode = resolveNextNode(currentNode, newState);

  if (!nextNode) {
    // Check if this is a bridge to another section
    const targetSection = resolveSectionTarget(currentNode);
    if (targetSection && newState.tsvMap) {
      // Set entryPath before loading Section C
      if (targetSection === "C") {
        const isSmooth = currentNode.target === "SECTION_C_SMOOTH";
        newState = { ...newState, entryPath: isSmooth ? "smooth" : "normal" };
      }
      newState = loadSection(newState, targetSection);
    } else {
      // End of conversation
      console.info("[tree-walker] reached end of conversation", {
        currentNodeId: currentNode.id,
      });
      newState = { ...newState, isComplete: true };
    }
  } else {
    newState = { ...newState, currentNodeId: nextNode.id };
  }

  set(engineAtom, newState);

  // Auto-advance if the new node doesn't need user input
  const updatedState = get(engineAtom);
  if (updatedState.currentNodeId && updatedState.tree) {
    const node = updatedState.tree.nodeMap[updatedState.currentNodeId];
    if (node && shouldAutoAdvance(node)) {
      // Use setTimeout to avoid synchronous recursion
      setTimeout(() => set(advanceAtom, null), 0);
    }
  }
});

// ── Action: Update deliverables (from Act1 UI) ──
export const updateDeliverablesAtom = atom(
  null,
  (get, set, deliverables: PlannedDeliverable[]) => {
    const state = get(engineAtom);
    const cpItem = deliverables.find((d) => d.isCriticalPath) ?? null;
    set(engineAtom, { ...state, deliverables, cpItem });
  },
);

// ── Action: Update unplanned items ──
export const updateUnplannedAtom = atom(
  null,
  (get, set, unplanned: UnplannedDeliverable[]) => {
    set(engineAtom, { ...get(engineAtom), unplanned });
  },
);

// ── Action: Set constraint selection ──
export const setConstraintAtom = atom(
  null,
  (get, set, constraint: MacroMicroSelection | null) => {
    set(engineAtom, { ...get(engineAtom), constraint });
  },
);

// ── Action: Set navigation selection ──
export const setNavigationAtom = atom(
  null,
  (get, set, navigation: MacroMicroSelection | null) => {
    set(engineAtom, { ...get(engineAtom), navigation });
  },
);

// ── Action: Set macro pick (for "picks macro" condition) ──
export const setMacroPickAtom = atom(
  null,
  (get, set, macroId: string | null) => {
    set(engineAtom, { ...get(engineAtom), lastMacroPick: macroId });
  },
);

// ── Action: Set narrative text ──
export const setNarrativeAtom = atom(null, (get, set, narrative: string) => {
  set(engineAtom, { ...get(engineAtom), narrative });
});

// ── Action: Set framework selection ──
export const setFrameworkAtom = atom(
  null,
  (get, set, framework: MacroMicroSelection | null) => {
    set(engineAtom, { ...get(engineAtom), framework });
  },
);

// ── Action: Set feeling selection ──
export const setFeelingAtom = atom(
  null,
  (get, set, feeling: MacroMicroSelection | null) => {
    set(engineAtom, { ...get(engineAtom), feeling });
  },
);

// ── Action: Set resolved option IDs (label → source ID map) ──
export const setResolvedOptionIdsAtom = atom(
  null,
  (get, set, ids: Record<string, string>) => {
    set(engineAtom, { ...get(engineAtom), resolvedOptionIds: ids });
  },
);

// ── Internal helpers ──

/**
 * Action-type nodes that nevertheless require user input — the renderer
 * hosts an interactive UI on them (status pickers, unplanned-item form,
 * tension transition, narrative textarea). The engine must NOT auto-advance
 * past these on hydration / chained advance, or the user loses the chance
 * to interact with them — e.g. reloading at A_DELIVER would skip status
 * selection entirely and jump into the conversation.
 *
 * Keep this list in sync with the special-case handling in
 * v7/ConversationRenderer (ActionNode + NARRATIVE_NODE_IDS).
 */
const INTERACTIVE_ACTION_NODE_IDS = new Set<string>([
  "A_DELIVER",
  "A_TENSION",
  "A_TENSION_NOCP",
  "C_FW_NARR_RECORD",
  "NARR_YES",
  "NARR_NUDGE_PATTERN",
  "NARR_NUDGE_TIME",
]);

function isInteractiveActionNode(node: TreeNode): boolean {
  if (INTERACTIVE_ACTION_NODE_IDS.has(node.id)) return true;
  // Unplanned-item add forms — `UP_TIME_YES`, `UP_INC_YES`, `UP_HIST_YES`,
  // `UP_GEN_YES` and any per-section variants. The renderer matches by
  // substring so we mirror that here.
  if (
    node.id.includes("UP_TIME_YES") ||
    node.id.includes("UP_INC_YES") ||
    node.id.includes("UP_HIST_YES") ||
    node.id.includes("UP_GEN_YES")
  ) {
    return true;
  }
  return false;
}

/**
 * Should this node auto-advance (no user input needed)?
 */
function shouldAutoAdvance(node: TreeNode): boolean {
  if (isInteractiveActionNode(node)) return false;
  const autoTypes: string[] = [
    "start",
    "ack",
    "action",
    "signal",
    "bridge",
    "end",
  ];
  return autoTypes.includes(node.type);
}

/**
 * Resolve an intra-section target (GOTO).
 * Returns the target node if the target is a node ID within the current tree.
 * Returns null for cross-section targets (SECTION_B, SECTION_C) — those are
 * handled by the caller via resolveSectionTarget().
 */
function resolveIntraSectionTarget(
  node: TreeNode,
  state: EngineState,
): TreeNode | null {
  if (!node.target || !state.tree) return null;
  if (
    node.target === "SECTION_B" ||
    node.target === "SECTION_C" ||
    node.target === "SECTION_C_SMOOTH"
  )
    return null;
  return state.tree.nodeMap[node.target] ?? null;
}

/**
 * Build a ConversationContext from the current engine state (DRY helper).
 */
function ctxFromState(state: EngineState): ConversationContext {
  return buildContext({
    deliverables: state.deliverables,
    unplanned: state.unplanned,
    cpItem: state.cpItem,
    constraint: state.constraint,
    navigation: state.navigation,
    lastAnswer: state.lastAnswer,
    lastMacroPick: state.lastMacroPick,
    programCpData: state.programCpData,
    programSampleSize: state.programSampleSize,
    programMajorityConstraint: state.programMajorityConstraint,
    unplannedHistoryDays: state.unplannedHistoryDays,
    historyHasFasterInstance: state.cpItem
      ? Boolean(
          state.historyHasFasterInstanceMap[String(state.cpItem.id)] ??
          state.historyHasFasterInstanceMap[state.cpItem.label],
        )
      : false,
    recurringDependency: state.recurringDependency,
    recurringConstraint: state.recurringConstraint,
    isNewNavigation: state.navigation?.microId
      ? (state.isNewNavigationMap[state.navigation.microId] ?? true)
      : false,
    entryPath: state.entryPath,
    smoothStreakDays: state.smoothStreakDays,
    charCount: state.charCount,
    valence: state.valence,
    teamSampleSize: state.teamSampleSize,
    framework: state.framework,
    feeling: state.feeling,
  });
}

/**
 * Resolve which child node to advance to based on the current node and state.
 * When no child matches, falls back to the node's intra-section target (GOTO).
 */
function resolveNextNode(
  currentNode: TreeNode,
  state: EngineState,
): TreeNode | null {
  // Agent node: subtree is collapsed — treat as leaf, use target
  if (currentNode.agent) {
    return resolveIntraSectionTarget(currentNode, state);
  }

  const children = currentNode.children;

  if (children.length === 0) {
    return resolveIntraSectionTarget(currentNode, state);
  }

  // For decision nodes: agent picks the matching child
  if (currentNode.type === "decision") {
    const idx = findMatchingChild(children, ctxFromState(state));
    if (idx >= 0) return children[idx];
    return resolveIntraSectionTarget(currentNode, state);
  }

  // For question nodes with options: match answer to child conditions
  if (currentNode.type === "question" && state.lastAnswer) {
    const idx = findMatchingChild(children, ctxFromState(state));
    if (idx >= 0) return children[idx];
    // No child matched — try intra-section target (e.g. B_CONSTRAINT_2 → CPICK)
    return resolveIntraSectionTarget(currentNode, state);
  }

  // For action/ack/bridge/start nodes: auto-advance to first matching child
  if (shouldAutoAdvance(currentNode)) {
    if (children.length === 1) {
      // If only child is an end node and current node has a target, prefer the target.
      // This handles bridge→end patterns where the bridge should trigger a section jump.
      if (children[0].type === "end" && currentNode.target) {
        return resolveIntraSectionTarget(currentNode, state);
        // Returns null for cross-section targets → caller handles via loadSection()
      }
      return children[0];
    }
    const idx = findMatchingChild(children, ctxFromState(state));
    if (idx >= 0) {
      if (children[idx].type === "end" && currentNode.target) {
        return resolveIntraSectionTarget(currentNode, state);
      }
      return children[idx];
    }
    return resolveIntraSectionTarget(currentNode, state) ?? children[0];
  }

  // Default: first child
  return children[0];
}

/**
 * Check if a node is a bridge to another section.
 * Returns the section ID if the target is SECTION_B, SECTION_C, etc.
 */
function resolveSectionTarget(node: TreeNode): SectionId | null {
  const target = node.target;
  if (!target) return null;
  if (target === "SECTION_B") return "B";
  if (target === "SECTION_C" || target === "SECTION_C_SMOOTH") return "C";
  return null;
}

/**
 * Load a new section's TSV and set up the engine to start it.
 */
function loadSection(state: EngineState, sectionId: SectionId): EngineState {
  if (!state.tsvMap) return { ...state, isComplete: true };

  const files = state.tsvMap[sectionId];
  if (!files || !files.flow) {
    console.warn(`[tree-walker] No TSV files for section ${sectionId}`);
    return { ...state, isComplete: true };
  }

  // Parse if not already parsed
  let tree = state.trees[sectionId];
  if (!tree) {
    tree = parseSplitTSV(files.flow, files.copy, files.options);
  }

  const startNode = findStartNode(tree);

  return {
    ...state,
    section: sectionId,
    tree,
    trees: { ...state.trees, [sectionId]: tree },
    currentNodeId: startNode?.id ?? null,
    lastAnswer: null,
    lastMacroPick: null,
  };
}

/**
 * Interpolate {variables} in node text using conversation state.
 * e.g. "{cpItem.label}" → actual label, "{totalActual}" → number.
 *
 * Every placeholder used in copy TSVs is handled here.
 * Unknown placeholders pass through unchanged (visible in UI as debug signal).
 */
export function interpolateText(text: string, state: EngineState): string {
  // Pre-compute totals once
  const totalPlanned = state.deliverables.reduce(
    (s, d) => s + d.estimateMins,
    0,
  );
  const deliverableActual = state.deliverables.reduce(
    (s, d) => s + d.actualMins,
    0,
  );
  const unplannedMins = state.unplanned.reduce((s, u) => s + u.minutesTaken, 0);
  const totalActual = deliverableActual + unplannedMins;
  const gap = totalActual - totalPlanned;
  const doneCount = state.deliverables.filter(
    (d) => d.status === "done",
  ).length;
  const partialCount = state.deliverables.filter(
    (d) => d.status === "partial",
  ).length;
  const notDoneCount = state.deliverables.filter(
    (d) => d.status === "not_done" || d.status === null,
  ).length;

  return text.replace(/\{([^}]+)\}/g, (match, key: string) => {
    const k = key.trim();

    // ── Critical path ──
    if (k === "cpItem.label" || k === "cpItem")
      return state.cpItem?.label ?? "this task";

    // ── Counts ──
    if (k === "done") return String(doneCount);
    if (k === "doneCount") return String(doneCount);
    if (k === "partial") return String(partialCount);
    if (k === "notDone") return String(notDoneCount);
    if (k === "unplannedCount") return String(state.unplanned.length);

    // ── Time — raw minutes ──
    if (k === "totalPlanned") return String(totalPlanned);
    if (k === "totalActual") return String(totalActual);
    if (k === "estimate") return String(totalPlanned);
    if (k === "actual") return String(totalActual);
    if (k === "gap") return String(gap);
    if (k === "unplannedMins") return String(unplannedMins);

    // ── Time — hours:minutes display ──
    if (k === "plannedH") return String(Math.floor(totalPlanned / 60));
    if (k === "plannedM") return String(totalPlanned % 60);
    if (k === "actualH") return String(Math.floor(totalActual / 60));
    if (k === "actualM") return String(totalActual % 60);

    // ── Time — percentage ──
    if (k === "percent") {
      return totalPlanned > 0
        ? String(Math.round((gap / totalPlanned) * 100))
        : "0";
    }
    // ── Program — constraint frequency percentage ──
    if (k === "programPercent") {
      return String(state.programConstraintPercent);
    }
    if (k === "bestTime") {
      // Phase 1: placeholder — backend will supply historical best time
      return "—";
    }

    // ── QA ──
    if (k === "qaStatus") return state.cpItem?.qaStatus ?? "unknown";

    // ── Constraint selection ──
    if (k === "constraint.microLabel" || k === "constraint.micro") {
      return state.constraint?.microLabel ?? "the constraint";
    }
    if (k === "constraint.macroLabel" || k === "constraint.macro") {
      return state.constraint?.macroLabel ?? "constraint";
    }
    if (k === "constraint") return state.constraint?.macroLabel ?? "constraint";
    if (k === "sop.macroLabel")
      return state.constraint?.macroLabel ?? "the area";

    // ── Navigation selection ──
    if (k === "navigation.microLabel" || k === "navigation.micro") {
      return state.navigation?.microLabel ?? "navigation";
    }
    if (k === "navigation") return state.navigation?.macroLabel ?? "navigation";

    // ── Framework selection ──
    if (k === "framework.macroLabel" || k === "framework.macro") {
      return state.framework?.macroLabel ?? "framework";
    }
    if (k === "framework.microLabel" || k === "framework.micro") {
      return state.framework?.microLabel ?? "practice";
    }
    if (k === "framework") return state.framework?.macroLabel ?? "framework";
    if (k === "commitFramework")
      return state.frameworkCommitment?.macroLabel ?? "a framework";

    // ── Feeling selection ──
    if (k === "feeling.macroLabel")
      return state.feeling?.macroLabel ?? "your feeling";
    if (k === "feeling.microLabel")
      return state.feeling?.microLabel ?? "feeling";

    // ── Deliverable references ──
    if (k === "incompleteItem") {
      const item = state.deliverables.find(
        (d) =>
          d.status === "partial" ||
          d.status === "not_done" ||
          d.status === null,
      );
      return item?.label ?? "an item";
    }
    if (k === "largestItem") {
      const sorted = [...state.deliverables].sort(
        (a, b) => b.estimateMins - a.estimateMins,
      );
      return sorted[0]?.label ?? "a task";
    }
    if (k === "maxEstimate") {
      const sorted = [...state.deliverables].sort(
        (a, b) => b.estimateMins - a.estimateMins,
      );
      return String(sorted[0]?.estimateMins ?? 0) + "m";
    }
    if (k === "deliverable") return state.lastAnswer ?? "the deliverable";
    if (k === "similarWork") {
      // Phase 1: history-based similar work comes from backend
      return "similar work";
    }

    // ── Program data ──
    if (k === "programCpArea") return "the critical deliverable";
    if (k === "topMacro") {
      // Phase 1: top constraint macro from program data
      return state.constraint?.macroLabel ?? "the top constraint";
    }

    // ── Section C — narrative / framework counts ──
    if (k === "charCount") return String(state.charCount);
    if (k === "fwCount") {
      // Phase 1: count of frameworks selected in this session
      return state.framework ? "1" : "0";
    }
    if (k === "fwList") {
      return state.framework?.macroLabel ?? "none selected";
    }
    if (k === "faithAnswer") return state.lastAnswer ?? "—";

    // ── Recurring dependency / constraint history ──
    // Phase 1: recurringDependency not yet on EngineState — use numeric placeholders.
    // When backend supplies data, add recurringDependency to EngineState and read from it.
    if (k === "type") return "this dependency";
    if (k === "n") return "3";
    if (k === "days") return "7";

    // ── Composite text builders ──
    if (k === "bridgeText(improvementScope)") {
      // Build bridge text connecting constraint to improvement scope
      if (state.constraint && state.navigation) {
        return `${state.constraint.macroLabel} → ${state.navigation.macroLabel}`;
      }
      return "improvement scope";
    }

    // Fallback: return the original token
    return match;
  });
}
