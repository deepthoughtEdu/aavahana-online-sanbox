"use client";

import React from "react";
import Link from "next/link";
import { useMyCallingProgress, paceMessage } from "@/lib/hooks/crm/use-calling-targets";
import { C } from "./homeTokens";

/**
 * The caller's own bars on the landing page, so accountability is the first thing they see rather
 * than something they have to go looking for inside the CRM.
 *
 * Skinned for this surface, not shared with the dialler's DaisyUI panel: /aavahana is the dark brand
 * canvas and a light work-surface card would look pasted on. What IS shared is the source — the same
 * hook and the same paceMessage() — so the number and the wording here can never drift from the
 * dialler's. Duplicating the skin is cheap; duplicating the arithmetic behind a bonus is not.
 *
 * Renders nothing at all for anyone with no calling programs, which is most of the company. A home
 * page that shows an empty scoreboard to everybody teaches people to ignore that region of the page.
 */
export function MyCallingToday({ signedIn }: { signedIn: boolean }) {
  const { programs, isLoading } = useMyCallingProgress(signedIn);

  if (!signedIn || isLoading || !programs.length) return null;

  return (
    <section className="max-w-[1160px] mx-auto px-12 pt-[60px]">
      <div className="mb-7">
        <div
          className="text-[11px] tracking-[0.15em] uppercase font-bold mb-2"
          style={{ color: C.accentLight }}
        >
          Your numbers
        </div>
        <div className="text-[26px] font-black tracking-tight">Where you stand</div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-3">
        {programs.map((p) => {
          const msg = paceMessage(p.pace);
          const isDay = p.periodType === "day";
          return (
            <div
              key={p.programId}
              className="bg-white/[0.03] border border-white/[0.08] rounded-[10px] p-[22px]"
            >
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="text-sm font-bold text-white truncate">{p.programName}</div>
                {/* Day-wise for BD, week-wise for Product Engineering. Said plainly, because
                    whether today's gap is recoverable depends entirely on which one you are on. */}
                <div className="text-[11px] uppercase tracking-wider" style={{ color: C.textMuted }}>
                  {isDay ? "today" : "this week"}
                </div>
              </div>

              {p.note === "no-targets-set" ? (
                <div className="text-xs" style={{ color: C.textMuted }}>
                  No numbers set for this team yet.
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {p.lines.map((l) => {
                      const pct = l.target > 0 ? Math.min(100, (l.current / l.target) * 100) : 0;
                      return (
                        <div key={l.measure}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-white/60">
                              {l.label}
                              {/* Only a hard bar gates the bonus. Marking them apart stops the
                                  soft numbers reading as threats. */}
                              {l.hard && (
                                <span style={{ color: C.accentLight }} title="Counts towards your quarterly bonus">
                                  {" *"}
                                </span>
                              )}
                            </span>
                            <span className={l.met ? "text-white font-bold" : "text-white/80"}>
                              {l.current}
                              <span className="text-white/30">/{l.target}</span>
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                background: l.met ? "#22C55E" : C.accent,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {msg && (
                    <div className="mt-4 text-xs">
                      <div className="font-bold text-white">{msg.title}</div>
                      <div style={{ color: C.textMuted }}>{msg.detail}</div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="text-[11px]" style={{ color: C.textMuted }}>
                      * counts towards your bonus
                    </span>
                    <Link
                      href="/crm/outreach/dialler"
                      className="text-[11px] font-bold no-underline"
                      style={{ color: C.accentLight }}
                    >
                      Open dialler →
                    </Link>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
