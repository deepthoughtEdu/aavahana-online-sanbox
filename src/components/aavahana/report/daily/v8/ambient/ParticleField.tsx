"use client";

import React, { useEffect, useRef } from "react";

interface ParticleFieldProps {
  /** Rough circle count. Scaled down on small screens. */
  density?: number;
  className?: string;
}

interface Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number; // base alpha
  hue: number; // 0 primary, 1 accent (mixes between two tints)
}

/**
 * Soft circular orbs drifting slowly across the backdrop. The layer is blurred
 * (via the wrapper) so the circles read as frosted glass blobs roaming behind
 * the content. Pure canvas, no dependencies.
 *
 * Theme aware: reads its own resolved color (set through a Tailwind text class)
 * so the orbs show in light and dark, and re reads on theme flips. Honours
 * prefers reduced motion by drawing a single still frame.
 */
export function ParticleField({ density = 22, className }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    // Two tints: the resolved text color, plus a warmer shift, mixed per orb.
    let primary: [number, number, number] = [125, 125, 200];
    const accent: [number, number, number] = [180, 140, 220];
    const readColor = () => {
      const c = getComputedStyle(canvas).color;
      const m = c.match(/\d+/g);
      if (m && m.length >= 3) {
        primary = [Number(m[0]), Number(m[1]), Number(m[2])];
      }
    };
    readColor();

    let width = 0;
    let height = 0;
    let dpr = 1;
    let orbs: Orb[] = [];

    const seed = () => {
      const count = Math.round(
        Math.min(density, Math.max(10, (width * height) / 60000)),
      );
      const base = Math.min(width, height);
      orbs = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: base * (0.06 + Math.random() * 0.12), // big soft circles
        a: 0.1 + Math.random() * 0.16,
        hue: Math.random(),
      }));
    };

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const o of orbs) {
        const r = Math.round(primary[0] * (1 - o.hue) + accent[0] * o.hue);
        const g = Math.round(primary[1] * (1 - o.hue) + accent[1] * o.hue);
        const b = Math.round(primary[2] * (1 - o.hue) + accent[2] * o.hue);
        const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        grad.addColorStop(0, `rgba(${r},${g},${b},${o.a})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const step = () => {
      for (const o of orbs) {
        o.x += o.vx;
        o.y += o.vy;
        const pad = o.r;
        if (o.x < -pad) o.x = width + pad;
        if (o.x > width + pad) o.x = -pad;
        if (o.y < -pad) o.y = height + pad;
        if (o.y > height + pad) o.y = -pad;
      }
      draw();
    };

    let raf = 0;
    const loop = () => {
      step();
      raf = requestAnimationFrame(loop);
    };

    resize();
    if (reduced) {
      draw();
    } else {
      loop();
    }

    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    const themeObserver = new MutationObserver(readColor);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      themeObserver.disconnect();
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className ?? "h-full w-full text-primary"}
    />
  );
}
