"use client";

/**
 * A real, continuously-burning flame for the HCD streak — layered SVG shapes
 * (glow halo, amber→red body, bright inner core) that flicker on desynced
 * periods so the fire reads as alive rather than a looping gif. When the streak
 * is dead it freezes to a cold grey ember (no motion, no glow).
 *
 * Motion lives in the design system's motion layer (ceremony.css → .dt-flame-*),
 * so the global prefers-reduced-motion kill switch automatically calms it.
 * Colours come from --dt warm tokens; nothing is hardcoded here.
 *
 * `intensity` (the current streak length) nudges the size and glow up a touch
 * as the streak grows — a 30-day fire burns a little bigger than a 1-day spark.
 */
export function StreakFlame({
  alive,
  intensity = 1,
  size = 40,
}: {
  alive: boolean;
  intensity?: number;
  size?: number;
}) {
  // Grow gently with streak length, capped so it never dominates the strip.
  const boost = alive ? Math.min(intensity, 30) / 30 : 0; // 0 → 1
  const px = Math.round(size * (1 + boost * 0.18));

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 32 40"
      fill="none"
      role="img"
      aria-label={alive ? `Active streak` : `No active streak`}
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="dt-flame-body-grad" x1="16" y1="6" x2="16" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--dt-amber)" />
          <stop offset="55%" stopColor="var(--dt-red)" />
          <stop offset="100%" stopColor="var(--dt-red)" />
        </linearGradient>
        <linearGradient id="dt-flame-core-grad" x1="16" y1="14" x2="16" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--dt-stickyYellow)" />
          <stop offset="100%" stopColor="var(--dt-amber)" />
        </linearGradient>
        <radialGradient id="dt-flame-glow-grad" cx="0.5" cy="0.62" r="0.5">
          <stop offset="0%" stopColor="var(--dt-amber)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--dt-amber)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {alive ? (
        <>
          {/* Soft glow halo behind the fire */}
          <circle
            className="dt-flame-glow"
            cx="16"
            cy="26"
            r="15"
            fill="url(#dt-flame-glow-grad)"
            style={{ opacity: 0.45 + boost * 0.2 }}
          />
          {/* Outer flame body */}
          <path
            className="dt-flame-body"
            d="M16 2C16 2 7 11 7 22C7 30 11 38 16 38C21 38 25 30 25 22C25 16 21 13 21 9C21 14 18 15 18 15C18 15 20 9 16 2Z"
            fill="url(#dt-flame-body-grad)"
          />
          {/* Bright inner core */}
          <path
            className="dt-flame-core"
            d="M16 16C16 16 11 22 11 28C11 33 13 37 16 37C19 37 21 33 21 28C21 24 18 22 18 19C18 23 16 23 16 23C16 23 17 19 16 16Z"
            fill="url(#dt-flame-core-grad)"
          />
        </>
      ) : (
        /* Cold ember — same silhouette, greyed and motionless */
        <path
          d="M16 2C16 2 7 11 7 22C7 30 11 38 16 38C21 38 25 30 25 22C25 16 21 13 21 9C21 14 18 15 18 15C18 15 20 9 16 2Z"
          className="fill-base-300"
        />
      )}
    </svg>
  );
}
