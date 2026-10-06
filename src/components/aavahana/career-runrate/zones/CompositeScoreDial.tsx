'use client';

import { useEffect, useRef } from 'react';

interface CompositeScoreDialProps {
  score: number;
  fillPct: number;        // 0–100: how far across the L3→L4 gap
  nextLevelMin: number;
  nextLevelName: string;
}

const RADIUS = 50;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ARC_DEG = 220;
const ARC_LEN = (ARC_DEG / 360) * CIRCUMFERENCE; // ~192px

export function CompositeScoreDial({ score, fillPct, nextLevelMin, nextLevelName }: CompositeScoreDialProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const fillLen = (fillPct / 100) * ARC_LEN;

  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.style.strokeDasharray = `0 ${CIRCUMFERENCE}`;
    const timeout = setTimeout(() => {
      if (circleRef.current) {
        circleRef.current.style.transition = 'stroke-dasharray 0.9s ease-out';
        circleRef.current.style.strokeDasharray = `${fillLen} ${CIRCUMFERENCE}`;
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [fillLen]);

  return (
    <div className="relative flex-shrink-0" style={{ width: 144, height: 144 }}>
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full"
        style={{ transform: 'rotate(135deg)' }}
      >
        {/* Track arc */}
        <circle
          cx="60" cy="60" r={RADIUS}
          fill="none"
          strokeWidth="10"
          className="stroke-base-300"
          strokeDasharray={`${ARC_LEN} ${CIRCUMFERENCE}`}
          strokeLinecap="round"
        />
        {/* Fill arc */}
        <circle
          ref={circleRef}
          cx="60" cy="60" r={RADIUS}
          fill="none"
          strokeWidth="10"
          className="stroke-primary"
          strokeDasharray={`0 ${CIRCUMFERENCE}`}
          strokeLinecap="round"
        />
      </svg>

      {/* Center label — unrotated */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold leading-none">{score}</span>
        <span className="text-xs opacity-50 mt-1 text-center leading-tight">
          / {nextLevelMin} for {nextLevelName}
        </span>
      </div>
    </div>
  );
}
