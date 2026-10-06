import React from "react";
import { C } from "./homeTokens";

const PILLARS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    label: "Plan",
    sub:   "Structure your day",
    desc:  "Daily and weekly task planning with smart carry-over and energy mapping — before chaos kicks in.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    label: "Track",
    sub:   "Measure what matters",
    desc:  "Engagement scores, career runrate, and delivery metrics tracked in real time across every sprint and event.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10" />
        <path d="M12 20V4" />
        <path d="M6 20v-6" />
      </svg>
    ),
    label: "Grow",
    sub:   "Level up, sprint by sprint",
    desc:  "HVT experiments and career trajectory data converge here — so you know exactly where you are and where you're headed.",
  },
];

export function PlatformPillars() {
  return (
    <section className="border-t border-b border-white/[0.06] bg-white/[0.02]">
      <div className="max-w-[1160px] mx-auto px-12 py-12 grid grid-cols-3 gap-px">
        {PILLARS.map((p, i) => (
          <div key={p.label} className={`py-8 px-9 ${i > 0 ? "border-l border-white/[0.06]" : ""}`}>
            <div
              className="w-11 h-11 rounded-[10px] flex items-center justify-center mb-4"
              style={{ background: C.accentGlow, border: `1px solid ${C.accentBorder}`, color: C.accentLight }}
            >
              {p.icon}
            </div>
            <div className="text-lg font-extrabold text-white mb-1">{p.label}</div>
            <div className="text-xs font-semibold uppercase tracking-[0.08em] mb-3" style={{ color: C.accentLight }}>{p.sub}</div>
            <div className="text-[13px] text-white/[0.45] leading-[1.65]">{p.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
