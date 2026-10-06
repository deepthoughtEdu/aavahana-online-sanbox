"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { ActivityRegistration, AssessmentResult } from "./types";

interface AssessmentConsolidatedViewProps {
  activities: ActivityRegistration[];
  results: Partial<Record<number, AssessmentResult>>;
  onNavigate: (id: number) => void;
  completionBanner?: ReactNode;
}

export default function AssessmentConsolidatedView({
  activities,
  results,
  onNavigate,
  completionBanner,
}: AssessmentConsolidatedViewProps) {
  const completedCount = Object.keys(results).length;
  const totalCount = activities.length;

  const summaries = activities
    .map((reg) => {
      const result = results[reg.meta.id];
      return result ? reg.extractSummary(result) : null;
    })
    .filter((s): s is NonNullable<typeof s> => s !== null && s.score != null);

  const avgScore =
    summaries.length > 0
      ? summaries.reduce((sum, s) => sum + (s.score ?? 0), 0) / summaries.length
      : 0;

  const feedbackBand =
    avgScore >= 8
      ? { label: "Integrated", desc: "You process setbacks with clarity and self-direction. Your responses show consistent self-compassion under pressure." }
      : avgScore >= 6
        ? { label: "Building", desc: "You're moving past default reactions. Most of your responses show awareness and redirection — keep reinforcing these patterns." }
        : avgScore >= 4
          ? { label: "Emerging", desc: "You recognize when the critical voice kicks in, but it still drives many responses. Focus on catching the moment between trigger and reaction." }
          : { label: "Default Mode", desc: "Your responses lean toward self-criticism or avoidance. This is the starting point — awareness of the pattern is the first shift." };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <div className="pt-10 pb-8 text-center">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 font-mono mb-2">
          {completedCount}/{totalCount} Activities Complete
        </div>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white mb-2">
          Your Journey
        </h1>
        <p className="text-sm text-slate-400 font-medium max-w-xl mx-auto leading-relaxed">
          {completedCount === totalCount
            ? `All ${totalCount} shifts revealed. Here is your consolidated map.`
            : "Complete all activities to see your full map. Partial results shown below."}
        </p>
      </div>

      {summaries.length > 0 && completedCount === totalCount && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 p-6 rounded-2xl border border-slate-700/50 bg-slate-900/50"
        >
          <div className="flex items-center gap-6 mb-4">
            <div className="text-center">
              <div className="text-4xl font-black tracking-tighter text-white">
                {avgScore.toFixed(1)}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono mt-1">
                avg / 10
              </div>
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-blue-400 mb-1">
                {feedbackBand.label}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {feedbackBand.desc}
              </p>
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(avgScore / 10) * 100}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500"
            />
          </div>
        </motion.div>
      )}

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {activities.map((reg, i) => {
          const result = results[reg.meta.id];

          if (!result) {
            return (
              <motion.div
                key={reg.meta.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 opacity-40"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-black text-slate-600">
                    {reg.meta.id}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-600">{reg.meta.name}</div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-700 font-mono">
                      {reg.meta.shift}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-700 italic">Not completed yet</div>
              </motion.div>
            );
          }

          const summary = reg.extractSummary(result);

          return (
            <motion.button
              key={reg.meta.id}
              onClick={() => onNavigate(reg.meta.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-5 text-left hover:border-slate-600 hover:bg-slate-800/50 transition-all group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-black text-white">
                  {reg.meta.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white group-hover:text-blue-200 transition-colors">
                    {reg.meta.name}
                  </div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono">
                    {reg.meta.shift}
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 font-mono mb-1">
                  {summary.headline}
                </div>
                <div className={`text-2xl font-black tracking-tighter ${summary.color}`}>
                  {summary.value}
                </div>
                {summary.sub && (
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                    {summary.sub}
                  </div>
                )}
              </div>

              {summary.pairs && (
                <div className="flex gap-3">
                  {summary.pairs.map((p) => (
                    <div key={p.label} className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${p.color}`} />
                      <span className="text-[10px] text-slate-500 font-mono">
                        {p.label}: {p.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 text-[9px] font-black uppercase tracking-widest text-slate-600 group-hover:text-slate-400 transition-colors">
                Revisit &rarr;
              </div>
            </motion.button>
          );
        })}
      </div>

      {completedCount === totalCount &&
        (completionBanner ?? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center p-8 rounded-2xl border border-blue-500/20 bg-blue-500/5"
          >
            <p className="text-xl md:text-2xl font-black uppercase tracking-tighter text-white mb-2">
              All activities complete.
            </p>
            <p className="text-xs text-slate-500 font-medium max-w-md mx-auto leading-relaxed mt-4">
              Review your results above to see your journey map.
            </p>
          </motion.div>
        ))}
    </div>
  );
}
