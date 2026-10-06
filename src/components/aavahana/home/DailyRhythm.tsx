import React from "react";
import { C } from "./homeTokens";

const DAYS = [
  { day: "Mon", completion: 1.00, hasReport: true  },
  { day: "Tue", completion: 0.83, hasReport: true  },
  { day: "Wed", completion: 0.57, hasReport: false, today: true  },
  { day: "Thu", completion: 0,    hasReport: false, future: true },
  { day: "Fri", completion: 0,    hasReport: false, future: true },
];

const ROWS = [
  { label: "Daily Plan",   icon: "▤" },
  { label: "Event Loop",   icon: "↻" },
  { label: "Career Score", icon: "▲" },
];

function DayBar({
  day,
  completion,
  hasReport,
  today,
  future,
}: {
  day: string;
  completion: number;
  hasReport: boolean;
  today?: boolean;
  future?: boolean;
}) {
  return (
    <div
      className={`flex-1 flex flex-col items-center gap-1.5 ${future ? "opacity-[0.28]" : "opacity-100"}`}
    >
      {/* Bar */}
      <div
        className={`w-full h-24 bg-white/[0.04] rounded-lg relative overflow-hidden transition-[border-color] duration-150 ${
          today
            ? "border border-[var(--module-aavahana-border)] shadow-[0_0_18px_rgba(234,88,12,0.10)]"
            : "border border-white/[0.06] hover:border-white/10"
        }`}
      >
        {!future && (
          <div
            className="absolute bottom-0 left-0 right-0 transition-[height] duration-300 ease-out"
            style={{
              height: `${completion * 100}%`,
              background: today
                ? `linear-gradient(180deg, ${C.accent} 0%, rgba(234,88,12,0.30) 100%)`
                : "rgba(255,255,255,0.16)",
            }}
          />
        )}
        {today && (
          <div
            className="absolute top-[7px] left-0 right-0 text-center text-[8px] font-black tracking-[0.1em]"
            style={{ color: C.accentLight }}
          >
            TODAY
          </div>
        )}
      </div>

      {/* Indicators */}
      <div className="flex gap-[3px]">
        <div
          className="w-1.5 h-1.5 rounded-full"
          title="Daily Plan"
          style={{ background: completion > 0 ? C.accent : "rgba(255,255,255,0.12)" }}
        />
        <div
          className="w-1.5 h-1.5 rounded-full"
          title="Report"
          style={{ background: hasReport ? C.accentLight : "rgba(255,255,255,0.12)" }}
        />
      </div>

      <span
        className={`text-[11px] font-bold tracking-[0.05em] ${today ? "text-white" : "text-white/[0.35]"}`}
      >
        {day}
      </span>
    </div>
  );
}

const Divider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2.5 py-1">
    <div className="flex-1 h-px bg-white/[0.08]" />
    <span className="text-[9px] text-white/20 tracking-[0.1em] uppercase whitespace-nowrap">
      {label}
    </span>
    <div className="flex-1 h-px bg-white/[0.08]" />
  </div>
);

export function DailyRhythm() {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-[10px] tracking-[0.1em] uppercase text-white/25 pl-1">
        Weekly Rhythm
      </div>

      <Divider label="Mon → Fri" />

      <div className="flex gap-2.5 items-end">
        {DAYS.map((d) => (
          <DayBar key={d.day} {...d} />
        ))}
      </div>

      {/* Metric rows */}
      <div className="flex flex-col gap-1.5 mt-1">
        {ROWS.map((row) => (
          <div
            key={row.label}
            className="flex items-center gap-2.5 py-2 px-3.5 rounded-lg border border-white/[0.06] bg-white/[0.02]"
          >
            <span className="text-sm w-4 text-center" style={{ color: C.accentLight }}>
              {row.icon}
            </span>
            <span className="text-[11px] font-semibold text-white/[0.45]">
              {row.label}
            </span>
            {/* Mini bar */}
            <div className="flex-1 h-1 bg-white/[0.06] rounded-sm overflow-hidden">
              <div
                className="h-full rounded-sm"
                style={{
                  width: row.label === "Daily Plan" ? "57%" : row.label === "Event Loop" ? "80%" : "72%",
                  backgroundImage: `linear-gradient(90deg, ${C.accent}, ${C.accentLight})`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <Divider label="End of week" />
    </div>
  );
}
