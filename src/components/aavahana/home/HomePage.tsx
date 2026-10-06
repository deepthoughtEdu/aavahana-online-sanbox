"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/shared/use-auth";
import { DailyRhythm } from "./DailyRhythm";
import { PlatformPillars } from "./PlatformPillars";
import { C } from "./homeTokens";
import { MyCallingToday } from "./MyCallingToday";

const QUICK_LINKS = [
  { href: "/aavahana/dashboard",      label: "Dashboard",         desc: "Your daily command centre" },
  { href: "/aavahana/daily-plan",     label: "Daily Plan",        desc: "Plan and track today's tasks" },
  { href: "/aavahana/weekly-plan",    label: "Weekly Plan",       desc: "Review your weekly commitments" },
  { href: "/aavahana/event-loop",     label: "Event Loop",        desc: "Assigned tickets and actions" },
  { href: "/aavahana/career-runrate", label: "Career Runrate",    desc: "Track your growth trajectory" },
  { href: "/aavahana/hvt",            label: "HVT Experiments",   desc: "Run and track high-value experiments" },
];

export function HomePage() {
  // /aavahana is a public route, so useAuth skips the /me fetch here —
  // isAuthenticated comes from the persisted auth atom. Gate on mounted to
  // avoid an SSR/client hydration mismatch (server always renders signed-out).
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const signedIn = mounted && isAuthenticated;

  return (
    <div className="min-h-screen text-white" style={{ background: C.navy, fontFamily: C.fontBase }}>

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-[100] bg-black/[0.92] backdrop-blur-[12px] border-b border-white/[0.07] px-12">
        <div className="max-w-[1160px] mx-auto flex items-center h-14 gap-5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-[30px] h-[30px] rounded-[7px] flex items-center justify-center text-[13px] font-black"
              style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})` }}
            >A</div>
            <span className="text-sm font-extrabold tracking-tight">Aavahana</span>
          </div>
          <div className="flex-1" />
          {signedIn ? (
            <Link href="/aavahana/dashboard" className="no-underline">
              <div
                className="py-2 px-[18px] rounded-[7px] text-xs font-bold text-white cursor-pointer transition-all hover:brightness-110"
                style={{ background: C.accent }}
              >
                Go to Dashboard
              </div>
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="no-underline text-xs text-white/50 font-semibold transition-colors hover:text-white">
                Login
              </Link>
              <Link href="/auth/login" className="no-underline">
                <div
                  className="py-2 px-[18px] rounded-[7px] text-xs font-bold text-white cursor-pointer transition-all hover:brightness-110"
                  style={{ background: C.accent }}
                >
                  Get Started
                </div>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="max-w-[1160px] mx-auto px-12 pt-20 pb-[60px]">
        <div className="grid grid-cols-2 gap-20 items-center">
          <div>
            <div className="text-[11px] tracking-[0.15em] uppercase font-bold mb-4" style={{ color: C.accentLight }}>
              DeepThought · Daily Operations
            </div>
            <h1 className="text-[44px] font-black leading-[1.12] mb-5 tracking-tight" style={{ fontFamily: C.fontDisplay }}>
              Your daily command centre<br />
              <span style={{ color: C.accentLight }}>for growth and delivery.</span>
            </h1>
            <p className="text-[15px] text-white/50 leading-[1.7] mb-8 max-w-[440px]">
              Aavahana gives you one place to plan your day, run your week, and track the career metrics that matter — so you execute with clarity, not chaos.
            </p>
            <div className="flex gap-3">
              {signedIn ? (
                <>
                  <Link href="/aavahana/dashboard" className="no-underline">
                    <div
                      className="py-[11px] px-6 rounded-lg text-white text-[13px] font-bold cursor-pointer transition-all hover:brightness-110"
                      style={{ background: C.accent }}
                    >
                      Go to Dashboard
                    </div>
                  </Link>
                  <Link href="/aavahana/daily-plan" className="no-underline">
                    <div className="py-[11px] px-6 rounded-lg bg-white/[0.06] border border-white/[0.12] text-white/75 text-[13px] font-bold cursor-pointer transition-all hover:bg-white/10 hover:text-white">
                      Open Daily Plan
                    </div>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="no-underline">
                    <div
                      className="py-[11px] px-6 rounded-lg text-white text-[13px] font-bold cursor-pointer transition-all hover:brightness-110"
                      style={{ background: C.accent }}
                    >
                      Get Started
                    </div>
                  </Link>
                  <Link href="/auth/login" className="no-underline">
                    <div className="py-[11px] px-6 rounded-lg bg-white/[0.06] border border-white/[0.12] text-white/75 text-[13px] font-bold cursor-pointer transition-all hover:bg-white/10 hover:text-white">
                      Login
                    </div>
                  </Link>
                </>
              )}
            </div>
          </div>
          <DailyRhythm />
        </div>
      </section>

      {/* ── PILLARS ──────────────────────────────────────────────────────── */}
      <PlatformPillars />

      {/* ── YOUR NUMBERS ─────────────────────────────────────────────────
          Above Quick Access on purpose: accountability that has to be navigated to is
          accountability nobody looks at. Renders nothing for anyone with no calling bars, which
          is most of the company. */}
      <MyCallingToday signedIn={signedIn} />

      {/* ── QUICK ACCESS ─────────────────────────────────────────────────── */}
      <section id="quick-access" className="max-w-[1160px] mx-auto px-12 py-[60px]">
        <div className="flex items-end justify-between mb-7">
          <div>
            <div className="text-[11px] tracking-[0.15em] uppercase font-bold mb-2" style={{ color: C.accentLight }}>Quick access</div>
            <div className="text-[26px] font-black tracking-tight">Where do you want to go?</div>
          </div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
          {QUICK_LINKS.map(({ href, label, desc }) => (
            <Link key={href} href={href} className="no-underline group">
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-[10px] py-5 px-[22px] cursor-pointer transition-all hover:border-[var(--module-aavahana-border)] hover:bg-[var(--module-aavahana-glow)]">
                <div className="text-sm font-bold text-white mb-1">{label}</div>
                <div className="text-xs text-white/40">{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] px-12 py-6">
        <div className="max-w-[1160px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-[22px] h-[22px] rounded-[5px] flex items-center justify-center text-[10px] font-black"
              style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})` }}
            >A</div>
            <span className="text-xs text-white/25 font-semibold">Aavahana</span>
          </div>
          <div className="text-[11px] text-white/[0.15]">DeepThought · Daily Operations · v1.0</div>
        </div>
      </footer>

      <style>{`
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
