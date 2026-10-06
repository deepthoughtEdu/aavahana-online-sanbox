"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { McqQuestion as McqQuestionData, McqBlockSource } from "../data/types";
import type { AssessmentResult } from "@/components/reflective-assessment/types";

interface McqQuestionProps {
  question: McqQuestionData;
  source: McqBlockSource;
  framework: string;
  questionNumber: number;
  totalQuestions: number;
  onComplete: (result: {
    activityId: number;
    choices: Record<string, unknown>;
    revealSeen: boolean;
  }) => void;
  /** When set, this question was already answered — render it locked (read-only). */
  savedResult?: AssessmentResult;
}

const WEIGHT_COLOR: Record<string, string> = {
  low: "text-red-400",
  mid: "text-amber-400",
  high: "text-emerald-400",
};

function weightLabel(w: number) {
  if (w >= 8) return { text: "Strong shift", color: WEIGHT_COLOR.high };
  if (w >= 5) return { text: "Moderate shift", color: WEIGHT_COLOR.mid };
  return { text: "Low shift", color: WEIGHT_COLOR.low };
}

export default function McqQuestion({
  question,
  source,
  framework,
  questionNumber,
  totalQuestions,
  onComplete,
  savedResult,
}: McqQuestionProps) {
  // If this question was already answered, start locked on the saved choice —
  // the option list and "Lock Answer" are gated on `confirmed`, so a saved
  // answer renders read-only and cannot be changed (no re-answering / gaming).
  const savedKey = savedResult
    ? (savedResult.choices.selectedOption as string)
    : null;
  const [selected, setSelected] = useState<string | null>(savedKey);
  const [confirmed, setConfirmed] = useState<boolean>(!!savedResult);

  const shuffledOptions = useMemo(() => {
    const arr = [...question.options];
    let seed = question.id * 2654435761;
    for (let i = arr.length - 1; i > 0; i--) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      const j = seed % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [question.id, question.options]);

  const selectedOption = question.options.find((o) => o.key === selected);

  const handleConfirm = () => {
    if (!selectedOption) return;
    setConfirmed(true);
  };

  const handleContinue = () => {
    if (!selectedOption) return;
    onComplete({
      activityId: question.id,
      choices: {
        selectedOption: selectedOption.key,
        weight: selectedOption.weight,
        gridCells: question.gridCells,
      },
      revealSeen: true,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
      <div className="pt-8 pb-6">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 font-mono mb-2">
          {framework}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 font-mono">
            Question {questionNumber} of {totalQuestions}
          </div>
          {savedResult && (
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400/80 font-mono">
              · Locked
            </span>
          )}
        </div>
      </div>

      <div className="mb-8 p-4 rounded-xl border border-slate-700/50 bg-slate-800/30">
        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 font-mono mb-2">
          Source
        </div>
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
          {source.content}
        </p>
      </div>

      <div className="mb-8">
        <p className="text-lg text-white font-semibold leading-relaxed">
          {question.prompt}
        </p>
        <div className="flex gap-2 mt-3">
          {question.gridCells.map((cell) => (
            <span
              key={cell}
              className="text-[9px] font-black uppercase tracking-widest text-blue-400/60 font-mono px-2 py-0.5 rounded-full border border-blue-500/20 bg-blue-500/5"
            >
              {cell.replace("-", " × ")}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {shuffledOptions.map((option, i) => {
          const isSelected = selected === option.key;
          const isRevealed = confirmed;

          return (
            <motion.button
              key={option.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => {
                if (!confirmed) setSelected(option.key);
              }}
              disabled={confirmed}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 ${
                isSelected
                  ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30"
                  : confirmed
                    ? "border-slate-700/30 bg-slate-800/20 opacity-50"
                    : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Neutral selection indicator — no A/B/C/D letter, which read as
                    an answer key and nudged people toward "the right" option. */}
                <span
                  className={`shrink-0 w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? "border-blue-500 bg-blue-500"
                      : "border-slate-600 bg-transparent"
                  }`}
                >
                  {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-sm font-medium ${
                      isSelected ? "text-white" : "text-slate-300"
                    }`}
                  >
                    {option.text}
                  </span>
                  {isRevealed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-1 space-y-0.5"
                    >
                      <span className={`text-xs font-bold ${weightLabel(option.weight).color}`}>
                        {option.weight}/10 — {weightLabel(option.weight).text}
                      </span>
                      {option.rationale && (
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {option.rationale}
                        </p>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {selected && !confirmed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center mt-8"
          >
            <button
              onClick={handleConfirm}
              className="px-8 py-3 bg-blue-600 text-white font-black uppercase tracking-widest text-sm rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
            >
              Lock Answer
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmed && selectedOption && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 text-center">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 font-mono mb-2">
                Your response
              </div>
              <div className={`text-3xl font-black tracking-tight ${weightLabel(selectedOption.weight).color}`}>
                {selectedOption.weight}/10
              </div>
              <div className={`text-sm font-bold mt-1 ${weightLabel(selectedOption.weight).color}`}>
                {weightLabel(selectedOption.weight).text}
              </div>
            </div>

            <div className="text-center mt-6">
              <button
                onClick={handleContinue}
                className="px-8 py-3 bg-blue-600 text-white font-black uppercase tracking-widest text-sm rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
              >
                {questionNumber < totalQuestions ? "Next Question →" : "Complete Block →"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
