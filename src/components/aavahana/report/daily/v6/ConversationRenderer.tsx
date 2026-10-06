"use client";

import React, { useEffect, useCallback, useRef, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import {
  engineAtom,
  currentNodeAtom,
  advanceAtom,
  updateDeliverablesAtom,
  updateUnplannedAtom,
  interpolateText,
  setResolvedOptionIdsAtom,
} from "@/lib/engine/tree-walker";
import type { TreeNode } from "@/lib/engine/tsv-parser";
import { resolveOptions, resolveOptionIds, type ResolverContext } from "@/lib/engine/option-resolver";
import {
  MOCK_CONSTRAINTS,
  MOCK_NESTED_NAVIGATIONS,
  MOCK_FRAMEWORKS,
  MOCK_FEELINGS,
} from "./data/mockData";
import type { PlannedDeliverable, UnplannedDeliverable } from "./data/types";
import { CompactChecklist } from "./CompactChecklist";
import { UnplannedItemForm } from "../v5/UnplannedItemForm";
import { formatMins, STATUS_CYCLE } from "@/types/aavahana/report-v5.types";
import type { UnplannedWorkItem } from "@/types/aavahana/report-v5.types";
import type { PlannedItemStatus } from "@/types/aavahana/report-v5.types";
import { cn } from "@/utils";
import { SectionATransition } from "./SectionATransition";
import { DayCard } from "./DayCard";
import { SvgBubble } from "./shared/SvgBubble";
import { SvgPill } from "./shared/SvgPill";
import { CartographerTable } from "./illustrations/CartographerTable";
import { AvatarGlyph } from "./illustrations/AvatarGlyph";

type Section = "A" | "B" | "C";

/** Section-aware avatar glyph for system bubbles */
function sectionGlyph(section: string): React.ReactNode {
  return <AvatarGlyph section={section as Section} />;
}

// ── Node type renderers ──

interface NodeRendererProps {
  node: TreeNode;
  text: string;
  resolvedOptions: string[];
  onRespond: (answer: string) => void;
  onAutoAdvance: () => void;
  engineState: ReturnType<typeof useAtomValue<typeof engineAtom>>;
  onUpdateDeliverables: (d: PlannedDeliverable[]) => void;
  onUpdateUnplanned: (u: UnplannedDeliverable[]) => void;
}

/** START node — warm greeting, not a form header */
function StartNode({ text, onAutoAdvance, engineState }: NodeRendererProps) {
  useEffect(() => {
    const t = setTimeout(onAutoAdvance, 800);
    return () => clearTimeout(t);
  }, [onAutoAdvance]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="py-2"
    >
      <SvgBubble section={engineState.section as Section} avatarGlyph={sectionGlyph(engineState.section)}>
        {text}
      </SvgBubble>
    </motion.div>
  );
}

/** IDs that need the narrative capture UI instead of simple option pills */
const NARRATIVE_NODE_IDS = new Set([
  "C_FW_NARR_RECORD",
  "NARR_YES",
  "NARR_NUDGE_PATTERN",
  "NARR_NUDGE_TIME",
]);

/**
 * Shared draft field for narrative capture. Used identically by both the text
 * and voice modes so the "at least N characters" rule reads the same either way.
 */
function NarrativeDraftField({
  placeholder,
  draft,
  setDraft,
  charCount,
  minChars,
  onSubmit,
}: {
  placeholder: string;
  draft: string;
  setDraft: (v: string) => void;
  charCount: number;
  minChars: number;
  onSubmit: () => void;
}) {
  const met = charCount >= minChars;
  const remaining = minChars - charCount;
  const pct = Math.min(100, Math.round((charCount / minChars) * 100));

  return (
    <div className="flex flex-col gap-2 pl-2">
      <textarea
        className="textarea textarea-bordered w-full min-h-24 text-sm"
        placeholder={placeholder}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        autoFocus
      />
      {/* Progress toward the minimum — the bar makes the requirement legible at a glance */}
      <progress
        className={cn("progress w-full", met ? "progress-success" : "progress-warning")}
        value={pct}
        max={100}
      />
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-xs",
            met ? "text-success font-medium" : "text-base-content/70",
          )}
        >
          {met
            ? `Minimum met (${charCount} characters)`
            : `At least ${minChars} characters needed — ${remaining} to go`}
        </span>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!met}
          title={met ? undefined : `Write at least ${minChars} characters to submit`}
          className="btn btn-sm btn-primary"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

/** Narrative capture — voice/text mode selector + textarea + char counter */
function NarrativeInputNode({ node, text, onRespond, engineState }: NodeRendererProps) {
  const sec = engineState.section as Section;
  const [mode, setMode] = useState<"voice" | "text" | null>(null);
  const [draft, setDraft] = useState("");
  const charCount = draft.length;
  const MIN_CHARS = 180;

  const handleSubmit = useCallback(() => {
    if (draft.trim().length === 0) return;
    onRespond(draft.trim());
  }, [draft, onRespond]);

  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex flex-col gap-3 py-3"
    >
      <SvgBubble section={sec} avatarGlyph={sectionGlyph(engineState.section)}>{text}</SvgBubble>

      {/* Mode selector */}
      {!mode && (
        <div className="flex flex-col gap-1.5 pl-2">
          <div className="flex gap-2">
            <SvgPill label="text" onClick={() => setMode("text")} section={sec} />
            <SvgPill label="voice" onClick={() => setMode("voice")} section={sec} />
            {node.options?.includes("skip") && (
              <SvgPill label="skip" onClick={() => onRespond("skip")} section={sec} />
            )}
          </div>
          <span className="text-xs text-base-content/60">
            Whether you type or use voice, you&apos;ll need at least {MIN_CHARS} characters
            before you can continue.
          </span>
        </div>
      )}

      {/* Text input mode */}
      <AnimatePresence>
        {mode === "text" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-2"
          >
            <NarrativeDraftField
              placeholder={`Write at least ${MIN_CHARS} characters — what happened when you applied it?`}
              draft={draft}
              setDraft={setDraft}
              charCount={charCount}
              minChars={MIN_CHARS}
              onSubmit={handleSubmit}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice mode — Phase 1: paste transcript */}
      <AnimatePresence>
        {mode === "voice" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-2"
          >
            <NarrativeDraftField
              placeholder={`Paste your voice transcript here — at least ${MIN_CHARS} characters`}
              draft={draft}
              setDraft={setDraft}
              charCount={charCount}
              minChars={MIN_CHARS}
              onSubmit={handleSubmit}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** QUESTION node — system chat bubble with option buttons below */
function QuestionNode({ node, text, resolvedOptions, onRespond, engineState }: NodeRendererProps) {
  const sec = engineState.section as Section;
  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex flex-col gap-3 py-3"
    >
      <SvgBubble section={sec} avatarGlyph={sectionGlyph(engineState.section)}>{text}</SvgBubble>
      {resolvedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2 pl-2">
          {resolvedOptions.map((opt) => (
            <SvgPill
              key={opt}
              label={opt}
              onClick={() => onRespond(opt)}
              section={sec}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

/** DECISION node — subtle pause, no "Thinking..." text */
function DecisionNode({ node, onAutoAdvance, engineState }: NodeRendererProps) {
  useEffect(() => {
    const t = setTimeout(onAutoAdvance, 500);
    return () => clearTimeout(t);
  }, [onAutoAdvance]);

  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="py-1"
    >
      <SvgBubble section={engineState.section as Section} avatarGlyph={sectionGlyph(engineState.section)}>
        <span className="loading loading-dots loading-xs" />
      </SvgBubble>
    </motion.div>
  );
}

const ACK_TIMING: Record<string, number> = { NARR_CONFIRM: 1000 };

/** ACK node — warm acknowledgment bubble */
function AckNode({ node, text, onAutoAdvance, engineState }: NodeRendererProps) {
  useEffect(() => {
    const t = setTimeout(onAutoAdvance, ACK_TIMING[node.id] ?? 1400);
    return () => clearTimeout(t);
  }, [onAutoAdvance, node.id]);

  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      className="py-2"
    >
      <SvgBubble section={engineState.section as Section} avatarGlyph={sectionGlyph(engineState.section)}>{text}</SvgBubble>
    </motion.div>
  );
}

/** A_DELIVER — two-phase: checklist first, then the clearing (map) */
function DeliverStepNode({
  node,
  text,
  engineState,
  onAutoAdvance,
  handleCycleStatus,
  handleAdjustTime,
  handleToggleCriticalPath,
  handleAddUnplanned,
}: {
  node: TreeNode;
  text: string;
  engineState: ReturnType<typeof useAtomValue<typeof engineAtom>>;
  onAutoAdvance: () => void;
  handleCycleStatus: (taskId: string) => void;
  handleAdjustTime: (taskId: string, deltaMins: number) => void;
  handleToggleCriticalPath: (taskId: string) => void;
  handleAddUnplanned: (item: UnplannedWorkItem) => void;
}) {
  const [phase, setPhase] = useState<"checklist" | "clearing">("checklist");
  const hasAnyStatus = engineState.deliverables.some((d) => d.status !== null);

  const plannedMins = engineState.deliverables.reduce((s, d) => s + d.estimateMins, 0);
  const actualMins = engineState.deliverables.reduce((s, d) => s + d.actualMins, 0);
  const unplannedMins = engineState.unplanned.reduce((s, u) => s + u.minutesTaken, 0);
  const totalActual = actualMins + unplannedMins;

  const doneCount = engineState.deliverables.filter((d) => d.status === "done").length;
  const partialCount = engineState.deliverables.filter((d) => d.status === "partial").length;
  const notDoneCount = engineState.deliverables.filter(
    (d) => d.status === "not_done" || d.status === null,
  ).length;

  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex flex-col gap-4 py-4"
    >
      <AnimatePresence mode="wait">
        {phase === "checklist" ? (
          <motion.div
            key="checklist"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-4"
          >
            <SvgBubble section={engineState.section as Section} avatarGlyph={sectionGlyph(engineState.section)}>
              {text}
            </SvgBubble>

            <CompactChecklist
              deliverables={engineState.deliverables}
              onCycleStatus={handleCycleStatus}
              onAdjustTime={handleAdjustTime}
              onToggleCriticalPath={handleToggleCriticalPath}
            />

            {/* Unplanned items */}
            {engineState.unplanned.length > 0 && (
              <div className="flex flex-col gap-1 pl-1">
                {engineState.unplanned.map((u) => (
                  <div key={u.id} className="flex items-center justify-between text-sm">
                    <span className="text-warning">+ {u.label}</span>
                    <span className="text-xs text-warning/60">{formatMins(u.minutesTaken)}</span>
                  </div>
                ))}
              </div>
            )}

            <UnplannedItemForm onAdd={handleAddUnplanned} />

            {/* "See your map" — only after at least one status is set */}
            <motion.button
              type="button"
              disabled={!hasAnyStatus}
              onClick={() => setPhase("clearing")}
              whileTap={hasAnyStatus ? { scale: 0.97 } : undefined}
              className="btn btn-primary btn-sm self-center disabled:opacity-30"
            >
              See your map →
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="clearing"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-6 py-4"
          >
            {/* The clearing — CartographerTable as hero */}
            <CartographerTable
              deliverables={engineState.deliverables}
              unplanned={engineState.unplanned}
              phase="live"
              stepsCompleted={engineState.history.length}
            />

            {/* Compact tension line — not a box, just text */}
            <p className="text-center text-sm text-base-content/50">
              {doneCount > 0 && <span className="text-success">{doneCount} done</span>}
              {doneCount > 0 && (partialCount > 0 || notDoneCount > 0) && <span> · </span>}
              {partialCount > 0 && <span className="text-warning">{partialCount} partial</span>}
              {partialCount > 0 && notDoneCount > 0 && <span> · </span>}
              {notDoneCount > 0 && <span>{notDoneCount} pending</span>}
              <span className="mx-2 text-base-content/20">|</span>
              <span>Plan {formatMins(plannedMins)}</span>
              <span className="text-base-content/30"> → </span>
              <span className={cn(
                "font-semibold",
                totalActual > plannedMins ? "text-warning" : "text-success",
              )}>
                {formatMins(totalActual)}
              </span>
              {unplannedMins > 0 && (
                <span className="text-warning"> (+{formatMins(unplannedMins)})</span>
              )}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPhase("checklist")}
                className="btn btn-ghost btn-sm"
              >
                ← Edit
              </button>
              <motion.button
                type="button"
                onClick={onAutoAdvance}
                whileTap={{ scale: 0.97 }}
                className="btn btn-primary btn-sm"
              >
                Continue
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** ACTION node — side effect or UI action, auto-advances */
function ActionNode({
  node,
  text,
  onAutoAdvance,
  engineState,
  onUpdateDeliverables,
  onUpdateUnplanned,
}: NodeRendererProps) {
  const isDeliverStep = node.id === "A_DELIVER";
  const isTensionTransition =
    node.id === "A_TENSION" || node.id === "A_TENSION_NOCP";
  const isUnplannedAdd =
    node.id.includes("UP_TIME_YES") ||
    node.id.includes("UP_INC_YES") ||
    node.id.includes("UP_HIST_YES") ||
    node.id.includes("UP_GEN_YES");
  const isGenericAction = !isDeliverStep && !isUnplannedAdd && !isTensionTransition;

  useEffect(() => {
    if (!isGenericAction) return;
    const t = setTimeout(onAutoAdvance, 300);
    return () => clearTimeout(t);
  }, [onAutoAdvance, isGenericAction]);

  const handleCycleStatus = useCallback(
    (taskId: string) => {
      const updated = engineState.deliverables.map((d) => {
        if (String(d.id) !== taskId) return d;
        const currentIdx = STATUS_CYCLE.indexOf(d.status as PlannedItemStatus);
        const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];
        return { ...d, status: nextStatus as PlannedDeliverable["status"] };
      });
      onUpdateDeliverables(updated);
    },
    [engineState.deliverables, onUpdateDeliverables],
  );

  const handleAdjustTime = useCallback(
    (taskId: string, deltaMins: number) => {
      const updated = engineState.deliverables.map((d) => {
        if (String(d.id) !== taskId) return d;
        return { ...d, actualMins: Math.max(0, d.actualMins + deltaMins) };
      });
      onUpdateDeliverables(updated);
    },
    [engineState.deliverables, onUpdateDeliverables],
  );

  const handleToggleCriticalPath = useCallback(
    (taskId: string) => {
      const updated = engineState.deliverables.map((d) => ({
        ...d,
        isCriticalPath: String(d.id) === taskId ? !d.isCriticalPath : false,
      }));
      onUpdateDeliverables(updated);
    },
    [engineState.deliverables, onUpdateDeliverables],
  );

  const handleAddUnplanned = useCallback(
    (item: UnplannedWorkItem) => {
      const newItem: UnplannedDeliverable = {
        id: Date.now(),
        gridSlot: "",
        label: item.description,
        minutesTaken: item.minutesTaken,
      };
      onUpdateUnplanned([...engineState.unplanned, newItem]);
    },
    [engineState.unplanned, onUpdateUnplanned],
  );

  if (isDeliverStep) {
    return (
      <DeliverStepNode
        node={node}
        text={text}
        engineState={engineState}
        onAutoAdvance={onAutoAdvance}
        handleCycleStatus={handleCycleStatus}
        handleAdjustTime={handleAdjustTime}
        handleToggleCriticalPath={handleToggleCriticalPath}
        handleAddUnplanned={handleAddUnplanned}
      />
    );
  }

  if (isUnplannedAdd) {
    return (
      <motion.div
        key={node.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="py-4"
      >
        <div className="mb-3">
          <SvgBubble section={engineState.section as Section} avatarGlyph={sectionGlyph(engineState.section)}>{text}</SvgBubble>
        </div>

        {engineState.unplanned.length > 0 && (
          <div className="mb-3 rounded-lg border border-base-300 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral mb-2">
              Unplanned Items
            </p>
            {engineState.unplanned.map((u) => (
              <div key={u.id} className="flex justify-between items-center py-1 text-sm">
                <span className="text-base-content">{u.label}</span>
                <span className="text-warning text-xs">{formatMins(u.minutesTaken)}</span>
              </div>
            ))}
          </div>
        )}

        <UnplannedItemForm onAdd={handleAddUnplanned} />

        <button
          onClick={onAutoAdvance}
          className="btn btn-sm btn-primary mt-3 w-full"
        >
          {engineState.unplanned.length > 0 ? "Continue" : "Skip \u2014 no unplanned work"}
        </button>
      </motion.div>
    );
  }

  if (isTensionTransition) {
    return (
      <SectionATransition
        key={node.id}
        deliverables={engineState.deliverables}
        unplanned={engineState.unplanned}
        onContinue={onAutoAdvance}
      />
    );
  }

  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.7 }}
      exit={{ opacity: 0 }}
      className="py-2 text-xs text-base-content/40 italic"
    >
      {text}
    </motion.div>
  );
}

/** BRIDGE node — conversational transition, not a badge */
function BridgeNode({ node, text, onAutoAdvance, engineState }: NodeRendererProps) {
  useEffect(() => {
    const t = setTimeout(onAutoAdvance, 2000);
    return () => clearTimeout(t);
  }, [onAutoAdvance]);

  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      className="py-3"
    >
      <SvgBubble section={engineState.section as Section} avatarGlyph={sectionGlyph(engineState.section)}>{text}</SvgBubble>
    </motion.div>
  );
}

/** SIGNAL node — belonging cue, not system alert */
function SignalNode({ node, text, onAutoAdvance, engineState }: NodeRendererProps) {
  useEffect(() => {
    const t = setTimeout(onAutoAdvance, 2500);
    return () => clearTimeout(t);
  }, [onAutoAdvance]);

  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      className="py-2"
    >
      <SvgBubble section={engineState.section as Section} avatarGlyph={sectionGlyph(engineState.section)}>{text}</SvgBubble>
    </motion.div>
  );
}

/** NUDGE node — invitation to reflect, as a chat message */
function NudgeNode({ node, text, resolvedOptions, onRespond, engineState }: NodeRendererProps) {
  const sec = engineState.section as Section;
  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex flex-col gap-3 py-3"
    >
      <SvgBubble section={sec} avatarGlyph={sectionGlyph(engineState.section)}>{text}</SvgBubble>
      {resolvedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2 pl-2">
          {resolvedOptions.map((opt) => (
            <SvgPill
              key={opt}
              label={opt}
              onClick={() => onRespond(opt)}
              section={sec}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

/** COMPASSION node — user-paced, not auto-dismissed */
function CompassionNode({ node, text, onAutoAdvance, engineState }: NodeRendererProps) {
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowContinue(true), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-2 py-2"
    >
      <SvgBubble section={engineState.section as Section} avatarGlyph={sectionGlyph(engineState.section)}>{text}</SvgBubble>
      <AnimatePresence>
        {showContinue && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            type="button"
            onClick={onAutoAdvance}
            className="btn btn-ghost btn-xs self-start ml-2 text-base-content/40"
          >
            continue {"\u2192"}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** ELEVATE node — user-paced, not auto-dismissed */
function ElevateNode({ node, text, onAutoAdvance, engineState }: NodeRendererProps) {
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowContinue(true), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-2 py-2"
    >
      <SvgBubble section={engineState.section as Section} avatarGlyph={sectionGlyph(engineState.section)}>{text}</SvgBubble>
      <AnimatePresence>
        {showContinue && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            type="button"
            onClick={onAutoAdvance}
            className="btn btn-ghost btn-xs self-start ml-2 text-base-content/40"
          >
            continue {"\u2192"}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** END node — section complete */
function EndNode({ node, text }: NodeRendererProps) {
  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-6"
    >
      <div className="text-sm font-medium text-success">{text}</div>
    </motion.div>
  );
}

/** ANSWER node — echo user selection */
function AnswerNode({ node, text, onAutoAdvance, engineState }: NodeRendererProps) {
  useEffect(() => {
    const t = setTimeout(onAutoAdvance, 300);
    return () => clearTimeout(t);
  }, [onAutoAdvance]);

  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="flex justify-end py-1"
    >
      <SvgBubble section={engineState.section as Section} variant="user">
        {text}
      </SvgBubble>
    </motion.div>
  );
}

// ── Node type -> renderer map ──
const NODE_RENDERERS: Record<string, React.FC<NodeRendererProps>> = {
  start: StartNode,
  question: QuestionNode,
  decision: DecisionNode,
  ack: AckNode,
  action: ActionNode,
  bridge: BridgeNode,
  signal: SignalNode,
  nudge: NudgeNode,
  compassion: CompassionNode,
  elevate: ElevateNode,
  end: EndNode,
  answer: AnswerNode,
};

// ── Narrative completion summary builder ──

function buildNarrativeSummary(engineState: ReturnType<typeof useAtomValue<typeof engineAtom>>): string {
  const parts: string[] = [];

  const doneCount = engineState.deliverables.filter((d) => d.status === "done").length;
  const total = engineState.deliverables.length;
  const unplannedCount = engineState.unplanned.length;

  if (doneCount === total && total > 0) {
    parts.push(`You got all ${total} things across the line today`);
  } else if (doneCount > 0) {
    const partialCount = engineState.deliverables.filter((d) => d.status === "partial").length;
    parts.push(`You got ${doneCount} thing${doneCount > 1 ? "s" : ""} done`);
    if (partialCount > 0) parts.push(`made progress on ${partialCount} more`);
  }

  if (unplannedCount > 0) {
    parts.push(`handled ${unplannedCount} unplanned item${unplannedCount > 1 ? "s" : ""}`);
  }

  if (engineState.constraint?.microLabel && engineState.navigation?.microLabel) {
    parts.push(
      `ran into ${engineState.constraint.microLabel} and worked through it with ${engineState.navigation.microLabel}`,
    );
  }

  if (engineState.feeling?.macroLabel) {
    parts.push(`you\u2019re feeling ${engineState.feeling.macroLabel.toLowerCase()}`);
  }

  if (parts.length === 0) return "Your reflection is saved.";

  // Capitalize first, join with commas, end with period
  const sentence = parts.join(", ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
}

// ── Main renderer ──

export function ConversationRenderer() {
  const [engineState] = useAtom(engineAtom);
  const currentNode = useAtomValue(currentNodeAtom);
  const advance = useSetAtom(advanceAtom);
  const updateDeliverables = useSetAtom(updateDeliverablesAtom);
  const updateUnplanned = useSetAtom(updateUnplannedAtom);
  const setResolvedOptionIds = useSetAtom(setResolvedOptionIdsAtom);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new node
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [currentNode?.id]);

  const handleRespond = useCallback(
    (answer: string) => {
      advance(answer);
    },
    [advance],
  );

  const handleAutoAdvance = useCallback(() => {
    advance(null);
  }, [advance]);

  const handleUpdateDeliverables = useCallback(
    (d: PlannedDeliverable[]) => {
      updateDeliverables(d);
    },
    [updateDeliverables],
  );

  const handleUpdateUnplanned = useCallback(
    (u: UnplannedDeliverable[]) => {
      updateUnplanned(u);
    },
    [updateUnplanned],
  );

  // Must run before early returns to satisfy rules-of-hooks
  const resolverCtxForIds: ResolverContext = {
    constraints: MOCK_CONSTRAINTS,
    navigations: MOCK_NESTED_NAVIGATIONS,
    frameworks: MOCK_FRAMEWORKS,
    feelings: MOCK_FEELINGS,
    deliverableLabels: engineState.deliverables.map((d) => d.label),
    selectedConstraintMacro: engineState.constraint?.macroId ?? null,
    selectedConstraintMicro: engineState.constraint?.microId ?? null,
    selectedNavigationMacro: engineState.navigation?.macroId ?? null,
    selectedFrameworkMacro: engineState.framework?.macroId ?? null,
    selectedFeelingMacro: engineState.feeling?.macroId ?? null,
  };
  const optionIds = currentNode ? resolveOptionIds(currentNode, resolverCtxForIds) : {};
  useEffect(() => {
    setResolvedOptionIds(optionIds);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- optionIds is a fresh object each render; currentNode?.id is the stable proxy
  }, [currentNode?.id, setResolvedOptionIds]);

  if (engineState.isComplete) {
    const narrative = buildNarrativeSummary(engineState);
    return (
      <div className="max-w-xl mx-auto px-4">
        {/* Final day card — fully built */}
        <DayCard state={engineState} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 py-8 text-center"
        >
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-md text-sm text-base-content/70 leading-relaxed"
          >
            {narrative}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xs text-base-content/40"
          >
            Your reflection is saved. See you tomorrow.
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (!currentNode) {
    return (
      <div className="text-center py-12 text-base-content/40">
        <p>Loading conversation...</p>
      </div>
    );
  }

  const isUnplannedBridge =
    currentNode.type === "bridge" && (
      currentNode.id.includes("UP_TIME_YES") ||
      currentNode.id.includes("UP_INC_YES") ||
      currentNode.id.includes("UP_HIST_YES") ||
      currentNode.id.includes("UP_GEN_YES")
    );
  const isNarrativeInput = NARRATIVE_NODE_IDS.has(currentNode.id);
  const Renderer = isNarrativeInput
    ? NarrativeInputNode
    : isUnplannedBridge
      ? ActionNode
      : (NODE_RENDERERS[currentNode.type] ?? ActionNode);
  const interpolatedText = interpolateText(currentNode.text, engineState);

  const options = resolveOptions(currentNode, resolverCtxForIds);

  // Last user answer for context (just one, not a wall of text)
  const lastAnswer = [...engineState.history].reverse().find((e) => e.answer);

  const isCurrentDeliverStep = currentNode.id === "A_DELIVER";

  return (
    <div className="max-w-xl mx-auto px-4 flex flex-col gap-4">
      {/* Live day card — hidden during A_DELIVER to avoid duplication with checklist */}
      {!isCurrentDeliverStep && <DayCard state={engineState} />}

      {/* Last answer echo (single line of context, not a chat log) */}
      {lastAnswer?.answer && (
        <div className="flex justify-end">
          <SvgBubble section={engineState.section as Section} variant="user">
            {lastAnswer.answer}
          </SvgBubble>
        </div>
      )}

      {/* Current node */}
      <AnimatePresence mode="wait">
        <Renderer
          key={currentNode.id}
          node={currentNode}
          text={interpolatedText}
          resolvedOptions={options}
          onRespond={handleRespond}
          onAutoAdvance={handleAutoAdvance}
          engineState={engineState}
          onUpdateDeliverables={handleUpdateDeliverables}
          onUpdateUnplanned={handleUpdateUnplanned}
        />
      </AnimatePresence>

      <div ref={bottomRef} />
    </div>
  );
}
