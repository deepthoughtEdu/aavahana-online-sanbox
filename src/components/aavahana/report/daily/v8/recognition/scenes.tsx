"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { SceneId } from "./variants";

/**
 * The visual celebrations. One component per scene id; `Scene` dispatches.
 *
 * Every scene takes the same two inputs:
 *   intensity — 0.5 to 1.0, from the dose-decay curve. Scales particle counts,
 *               travel distance and duration, so the same scene reads as a
 *               party on day 3 and as a nod on day 80.
 *   reduced   — prefers-reduced-motion. Each scene composes a still frame
 *               rather than disappearing; the person still gets a picture.
 *
 * All of them are pointer-events:none and aria-hidden. The scene is decoration
 * over a screen that already said everything in text — nothing here is the only
 * carrier of meaning.
 */

interface SceneProps {
  intensity: number;
  reduced: boolean;
}

// Festive palette. Deliberately fixed rather than theme-derived: confetti that
// is all one hue isn't confetti, and these six read on both light and dark.
const FESTIVE = [
  "#f59e0b",
  "#ef4444",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];

// ── Shared canvas burst engine (confetti + fireworks) ─────────────────────────

interface Bit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vrot: number;
  color: string;
  life: number;
  decay: number;
  shape: "rect" | "dot";
}

function useBurstCanvas(
  build: (w: number, h: number, intensity: number) => Bit[],
  opts: {
    intensity: number;
    reduced: boolean;
    gravity: number;
    drag: number;
    /** Extra bursts fired later, as [delayMs, ...] */
    echoes?: number[];
  },
) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const { intensity, reduced, gravity, drag, echoes } = opts;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let bits = build(w, h, intensity);

    const paint = () => {
      ctx.clearRect(0, 0, w, h);
      for (const b of bits) {
        if (b.life <= 0) continue;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, b.life));
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.fillStyle = b.color;
        if (b.shape === "rect") {
          ctx.fillRect(-b.size / 2, -b.size / 4, b.size, b.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, b.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    };

    if (reduced) {
      // A single settled frame: run the sim forward silently, then draw once.
      for (let i = 0; i < 40; i += 1) {
        for (const b of bits) {
          b.x += b.vx;
          b.y += b.vy;
          b.vy += gravity;
          b.vx *= drag;
          b.rot += b.vrot;
        }
      }
      for (const b of bits) b.life = 0.85;
      paint();
      return;
    }

    const timers: number[] = [];
    for (const delay of echoes ?? []) {
      timers.push(
        window.setTimeout(() => {
          bits = bits.concat(build(w, h, intensity));
        }, delay),
      );
    }

    let raf = 0;
    const loop = () => {
      for (const b of bits) {
        if (b.life <= 0) continue;
        b.x += b.vx;
        b.y += b.vy;
        b.vy += gravity;
        b.vx *= drag;
        b.vy *= drag;
        b.rot += b.vrot;
        b.life -= b.decay;
      }
      paint();
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [build, intensity, reduced, gravity, drag, echoes]);

  return ref;
}

// ── 1. Confetti ───────────────────────────────────────────────────────────────

function ConfettiScene({ intensity, reduced }: SceneProps) {
  const build = React.useCallback((w: number, h: number, k: number): Bit[] => {
    const count = Math.round(70 * k);
    return Array.from({ length: count }, (_, i) => {
      // Two cannons, angled inward from the lower corners — the shape people
      // read as "celebration" rather than "snow".
      const left = i % 2 === 0;
      const spread = (i / count) * Math.PI * 0.42;
      const angle = left
        ? -Math.PI / 2.6 + spread * 0.5
        : -Math.PI + Math.PI / 2.6 - spread * 0.5;
      const speed = (7 + (i % 7)) * (0.7 + 0.5 * k);
      return {
        x: left ? w * 0.08 : w * 0.92,
        y: h * 0.92,
        vx: Math.cos(angle) * speed * (left ? 1 : -1),
        vy: Math.sin(angle) * speed,
        size: 7 + (i % 5) * 2,
        rot: i,
        vrot: (i % 2 ? 1 : -1) * 0.18,
        color: FESTIVE[i % FESTIVE.length],
        life: 1,
        decay: 0.006,
        shape: (i % 3 === 0 ? "dot" : "rect") as Bit["shape"],
      };
    });
  }, []);

  const ref = useBurstCanvas(build, {
    intensity,
    reduced,
    gravity: 0.16,
    drag: 0.994,
  });
  return <canvas ref={ref} className="h-full w-full" aria-hidden />;
}

// ── 2. Ribbons ────────────────────────────────────────────────────────────────

function RibbonsScene({ intensity, reduced }: SceneProps) {
  const paths = [
    "M-10,70 C 20,20 45,95 75,35 S 105,60 130,20",
    "M-10,40 C 25,85 50,10 80,70 S 110,25 130,65",
    "M-10,95 C 30,45 55,105 85,55 S 112,88 130,45",
  ];
  return (
    <svg
      viewBox="0 0 120 120"
      preserveAspectRatio="none"
      className="h-full w-full"
      aria-hidden
    >
      {paths.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          fill="none"
          stroke={FESTIVE[(i * 2 + 1) % FESTIVE.length]}
          strokeWidth={1.4 + i * 0.5}
          strokeLinecap="round"
          initial={reduced ? { pathLength: 1, opacity: 0.5 } : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 0.75, 0.55] }}
          transition={{
            duration: (1.1 + i * 0.25) / (0.6 + intensity * 0.4),
            delay: i * 0.12,
            ease: "easeOut",
          }}
        />
      ))}
    </svg>
  );
}

// ── 3. Mascot ─────────────────────────────────────────────────────────────────

/**
 * A small round character that bounces and waves. Drawn rather than imported so
 * it inherits theme colors and costs nothing to load. Deliberately simple: a
 * detailed mascot has a personality you have to agree with, a blob doesn't.
 */
function MascotScene({ intensity, reduced }: SceneProps) {
  const bounce = reduced
    ? {}
    : {
        y: [0, -14 * intensity, 0, -8 * intensity, 0],
        rotate: [0, -4, 0, 3, 0],
      };
  return (
    <div className="flex h-full w-full items-end justify-center pb-6">
      <motion.svg
        viewBox="0 0 120 120"
        className="h-40 w-40 text-primary sm:h-52 sm:w-52"
        initial={reduced ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, ...bounce }}
        transition={{
          scale: { type: "spring", stiffness: 320, damping: 16 },
          opacity: { duration: 0.25 },
          y: { duration: 1.5, repeat: reduced ? 0 : Infinity, ease: "easeInOut" },
          rotate: { duration: 1.5, repeat: reduced ? 0 : Infinity, ease: "easeInOut" },
        }}
        aria-hidden
      >
        {/* shadow */}
        <motion.ellipse
          cx="60"
          cy="108"
          rx="26"
          ry="5"
          className="fill-base-content/15"
          style={{ transformOrigin: "60px 108px" }}
          animate={
            reduced
              ? {}
              : { scaleX: [1, 0.78, 1, 0.85, 1], opacity: [0.5, 0.3, 0.5, 0.35, 0.5] }
          }
          transition={{ duration: 1.5, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
        />
        {/* body */}
        <circle cx="60" cy="66" r="34" className="fill-primary" />
        <circle cx="60" cy="66" r="34" className="fill-base-100/10" />
        {/* eyes */}
        <circle cx="49" cy="60" r="4.2" className="fill-primary-content" />
        <circle cx="71" cy="60" r="4.2" className="fill-primary-content" />
        {/* smile */}
        <path
          d="M48,76 Q60,88 72,76"
          className="stroke-primary-content"
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
        />
        {/* waving arm */}
        <motion.path
          d="M92,62 Q104,50 100,36"
          className="stroke-primary"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          style={{ transformOrigin: "92px 62px" }}
          animate={reduced ? {} : { rotate: [-14, 16, -14] }}
          transition={{ duration: 0.7, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
        />
        <path
          d="M28,62 Q16,52 20,40"
          className="stroke-primary"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />
        {/* little party sparks */}
        {[
          [22, 26],
          [98, 20],
          [16, 78],
          [104, 74],
        ].map(([cx, cy], i) => (
          <motion.circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r="3"
            fill={FESTIVE[i % FESTIVE.length]}
            initial={reduced ? { scale: 1, opacity: 0.8 } : { scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0.8] }}
            transition={{ duration: 0.5, delay: 0.2 + i * 0.09 }}
          />
        ))}
      </motion.svg>
    </div>
  );
}

// ── 4. Stamp ──────────────────────────────────────────────────────────────────

/** The satisfying thunk of a rubber stamp. One beat, then dust. */
function StampScene({ intensity, reduced }: SceneProps) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="relative">
        <motion.div
          initial={
            reduced
              ? { scale: 1, rotate: -12, opacity: 1 }
              : { scale: 3.2, rotate: -34, opacity: 0 }
          }
          animate={{ scale: 1, rotate: -12, opacity: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 22, mass: 0.7 }}
          className="rounded-xl border-4 border-success px-6 py-3"
        >
          <span className="text-3xl font-black uppercase tracking-[0.2em] text-success sm:text-4xl">
            Logged
          </span>
        </motion.div>
        {/* dust rings pushed out by the impact */}
        {!reduced &&
          [0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-success/40"
              initial={{ width: 40, height: 40, opacity: 0.6 }}
              animate={{
                width: 260 * intensity + 120,
                height: 200 * intensity + 90,
                opacity: 0,
              }}
              transition={{ duration: 0.9, delay: 0.1 + i * 0.11, ease: "easeOut" }}
            />
          ))}
      </div>
    </div>
  );
}

// ── 5. Bloom ──────────────────────────────────────────────────────────────────

/** Petals unfurling. Ties to the seed-to-plant metaphor already in the header. */
function BloomScene({ intensity, reduced }: SceneProps) {
  const petals = Math.round(8 + 4 * intensity);
  return (
    <div className="flex h-full w-full items-center justify-center">
      <svg viewBox="-60 -60 120 120" className="h-56 w-56 sm:h-72 sm:w-72" aria-hidden>
        {Array.from({ length: petals }, (_, i) => {
          const angle = (360 / petals) * i;
          return (
            <motion.ellipse
              key={i}
              rx="9"
              ry="26"
              cy="-24"
              className="fill-success/35"
              style={{ transformOrigin: "0px 0px" }}
              initial={
                reduced
                  ? { rotate: angle, scale: 1, opacity: 0.6 }
                  : { rotate: angle - 40, scale: 0.2, opacity: 0 }
              }
              animate={{ rotate: angle, scale: 1, opacity: 0.6 }}
              transition={{
                type: "spring",
                stiffness: 140,
                damping: 14,
                delay: i * 0.045,
              }}
            />
          );
        })}
        <motion.circle
          r="13"
          className="fill-warning"
          initial={reduced ? { scale: 1 } : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.25 }}
        />
      </svg>
    </div>
  );
}

// ── 6. Sunrise ────────────────────────────────────────────────────────────────

/** Light coming up from the bottom edge. The calm one. Works in both registers. */
function SunriseScene({ intensity, reduced }: SceneProps) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <motion.div
        className="absolute left-1/2 h-[120%] w-[140%] -translate-x-1/2 rounded-[100%]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(251,191,36,0.42), rgba(251,146,60,0.18) 55%, transparent 78%)",
        }}
        initial={reduced ? { top: "36%", opacity: 1 } : { top: "88%", opacity: 0 }}
        animate={{ top: `${44 - 8 * intensity}%`, opacity: 1 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      />
      {!reduced &&
        Array.from({ length: 7 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 bottom-0 h-[75%] w-[3px] origin-bottom bg-gradient-to-t from-warning/35 to-transparent"
            style={{ rotate: `${-54 + i * 18}deg` }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: [0, 0.7, 0.35] }}
            transition={{ duration: 1.1, delay: 0.3 + i * 0.06, ease: "easeOut" }}
          />
        ))}
    </div>
  );
}

// ── 7. Lantern ────────────────────────────────────────────────────────────────

/** Paper lanterns drifting up. Tender register only — quiet, no bang. */
function LanternScene({ intensity, reduced }: SceneProps) {
  const count = Math.round(5 + 4 * intensity);
  return (
    <div className="relative h-full w-full overflow-hidden">
      {Array.from({ length: count }, (_, i) => {
        const left = 8 + (84 / count) * i + (i % 3) * 4;
        const size = 22 + (i % 4) * 8;
        return (
          <motion.div
            key={i}
            className="absolute rounded-[45%_45%_38%_38%] bg-gradient-to-b from-warning/70 to-warning/20 shadow-[0_0_26px_6px_rgba(251,191,36,0.28)]"
            style={{ left: `${left}%`, width: size, height: size * 1.25 }}
            initial={
              reduced
                ? { bottom: `${20 + i * 7}%`, opacity: 0.55 }
                : { bottom: "-18%", opacity: 0 }
            }
            animate={{
              bottom: `${34 + i * 8}%`,
              opacity: [0, 0.75, 0.5],
              x: [0, i % 2 ? 12 : -12, 0],
            }}
            transition={{
              duration: 3.4 + i * 0.3,
              delay: i * 0.16,
              ease: "easeOut",
              x: { duration: 3.4, repeat: reduced ? 0 : Infinity, ease: "easeInOut" },
            }}
          />
        );
      })}
    </div>
  );
}

// ── 8. Fireworks (milestone only) ─────────────────────────────────────────────

// Module constant, not an inline literal: a fresh array each render would change
// the effect's dependency identity and relaunch the shells every time the parent
// re-renders (the "tap anywhere" hint alone would do it).
const FIREWORK_ECHOES = [420, 900, 1500];

function FireworksScene({ intensity, reduced }: SceneProps) {
  const build = React.useCallback((w: number, h: number, k: number): Bit[] => {
    // Each call is one shell. The echoes option fires more over time.
    const cx = w * (0.22 + Math.abs(Math.sin(w + h)) * 0.56);
    const cy = h * (0.2 + Math.abs(Math.cos(w)) * 0.3);
    const count = Math.round(56 * k);
    const hue = FESTIVE[Math.floor(Math.abs(Math.sin(cx)) * FESTIVE.length) % FESTIVE.length];
    return Array.from({ length: count }, (_, i) => {
      const a = (Math.PI * 2 * i) / count;
      const speed = 3.4 + (i % 5) * 0.5;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        size: 4,
        rot: 0,
        vrot: 0,
        color: hue,
        life: 1,
        decay: 0.012,
        shape: "dot" as const,
      };
    });
  }, []);

  const ref = useBurstCanvas(build, {
    intensity,
    reduced,
    gravity: 0.035,
    drag: 0.975,
    echoes: FIREWORK_ECHOES,
  });
  return <canvas ref={ref} className="h-full w-full" aria-hidden />;
}

// ── 9. Constellation (milestone only) ─────────────────────────────────────────

/** Stars appearing one by one and joining up. The "look how far" one. */
function ConstellationScene({ intensity, reduced }: SceneProps) {
  const stars = [
    [18, 72],
    [32, 44],
    [48, 58],
    [62, 28],
    [78, 46],
    [92, 22],
  ];
  return (
    <svg viewBox="0 0 110 90" className="h-full w-full" aria-hidden>
      {stars.slice(1).map(([x, y], i) => {
        const [px, py] = stars[i];
        return (
          <motion.line
            key={`l${x}-${y}`}
            x1={px}
            y1={py}
            x2={x}
            y2={y}
            className="stroke-primary/45"
            strokeWidth="0.7"
            initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.34, delay: 0.28 + i * 0.22, ease: "easeOut" }}
          />
        );
      })}
      {stars.map(([x, y], i) => (
        <motion.circle
          key={`s${x}-${y}`}
          cx={x}
          cy={y}
          className="fill-primary"
          initial={reduced ? { r: 2, opacity: 0.9 } : { r: 0, opacity: 0 }}
          animate={{
            r: [0, 3.4 * intensity + 1, 2],
            opacity: [0, 1, 0.9],
          }}
          transition={{ duration: 0.42, delay: 0.16 + i * 0.22 }}
        />
      ))}
    </svg>
  );
}

// ── Dispatch ──────────────────────────────────────────────────────────────────

const SCENE_COMPONENTS: Record<SceneId, React.FC<SceneProps>> = {
  confetti: ConfettiScene,
  ribbons: RibbonsScene,
  mascot: MascotScene,
  stamp: StampScene,
  bloom: BloomScene,
  sunrise: SunriseScene,
  lantern: LanternScene,
  fireworks: FireworksScene,
  constellation: ConstellationScene,
};

export function Scene({
  id,
  intensity,
  reduced,
}: {
  id: SceneId;
} & SceneProps) {
  const Cmp = SCENE_COMPONENTS[id];
  return <Cmp intensity={intensity} reduced={reduced} />;
}
