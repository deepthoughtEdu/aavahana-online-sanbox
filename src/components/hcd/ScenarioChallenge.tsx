"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAtom } from "jotai";
import { useBlock } from "@/lib/hooks/hcd/use-block";
import { hcdByokAtom } from "@/lib/store/hcd/hcd-byok.store";
import { HcdByokSetup } from "@/components/hcd/HcdByokSetup";

// ─────────────────────────────────────────────────────────────────────────────
// THE OPERATOR'S RUN — a visual-novel adventure that runs on the same data any
// framework provides: a list of moments, each with moves carrying a strength
// (weight 1-10) and a rationale. You never see the strength before you commit —
// you live the consequence. Two meters drive the drama: MOMENTUM (toward the
// win) and STANDING (your credibility — bleed it to zero and you're knocked out).
// All scoring is pure arithmetic from weights. No LLM in the loop. Framework
// names are fixed so any framework — even a future one — plays with zero config.
// ─────────────────────────────────────────────────────────────────────────────

interface Opt {
  text: string;
  weight: number;
  rationale: string;
}
interface Scene {
  id: number;
  prompt: string;
  options: Opt[];
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

// Pure move resolution — the only "physics". Derives meter deltas from weight.
function resolve(w: number, isFinale: boolean) {
  const centered = clamp(w, 1, 10) - 5.5;
  let momentumDelta = Math.round(centered * 3); // ≈ -14..+14
  let standingDelta = w >= 6 ? Math.round((w - 6) * 1.5) : Math.round((w - 6) * 3); // heals slow, hurts hard
  if (isFinale) {
    momentumDelta = Math.round(momentumDelta * 1.6);
    standingDelta = Math.round(standingDelta * 1.4);
  }
  return { momentumDelta, standingDelta };
}

// The consequence VERB is relative to what THIS moment offered — strong-in-a-weak
// scene still lands. No absolute answer key, no "/10" ever surfaced.
function gradeVerb(w: number, weights: number[]): { label: string; tone: string } {
  const best = Math.max(...weights);
  const worst = Math.min(...weights);
  if (w === best) return { label: "That landed.", tone: "text-emerald-600" };
  if (w >= best - 1) return { label: "Held — just.", tone: "text-emerald-600" };
  if (w === worst && worst !== best) return { label: "That cost you.", tone: "text-amber-500" };
  return { label: "Shaky, but you're moving.", tone: "text-amber-500" };
}

type Ending = "knockout" | "triumph" | "win" | "narrow" | "costly";

function tierEnding(momentum: number, recovered: boolean): Ending {
  if (recovered && momentum >= 50) return "win";
  if (momentum >= 75) return "triumph";
  if (momentum >= 50) return "win";
  if (momentum >= 30) return "narrow";
  return "costly";
}

function endingMeta(e: Ending): { emblem: string; title: string; tone: string } {
  switch (e) {
    case "triumph":
      return { emblem: "★", title: "You owned it.", tone: "bg-emerald-500" };
    case "win":
      return { emblem: "✓", title: "You pulled it off.", tone: "bg-primary" };
    case "narrow":
      return { emblem: "◑", title: "You scraped through.", tone: "bg-amber-400" };
    case "costly":
      return { emblem: "○", title: "It slipped away — this time.", tone: "bg-base-300" };
    case "knockout":
      return { emblem: "✕", title: "The room lost confidence in you.", tone: "bg-error" };
  }
}

interface RunState {
  i: number;
  momentum: number;
  standing: number;
  picked: number | null;
  revealed: boolean;
  ended: Ending | null;
  recovered: boolean;
  scare: boolean;
  log: { weight: number; momentumDelta: number; standingDelta: number; text: string }[];
}
const INITIAL: RunState = {
  i: 0,
  momentum: 50,
  standing: 70,
  picked: null,
  revealed: false,
  ended: null,
  recovered: false,
  scare: false,
  log: [],
};

// ── meter bar (the signature HUD) ────────────────────────────────────────────
function MeterBar({ name, value, danger }: { name: string; value: number; danger?: boolean }) {
  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px] font-black uppercase tracking-[0.15em] dt-text-dim">{name}</span>
        <span className={`text-[10px] font-black ${danger ? "text-error" : "text-black"}`}>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-base-300 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${danger ? "bg-error" : "bg-primary"}`}
          initial={false}
          animate={{
            width: `${value}%`,
            x: danger ? [0, -2, 2, 0] : 0,
          }}
          transition={{ type: "spring", stiffness: 320, damping: 30, duration: 0.25 }}
        />
      </div>
    </div>
  );
}

// ── node rail (the run map) ──────────────────────────────────────────────────
function NodeRail({ i, n }: { i: number; n: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: n }).map((_, k) => {
        const finale = k === n - 1;
        const done = k < i;
        const current = k === i;
        return (
          <motion.span
            key={k}
            initial={false}
            animate={{ scale: current ? 1.2 : 1 }}
            transition={{ duration: 0.2 }}
            className={`text-[11px] leading-none ${
              done ? "text-emerald-500" : current ? "text-primary" : "text-base-content/30"
            }`}
          >
            {finale ? "☠" : done ? "●" : current ? "◉" : "○"}
          </motion.span>
        );
      })}
    </div>
  );
}

// ── the ✨ AI affordance (fresh AI-written runs — coming soon) ────────────────
function AiButton() {
  const [byok, setByok] = useAtom(hcdByokAtom);
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/40 bg-primary/5 text-[11px] font-bold text-primary"
      >
        <span>✨</span>
        {byok ? "AI ready" : "AI runs"}
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            className="absolute right-0 top-9 z-20 w-72 rounded-2xl border border-base-300 bg-white p-4 shadow-xl"
          >
            <p className="text-sm font-bold text-black flex items-center gap-1.5">
              <span>✨</span> AI-written runs
            </p>
            <p className="text-xs dt-text-dim mt-1 leading-relaxed">
              {byok
                ? "Your key is connected. Soon you'll generate brand-new runs in this framework, written just for you — coming soon."
                : "Connect your AI key now so next time these runs can be written fresh, just for you."}
            </p>
            <div className="mt-3">
              {byok ? (
                <button onClick={() => setByok(null)} className="text-xs font-semibold text-error/80 hover:text-error">
                  Disconnect key
                </button>
              ) : (
                <HcdByokSetup onConnected={() => setOpen(false)} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function domainFor(key?: string): string | null {
  if (!key) return null;
  const k = key.toLowerCase();
  if (k.includes("aidca")) return "Marketing & Sales";
  if (k.includes("board")) return "Leadership & Mindset";
  return "Core Skills";
}

export function ScenarioChallenge({
  blockId,
  frameworkName,
  frameworkKey,
  onComplete,
  onBack,
}: {
  blockId: number;
  frameworkName: string;
  frameworkKey?: string;
  onComplete: (xp: number) => void;
  onBack: () => void;
}) {
  const { data: block } = useBlock(blockId);
  const [s, setS] = useState<RunState>(INITIAL);
  const [started, setStarted] = useState(false);

  const scenes: Scene[] = (block?.questions ?? []).map((q) => ({
    id: q.id,
    prompt: q.prompt,
    options: q.options.map((o) => ({ text: o.text, weight: o.weight, rationale: o.rationale ?? "" })),
  }));

  const n = scenes.length;
  const scene = scenes[s.i];
  const isFinale = s.i === n - 1;
  const standingDanger = s.standing <= 25;

  if (!block) {
    return (
      <div className="rounded-3xl border border-base-300 bg-base-100 p-6 flex justify-center">
        <span className="loading loading-spinner loading-md text-primary" />
      </div>
    );
  }

  const reset = () => {
    setS(INITIAL);
    setStarted(false);
  };

  // ── ENDINGS (knockout + tiered) ─────────────────────────────────────────────
  if (s.ended) {
    const meta = endingMeta(s.ended);
    const knockout = s.ended === "knockout";
    const ups = s.log.filter((l) => l.momentumDelta > 0).length;
    const downs = s.log.filter((l) => l.momentumDelta < 0).length;
    const defining = [...s.log].sort((a, b) => b.momentumDelta - a.momentumDelta)[0];
    return (
      <motion.div
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, x: knockout ? [0, -4, 4, 0] : 0 }}
        transition={{ duration: 0.2 }}
        className="rounded-3xl border border-base-300 bg-gradient-to-br from-primary/5 to-base-100 p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 18 }}
          className={`mx-auto w-16 h-16 rounded-full text-white flex items-center justify-center text-3xl mb-3 ${meta.tone}`}
        >
          {meta.emblem}
        </motion.div>
        <motion.p initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, duration: 0.15 }} className="font-bold text-black text-lg">
          {meta.title}
        </motion.p>
        <motion.p initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.16, duration: 0.15 }} className="text-sm dt-text-dim mt-1 mb-5">
          {knockout
            ? `You're off the account. You made it to beat ${s.log.length} of ${n}.`
            : `${ups} decisive ${ups === 1 ? "move" : "moves"}${downs ? ` · ${downs} you'd take back` : ""}.`}
        </motion.p>

        {!knockout && (
          <motion.div initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.22, duration: 0.15 }} className="flex gap-3 mb-4">
            <MeterBar name="Momentum" value={s.momentum} />
            <MeterBar name="Standing" value={s.standing} danger={s.standing <= 25} />
          </motion.div>
        )}

        {!knockout && defining && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28, duration: 0.15 }} className="text-xs dt-text-dim italic mb-5">
            Defining moment: “{defining.text}”
          </motion.p>
        )}

        <div className="flex justify-center gap-2">
          <motion.button whileTap={{ scale: 0.95 }} onClick={reset} className="px-6 py-2.5 rounded-2xl bg-primary text-primary-content font-bold text-sm shadow-lg shadow-primary/20">
            Run it back
          </motion.button>
          <button onClick={onBack} className="px-6 py-2.5 rounded-2xl border border-base-300 font-bold text-sm text-black/70">
            ← Back
          </button>
        </div>
      </motion.div>
    );
  }

  // ── RUN INTRO ───────────────────────────────────────────────────────────────
  if (!started) {
    const domain = domainFor(frameworkKey);
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.18 }} className="rounded-3xl border border-base-300 bg-gradient-to-br from-primary/5 to-base-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="text-[11px] font-bold dt-text-dim hover:text-black">
            ← Survive {frameworkName}
          </button>
          <AiButton />
        </div>
        <div className="text-center">
          <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 340, damping: 18 }} className="text-4xl mb-3">
            ⚔️
          </motion.div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/70">Your run begins</p>
          {domain && <p className="text-[11px] dt-text-dim mt-1">{domain}</p>}
          <p className="text-sm text-black font-semibold mt-2 mb-1">You are the Operator.</p>
          <p className="text-xs dt-text-dim mb-5">
            {n} {n === 1 ? "moment stands" : "moments stand"} between you and the win. Every move shifts the room.
          </p>
          <div className="flex gap-3 mb-6 max-w-xs mx-auto">
            <MeterBar name="Momentum" value={s.momentum} />
            <MeterBar name="Standing" value={s.standing} />
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} onClick={() => setStarted(true)} className="px-8 py-3 rounded-2xl bg-primary text-primary-content font-bold text-sm shadow-lg shadow-primary/20">
            Step in →
          </motion.button>
        </div>
      </motion.div>
    );
  }

  if (!scene) {
    return (
      <div className="rounded-3xl border border-base-300 bg-base-100 p-6 flex justify-center">
        <span className="loading loading-spinner loading-md text-primary" />
      </div>
    );
  }

  const weights = scene.options.map((o) => o.weight);
  const pickedOpt = s.picked !== null ? scene.options[s.picked] : null;
  const verb = pickedOpt ? gradeVerb(pickedOpt.weight, weights) : null;
  const preview = pickedOpt ? resolve(pickedOpt.weight, isFinale) : null;

  // committing the move: apply deltas, branch on knockout / finale / advance.
  const commit = () => {
    if (!pickedOpt || !preview) return;
    const momentum = clamp(s.momentum + preview.momentumDelta, 0, 100);
    const standing = clamp(s.standing + preview.standingDelta, 0, 100);
    const log = [...s.log, { weight: pickedOpt.weight, ...preview, text: pickedOpt.text }];

    if (standing <= 0) {
      onComplete(Math.round(momentum));
      setS({ ...s, momentum, standing, ended: "knockout", revealed: false, picked: null, log });
      return;
    }
    if (isFinale) {
      const recovered = s.recovered;
      const ending = tierEnding(momentum, recovered);
      const xp = Math.round(momentum) + 10 + (standing >= 50 ? 10 : 0);
      onComplete(xp);
      setS({ ...s, momentum, standing, ended: ending, revealed: false, picked: null, log });
      return;
    }
    const scare = standing <= 18;
    setS({
      ...s,
      i: s.i + 1,
      momentum,
      standing,
      revealed: false,
      picked: null,
      recovered: s.recovered || scare,
      scare,
      log,
    });
  };

  // showing the live (pre-commit) meter values during the reveal beat
  const liveMomentum = s.revealed && preview ? clamp(s.momentum + preview.momentumDelta, 0, 100) : s.momentum;
  const liveStanding = s.revealed && preview ? clamp(s.standing + preview.standingDelta, 0, 100) : s.standing;

  return (
    <div className="rounded-3xl border border-base-300 bg-gradient-to-br from-primary/5 to-base-100 p-5 overflow-hidden">
      {/* header: back + node rail + AI */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <button onClick={onBack} className="text-[11px] font-bold dt-text-dim hover:text-black shrink-0">
          ← Survive {frameworkName}
        </button>
        <NodeRail i={s.i} n={n} />
        <AiButton />
      </div>

      {/* the two meters — the persistent HUD */}
      <div className="flex gap-3 mb-4 relative">
        <MeterBar name="Momentum" value={liveMomentum} />
        <MeterBar name="Standing" value={liveStanding} danger={standingDanger} />
        <AnimatePresence>
          {s.revealed && preview && (
            <>
              {preview.momentumDelta !== 0 && (
                <motion.span
                  initial={{ opacity: 0, y: 0, scale: 0.7 }}
                  animate={{ opacity: 1, y: -16, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute left-[18%] top-0 text-[11px] font-black ${preview.momentumDelta > 0 ? "text-emerald-600" : "text-amber-500"}`}
                >
                  {preview.momentumDelta > 0 ? "▲" : "▼"} {Math.abs(preview.momentumDelta)}
                </motion.span>
              )}
              {preview.standingDelta !== 0 && (
                <motion.span
                  initial={{ opacity: 0, y: 0, scale: 0.7 }}
                  animate={{ opacity: 1, y: -16, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute right-[18%] top-0 text-[11px] font-black ${preview.standingDelta > 0 ? "text-emerald-600" : "text-error"}`}
                >
                  {preview.standingDelta > 0 ? "▲" : "▼"} {Math.abs(preview.standingDelta)}
                </motion.span>
              )}
            </>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={scene.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.16, ease: "easeOut" }}>
          {/* the moment */}
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="rounded-2xl bg-base-200 p-4 mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 mb-1">
              {isFinale ? "☠ The finale" : "The moment"}
            </p>
            <p className="text-sm text-black leading-relaxed">{scene.prompt}</p>
          </motion.div>

          {/* the moves */}
          <motion.div className="space-y-2" variants={{ show: { transition: { staggerChildren: 0.03 } } }} initial="hidden" animate="show">
            {scene.options.map((o, idx) => {
              const isPicked = s.picked === idx;
              const showResult = s.revealed && isPicked;
              const faded = s.revealed && !isPicked;
              return (
                <motion.button
                  key={idx}
                  variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.12 }}
                  whileHover={!s.revealed ? { scale: 1.01 } : undefined}
                  whileTap={!s.revealed ? { scale: 0.98 } : undefined}
                  animate={showResult ? { scale: [1, 1.02, 1], transition: { duration: 0.2 } } : { scale: 1 }}
                  disabled={s.revealed}
                  onClick={() => setS({ ...s, picked: idx })}
                  className={`w-full text-left rounded-2xl border p-3.5 transition-colors flex gap-3 items-start ${
                    showResult
                      ? "border-primary bg-primary/5"
                      : isPicked
                        ? "border-primary bg-primary/5"
                        : faded
                          ? "border-base-200 bg-base-100 opacity-40"
                          : "border-base-300 bg-white hover:border-primary/40"
                  }`}
                >
                  <motion.span
                    animate={isPicked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                    transition={{ duration: 0.18 }}
                    className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 ${isPicked ? "bg-primary" : "bg-base-300"}`}
                  />
                  <span className="text-sm text-black flex-1">{o.text}</span>
                </motion.button>
              );
            })}
          </motion.div>

          {/* the consequence beat */}
          <AnimatePresence>
            {s.revealed && verb && pickedOpt && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="mt-3 p-4 rounded-2xl border border-base-300 bg-white">
                  <motion.p initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 420, damping: 22 }} className={`text-sm font-black ${verb.tone}`}>
                    {s.scare ? "The room nearly turned — you held the line." : verb.label}
                  </motion.p>
                  {pickedOpt.rationale && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08, duration: 0.15 }} className="text-xs dt-text-dim mt-1 leading-relaxed">
                      {pickedOpt.rationale}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* action */}
      <div className="mt-4 flex justify-end">
        <AnimatePresence mode="wait">
          {!s.revealed ? (
            <motion.button
              key="move"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              whileTap={{ scale: 0.95 }}
              disabled={s.picked === null}
              onClick={() => setS({ ...s, revealed: true })}
              className="px-6 py-2.5 rounded-2xl bg-primary text-primary-content font-bold text-sm disabled:opacity-40"
            >
              {isFinale ? "Make the call" : "Make the move"}
            </motion.button>
          ) : (
            <motion.button
              key="press"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              whileTap={{ scale: 0.95 }}
              onClick={commit}
              className="px-6 py-2.5 rounded-2xl bg-primary text-primary-content font-bold text-sm"
            >
              {isFinale ? "See how it ends →" : s.i === n - 2 ? "Face the finale →" : "Press on →"}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
