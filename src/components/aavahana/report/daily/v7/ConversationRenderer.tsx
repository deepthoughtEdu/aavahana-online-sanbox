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
import {
  resolveOptions,
  resolveOptionIds,
  type ResolverContext,
} from "@/lib/engine/option-resolver";
import {
  dictionariesAtom,
  aiFeedbackAtom,
  reportIdAtom,
  submitPendingAtom,
} from "./data/atoms";
import {
  byokConfigAtom,
  normalizeByokModel,
} from "@/lib/store/shared/byok.store";
import { useV7RegenerateAi } from "@/lib/hooks/aavahana/use-report-v7";
import { isError } from "@/lib/api/client";
import { sortFrameworksByConstraint } from "@/lib/adapters/report-v7.adapters";
import type { PlannedDeliverable, UnplannedDeliverable } from "./data/types";
import { CompactChecklist } from "./CompactChecklist";
import { UnplannedItemForm } from "../v5/UnplannedItemForm";
import { formatMins, STATUS_CYCLE } from "@/types/aavahana/report-v5.types";
import type { UnplannedWorkItem } from "@/types/aavahana/report-v5.types";
import type { PlannedItemStatus } from "@/types/aavahana/report-v5.types";
import { cn } from "@/utils";
import { SectionATransition } from "./SectionATransition";
import { DayCard } from "./DayCard";
import { ReflectionRecap } from "./ReflectionRecap";
import { AiReflectionPanel } from "./AiReflectionPanel";
import { VoiceRecorder } from "./Act2Story/VoiceRecorder";
import { SvgBubble } from "./shared/SvgBubble";
import { SvgPill } from "./shared/SvgPill";
import { CartographerTable } from "./illustrations/CartographerTable";
import { AvatarGlyph } from "./illustrations/AvatarGlyph";
import { todayISO } from "@/utils/shared/date.utils";

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
      <SvgBubble
        section={engineState.section as Section}
        avatarGlyph={sectionGlyph(engineState.section)}
      >
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

/** Narrative capture — voice/text mode selector + textarea + char counter */
function NarrativeInputNode({
  node,
  text,
  onRespond,
  engineState,
}: NodeRendererProps) {
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
      <SvgBubble section={sec} avatarGlyph={sectionGlyph(engineState.section)}>
        {text}
      </SvgBubble>

      {/* Mode selector */}
      {!mode && (
        <div id="tour-narrative-input" className="flex gap-2 pl-2">
          <SvgPill label="text" onClick={() => setMode("text")} section={sec} />
          <SvgPill
            label="voice"
            onClick={() => setMode("voice")}
            section={sec}
          />
          {node.options?.includes("skip") && (
            <SvgPill
              label="skip"
              onClick={() => onRespond("skip")}
              section={sec}
            />
          )}
        </div>
      )}

      {/* Text input mode */}
      <AnimatePresence>
        {mode === "text" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-2 pl-2"
          >
            <textarea
              className="textarea textarea-bordered w-full min-h-24 text-sm"
              placeholder={`Write at least ${MIN_CHARS} characters — what happened when you applied it?`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
            />
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "text-xs",
                  charCount >= MIN_CHARS
                    ? "text-success font-medium"
                    : "text-base-content/60",
                )}
              >
                {charCount >= MIN_CHARS
                  ? `Minimum met (${charCount} characters)`
                  : `${MIN_CHARS - charCount} more characters needed`}
              </span>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={charCount < MIN_CHARS}
                className="btn btn-sm btn-primary"
              >
                Submit
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice mode — live recording via Web Speech API. Pre-fills the
          transcript so the user can edit if needed before submitting. */}
      <AnimatePresence>
        {mode === "voice" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-2 pl-2"
          >
            <VoiceRecorder
              prompt={text}
              transcript={draft}
              onTranscriptChange={setDraft}
              onDone={handleSubmit}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** QUESTION node — system chat bubble with option buttons below */
function QuestionNode({
  node,
  text,
  resolvedOptions,
  onRespond,
  engineState,
}: NodeRendererProps) {
  const sec = engineState.section as Section;
  const pillsId =
    node.id.startsWith("B_CONSTRAINT") ||
    node.id === "E_CONSTRAINT" ||
    node.id === "E_SOP_YES"
      ? "tour-constraint-picker"
      : node.id.startsWith("B_NAV") ||
          node.id.startsWith("CPICK") ||
          node.id.startsWith("E_NAV")
        ? "tour-navigation-picker"
        : undefined;
  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex flex-col gap-3 py-3"
    >
      <SvgBubble section={sec} avatarGlyph={sectionGlyph(engineState.section)}>
        {text}
      </SvgBubble>
      {resolvedOptions.length > 0 && (
        <div id={pillsId} className="flex flex-wrap gap-2 pl-2">
          {dedupePreserveOrder(resolvedOptions).map((opt, i) => (
            <SvgPill
              key={`${opt}-${i}`}
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

/**
 * Strip duplicate option labels while keeping the first occurrence. Guards
 * against duplicate React keys when an ontology table (e.g. FrameworkRegistry)
 * has been seeded twice — clicking either copy would do the same thing, so
 * showing both is just noise.
 */
function dedupePreserveOrder(opts: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const o of opts) {
    if (seen.has(o)) continue;
    seen.add(o);
    out.push(o);
  }
  return out;
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
      <SvgBubble
        section={engineState.section as Section}
        avatarGlyph={sectionGlyph(engineState.section)}
      >
        <span className="loading loading-dots loading-xs" />
      </SvgBubble>
    </motion.div>
  );
}

const ACK_TIMING: Record<string, number> = { NARR_CONFIRM: 1000 };

/** ACK node — warm acknowledgment bubble */
function AckNode({
  node,
  text,
  onAutoAdvance,
  engineState,
}: NodeRendererProps) {
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
      <SvgBubble
        section={engineState.section as Section}
        avatarGlyph={sectionGlyph(engineState.section)}
      >
        {text}
      </SvgBubble>
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

  const plannedMins = engineState.deliverables.reduce(
    (s, d) => s + d.estimateMins,
    0,
  );
  const actualMins = engineState.deliverables.reduce(
    (s, d) => s + d.actualMins,
    0,
  );
  const unplannedMins = engineState.unplanned.reduce(
    (s, u) => s + u.minutesTaken,
    0,
  );
  const totalActual = actualMins + unplannedMins;

  const doneCount = engineState.deliverables.filter(
    (d) => d.status === "done",
  ).length;
  const partialCount = engineState.deliverables.filter(
    (d) => d.status === "partial",
  ).length;
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
            <SvgBubble
              section={engineState.section as Section}
              avatarGlyph={sectionGlyph(engineState.section)}
            >
              {text}
            </SvgBubble>

            <div id="tour-deliver-checklist">
              <CompactChecklist
                deliverables={engineState.deliverables}
                onCycleStatus={handleCycleStatus}
                onAdjustTime={handleAdjustTime}
                onToggleCriticalPath={handleToggleCriticalPath}
              />
            </div>

            {/* Unplanned items */}
            {engineState.unplanned.length > 0 && (
              <div className="flex flex-col gap-1 pl-1">
                {engineState.unplanned.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-warning">+ {u.label}</span>
                    <span className="text-xs text-warning/60">
                      {formatMins(u.minutesTaken)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <UnplannedItemForm onAdd={handleAddUnplanned} />

            {/* "See your map" — only after at least one status is set */}
            <motion.button
              id="tour-deliver-next"
              type="button"
              disabled={!hasAnyStatus}
              onClick={() => setPhase("clearing")}
              whileTap={hasAnyStatus ? { scale: 0.96 } : undefined}
              animate={
                hasAnyStatus
                  ? {
                      scale: [1, 1.04, 1],
                      transition: {
                        repeat: Infinity,
                        duration: 2.5,
                        ease: "easeInOut",
                      },
                    }
                  : { scale: 1 }
              }
              className="btn btn-primary self-center px-8 shadow-md shadow-primary/25 disabled:opacity-20"
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
              {doneCount > 0 && (
                <span className="text-success">{doneCount} done</span>
              )}
              {doneCount > 0 && (partialCount > 0 || notDoneCount > 0) && (
                <span> · </span>
              )}
              {partialCount > 0 && (
                <span className="text-warning">{partialCount} partial</span>
              )}
              {partialCount > 0 && notDoneCount > 0 && <span> · </span>}
              {notDoneCount > 0 && <span>{notDoneCount} pending</span>}
              <span className="mx-2 text-base-content/20">|</span>
              <span>Plan {formatMins(plannedMins)}</span>
              <span className="text-base-content/30"> → </span>
              <span
                className={cn(
                  "font-semibold",
                  totalActual > plannedMins ? "text-warning" : "text-success",
                )}
              >
                {formatMins(totalActual)}
              </span>
              {unplannedMins > 0 && (
                <span className="text-warning">
                  {" "}
                  (+{formatMins(unplannedMins)})
                </span>
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
  const isGenericAction =
    !isDeliverStep && !isUnplannedAdd && !isTensionTransition;

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
          <SvgBubble
            section={engineState.section as Section}
            avatarGlyph={sectionGlyph(engineState.section)}
          >
            {text}
          </SvgBubble>
        </div>

        {engineState.unplanned.length > 0 && (
          <div className="mb-3 rounded-lg border border-base-300 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral mb-2">
              Unplanned Items
            </p>
            {engineState.unplanned.map((u) => (
              <div
                key={u.id}
                className="flex justify-between items-center py-1 text-sm"
              >
                <span className="text-base-content">{u.label}</span>
                <span className="text-warning text-xs">
                  {formatMins(u.minutesTaken)}
                </span>
              </div>
            ))}
          </div>
        )}

        <UnplannedItemForm onAdd={handleAddUnplanned} />

        <button
          onClick={onAutoAdvance}
          className="btn btn-sm btn-primary mt-3 w-full"
        >
          {engineState.unplanned.length > 0
            ? "Continue"
            : "Skip \u2014 no unplanned work"}
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
function BridgeNode({
  node,
  text,
  onAutoAdvance,
  engineState,
}: NodeRendererProps) {
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
      <SvgBubble
        section={engineState.section as Section}
        avatarGlyph={sectionGlyph(engineState.section)}
      >
        {text}
      </SvgBubble>
    </motion.div>
  );
}

/** SIGNAL node — belonging cue, not system alert */
function SignalNode({
  node,
  text,
  onAutoAdvance,
  engineState,
}: NodeRendererProps) {
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
      <SvgBubble
        section={engineState.section as Section}
        avatarGlyph={sectionGlyph(engineState.section)}
      >
        {text}
      </SvgBubble>
    </motion.div>
  );
}

/** NUDGE node — invitation to reflect, as a chat message */
function NudgeNode({
  node,
  text,
  resolvedOptions,
  onRespond,
  engineState,
}: NodeRendererProps) {
  const sec = engineState.section as Section;
  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex flex-col gap-3 py-3"
    >
      <SvgBubble section={sec} avatarGlyph={sectionGlyph(engineState.section)}>
        {text}
      </SvgBubble>
      {resolvedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2 pl-2">
          {dedupePreserveOrder(resolvedOptions).map((opt, i) => (
            <SvgPill
              key={`${opt}-${i}`}
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
function CompassionNode({
  node,
  text,
  onAutoAdvance,
  engineState,
}: NodeRendererProps) {
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
      <SvgBubble
        section={engineState.section as Section}
        avatarGlyph={sectionGlyph(engineState.section)}
      >
        {text}
      </SvgBubble>
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
function ElevateNode({
  node,
  text,
  onAutoAdvance,
  engineState,
}: NodeRendererProps) {
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
      <SvgBubble
        section={engineState.section as Section}
        avatarGlyph={sectionGlyph(engineState.section)}
      >
        {text}
      </SvgBubble>
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
function AnswerNode({
  node,
  text,
  onAutoAdvance,
  engineState,
}: NodeRendererProps) {
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

// ── Main renderer ──

interface ConversationRendererProps {
  /** Re-submit the current engine state — used by the inline "Edit report"
   *  flow on the completion view (status edits → save). */
  onResubmit?: () => void;
}

export function ConversationRenderer({
  onResubmit,
}: ConversationRendererProps = {}) {
  const [engineState] = useAtom(engineAtom);
  const currentNode = useAtomValue(currentNodeAtom);
  const advance = useSetAtom(advanceAtom);
  const updateDeliverables = useSetAtom(updateDeliverablesAtom);
  const updateUnplanned = useSetAtom(updateUnplannedAtom);
  const setResolvedOptionIds = useSetAtom(setResolvedOptionIdsAtom);
  const aiFeedback = useAtomValue(aiFeedbackAtom);
  const reportId = useAtomValue(reportIdAtom);
  // Inline status-editing on the completion view — `editing` swaps the
  // read-only DayCard for an editable checklist of the day's tasks.
  const [editing, setEditing] = useState(false);
  const setAiFeedback = useSetAtom(aiFeedbackAtom);
  const submitPending = useAtomValue(submitPendingAtom);
  const byokConfig = useAtomValue(byokConfigAtom);
  const { mutate: regenerateAi, isPending: isRegenerating } =
    useV7RegenerateAi();
  const bottomRef = useRef<HTMLDivElement>(null);

  // "Try again" — re-run the AI prompts for today's already-submitted report.
  // Backend caps the retry budget; success path replaces the aiFeedback atom
  // so the panel re-renders with the new content.
  const handleRegenerate = useCallback(() => {
    if (!byokConfig.apiKey || !byokConfig.provider || !byokConfig.model) return;
    const today = todayISO();
    regenerateAi(
      {
        date: today,
        apiKey: byokConfig.apiKey,
        provider: byokConfig.provider,
        model: normalizeByokModel(byokConfig.model),
      },
      {
        onSuccess: (result) => {
          if (result && !isError(result)) {
            setAiFeedback(result);
          }
        },
      },
    );
  }, [byokConfig, regenerateAi, setAiFeedback]);

  // Auto-scroll to bottom on new node
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [currentNode?.id]);

  // Always holds the label→ID map from the LATEST render. The engine's copy
  // (set by the effect below) refreshes only on node change, so a session
  // resumed at a picker node (refresh/draft hydration) would answer against a
  // map computed before dictionaries loaded — storing raw labels as IDs and
  // blanking the dependent micro list. Committing the ref's map synchronously
  // before advancing closes that gap.
  const optionIdsRef = useRef<Record<string, string>>({});

  const handleRespond = useCallback(
    (answer: string) => {
      setResolvedOptionIds(optionIdsRef.current);
      advance(answer);
    },
    [advance, setResolvedOptionIds],
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

  // ── Completion-view inline status editing ──
  // These mirror ActionNode's A_DELIVER handlers so the user can revise task
  // statuses (and time / critical-path) after submission without re-walking
  // the conversation, then save → re-submit.
  const editCycleStatus = useCallback(
    (taskId: string) => {
      const updated = engineState.deliverables.map((d) => {
        if (String(d.id) !== taskId) return d;
        const currentIdx = STATUS_CYCLE.indexOf(d.status as PlannedItemStatus);
        const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];
        return { ...d, status: nextStatus as PlannedDeliverable["status"] };
      });
      updateDeliverables(updated);
    },
    [engineState.deliverables, updateDeliverables],
  );

  const editAdjustTime = useCallback(
    (taskId: string, deltaMins: number) => {
      const updated = engineState.deliverables.map((d) =>
        String(d.id) === taskId
          ? { ...d, actualMins: Math.max(0, d.actualMins + deltaMins) }
          : d,
      );
      updateDeliverables(updated);
    },
    [engineState.deliverables, updateDeliverables],
  );

  const editToggleCriticalPath = useCallback(
    (taskId: string) => {
      const updated = engineState.deliverables.map((d) => ({
        ...d,
        isCriticalPath: String(d.id) === taskId ? !d.isCriticalPath : false,
      }));
      updateDeliverables(updated);
    },
    [engineState.deliverables, updateDeliverables],
  );

  const handleSaveEdits = useCallback(() => {
    onResubmit?.();
    setEditing(false);
  }, [onResubmit]);

  // Must run before early returns to satisfy rules-of-hooks
  const dictionaries = useAtomValue(dictionariesAtom);
  const emptyDict = { macro: [], micro: {} };
  const frameworksDict = sortFrameworksByConstraint(
    dictionaries?.frameworks ?? emptyDict,
    engineState.constraint?.macroId ?? null,
  );
  // Drafts answered against a stale (empty) label→ID map hold the macro LABEL
  // where the ID belongs (e.g. "maths" instead of "T2"), which blanks the
  // micro lookup — heal by mapping a label back to its dictionary ID.
  const asMacroId = (
    dict: ResolverContext["frameworks"],
    raw: string | null,
  ): string | null =>
    raw && !dict.micro[raw]
      ? (dict.macro.find((m) => m.label === raw)?.id ?? raw)
      : raw;
  const resolverCtxForIds: ResolverContext = {
    constraints: dictionaries?.constraints ?? emptyDict,
    navigations: dictionaries?.navigations ?? {},
    frameworks: frameworksDict,
    feelings: dictionaries?.feelings ?? emptyDict,
    deliverableLabels: engineState.deliverables.map((d) => d.label),
    selectedConstraintMacro: asMacroId(
      dictionaries?.constraints ?? emptyDict,
      engineState.constraint?.macroId ?? null,
    ),
    selectedConstraintMicro: engineState.constraint?.microId ?? null,
    selectedNavigationMacro: engineState.navigation?.macroId ?? null,
    selectedFrameworkMacro: asMacroId(
      frameworksDict,
      engineState.framework?.macroId ?? null,
    ),
    selectedFeelingMacro: asMacroId(
      dictionaries?.feelings ?? emptyDict,
      engineState.feeling?.macroId ?? null,
    ),
  };
  const optionIds = currentNode
    ? resolveOptionIds(currentNode, resolverCtxForIds)
    : {};
  optionIdsRef.current = optionIds;
  useEffect(() => {
    setResolvedOptionIds(optionIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- optionIds is a fresh object each render; node id + dictionaries are the stable proxies
  }, [currentNode?.id, dictionaries, setResolvedOptionIds]);

  // Treat reaching an "end"-type TSV node as equivalent to engineState.isComplete.
  // The auto-advance chain after a terminal node should flip isComplete=true via
  // advanceAtom, but if that ever fails for any reason (browser tab throttling
  // setTimeout(0), StrictMode double-mount race, etc.) landing on an end node
  // is itself a definitive "done" signal — render the completion view from it.
  const atEndNode = currentNode?.type === "end";
  if (engineState.isComplete || atEndNode) {
    // Completion view — three blocks stacked vertically:
    //   1. DayCard — deterministic visual recap (status pills, time bar, etc.)
    //   2. The TSV's own end-node text rendered as a closing chat bubble. The
    //      TSV is the SSOT for what the conversation says, including how the
    //      day closes — no need to duplicate that prose in JS.
    //   3. AiReflectionPanel — optional, renders only when AI is configured.
    //
    // Resolving the end-node text: prefer the node the engine is parked on,
    // fall back to looking up any "end" node in the loaded tree (defensive
    // for the case where isComplete is true but currentNode has drifted).
    const endNode =
      currentNode?.type === "end"
        ? currentNode
        : (Object.values(engineState.tree?.nodeMap ?? {}).find(
            (n) => n?.type === "end",
          ) ?? null);
    const endText = endNode
      ? interpolateText(endNode.text, engineState)
      : "Day captured ✓";

    return (
      <div className="mx-auto w-full max-w-5xl px-4 lg:px-6">
        <div className="flex flex-col gap-6">
          {/* Task recap — read-only DayCard, or an editable checklist while the
              user is revising statuses. Editing never re-walks the conversation;
              it only changes deliverable status/time/critical-path, then a Save
              re-submits the report (backend upserts by eid+date). */}
          {editing ? (
            <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-base-content">
                  Edit task statuses
                </h3>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="btn btn-ghost btn-xs"
                  disabled={submitPending}
                >
                  Cancel
                </button>
              </div>
              <CompactChecklist
                deliverables={engineState.deliverables}
                onCycleStatus={editCycleStatus}
                onAdjustTime={editAdjustTime}
                onToggleCriticalPath={editToggleCriticalPath}
              />
              <button
                type="button"
                onClick={handleSaveEdits}
                disabled={submitPending}
                className="btn btn-primary btn-sm mt-4 w-full"
              >
                {submitPending ? "Saving…" : "Save changes"}
              </button>
            </div>
          ) : (
            <DayCard state={engineState} />
          )}

          <ReflectionRecap state={engineState} />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex justify-start"
          >
            <SvgBubble
              section={engineState.section as Section}
              avatarGlyph={sectionGlyph(engineState.section)}
            >
              {endText}
            </SvgBubble>
          </motion.div>

          {/* Edit report — inline status editing, no conversation re-walk. */}
          {!editing && onResubmit && (
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="btn btn-outline btn-sm"
              >
                Edit report
              </button>
              <span className="text-xs text-base-content/50">
                Update your task statuses, then save.
              </span>
            </div>
          )}

          <AiReflectionPanel
            aiFeedback={aiFeedback}
            reportId={reportId}
            isLoading={submitPending}
            // Only expose regenerate when BYOK is actually configured — otherwise
            // the button (especially the "Generate AI feedback" CTA on
            // status:'skipped') would no-op silently on click.
            onRegenerate={
              byokConfig.apiKey && byokConfig.provider && byokConfig.model
                ? handleRegenerate
                : undefined
            }
            isRegenerating={isRegenerating}
          />
        </div>
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
    currentNode.type === "bridge" &&
    (currentNode.id.includes("UP_TIME_YES") ||
      currentNode.id.includes("UP_INC_YES") ||
      currentNode.id.includes("UP_HIST_YES") ||
      currentNode.id.includes("UP_GEN_YES"));
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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 lg:max-w-3xl lg:px-6">
      {/* Live day card — hidden during A_DELIVER to avoid duplication with checklist */}
      {!isCurrentDeliverStep && (
        <div id="tour-day-card">
          <DayCard state={engineState} />
        </div>
      )}

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
