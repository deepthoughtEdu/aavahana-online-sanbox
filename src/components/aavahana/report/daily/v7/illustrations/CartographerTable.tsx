"use client";

import React from "react";
import { motion } from "framer-motion";
import type { PlannedDeliverable, UnplannedDeliverable } from "../data/types";

/* ── Layout constants ── */

const VB_W = 380;
const VB_H_BASE = 200;
const TABLE_PAD = 10;
const PARCH_X = TABLE_PAD;
const PARCH_Y = TABLE_PAD;
const PARCH_W = VB_W - TABLE_PAD * 2;         // 360
const ROUTE_AREA_X = 44;
const ROUTE_AREA_W = PARCH_W - 54;            // 306
const LANE_H = 28;
const LANE_GAP = 4;
const MAX_LANES = 6;
const INSTRUMENT_H = 44;
// Reserves vertical space below the routes for the new legend strip.
const LEGEND_H = 22;

/* ── Deterministic splatter position (no Math.random — stable across renders) ── */

function splatPos(id: number): { dx: number; dy: number } {
  const hash = ((id * 2654435761) >>> 0) % 100;
  return { dx: (hash % 10) - 5, dy: (hash % 7) - 3 };
}

/* ── Props ── */

interface CartographerTableProps {
  deliverables: PlannedDeliverable[];
  unplanned: UnplannedDeliverable[];
  phase: "baseline" | "live" | "stamped";
  /** Number of Phase A conversation steps answered so far (drives ornamental progression) */
  stepsCompleted: number;
}

export function CartographerTable({
  deliverables,
  unplanned,
  phase,
  stepsCompleted,
}: CartographerTableProps) {
  // Fallback rule: live/stamped force all ornamental elements visible
  const effectiveSteps = phase === "live" || phase === "stamped" ? 10 : stepsCompleted;

  // Dynamic viewBox height based on route lane count
  const laneCount = Math.min(deliverables.length + unplanned.length, MAX_LANES);
  const hasRoutes = laneCount > 0;
  const routeAreaH = hasRoutes ? laneCount * LANE_H + (laneCount - 1) * LANE_GAP : 0;
  const VB_H = hasRoutes
    ? TABLE_PAD * 2 + 40 + routeAreaH + LEGEND_H + INSTRUMENT_H
    : VB_H_BASE;
  const PARCH_H = VB_H - TABLE_PAD * 2;

  // Grid opacity — darkens as conversation progresses
  const gridOpacity = phase === "stamped" ? 0.15 : Math.min(0.13, 0.03 + effectiveSteps * 0.025);

  // Route layout
  const routeAreaTopY = PARCH_Y + 44;

  // Time scaling — floor of 30min prevents division issues
  const allTimes = [
    ...deliverables.map((d) => d.estimateMins),
    ...deliverables.map((d) => d.actualMins),
    ...unplanned.map((u) => u.minutesTaken),
  ];
  const maxTime = Math.max(...allTimes, 30);
  const timeToX = (mins: number) => ROUTE_AREA_X + (mins / maxTime) * ROUTE_AREA_W;

  // Status → Tailwind color class
  const STATUS_CLASS: Record<string, string> = {
    done: "text-success",
    partial: "text-warning",
    not_done: "text-error/30",
    null: "text-error/30",
  };

  // Touched deliverables — any that have been modified (for ink splatters)
  const touchedIds = new Set(
    deliverables
      .filter((d) => d.status !== null || d.actualMins !== d.estimateMins)
      .map((d) => d.id),
  );

  // Divider leg geometry
  const isOpen = phase === "live";
  const legAngle = isOpen ? 25 : 3;
  const legRad = (legAngle * Math.PI) / 180;
  const legLen = 28;
  const divPivotX = PARCH_X + 30;
  const divPivotY = PARCH_Y + PARCH_H - 20;

  // Cartouche
  const cartoucheX = PARCH_X + PARCH_W - 90;
  const cartoucheY = PARCH_Y + 10;
  const cartoucheW = 78;
  const cartoucheH = 28;
  const cartoucheComplete = phase !== "baseline" || effectiveSteps >= 4;

  // Critical path state
  const hasCp = deliverables.some((d) => d.isCriticalPath);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full py-3"
    >
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full"
        role="img"
        aria-label={
          phase === "stamped"
            ? "Completed cartographer's table — day mapped"
            : phase === "live"
              ? "Cartographer's table — charting your day"
              : "Cartographer's table — tools ready"
        }
      >
        {/* ── Stipple texture definition ── */}
        <defs>
          <pattern id="ct-stipple" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx={2} cy={3} r={0.4} className="fill-base-content/[0.03]" />
            <circle cx={8} cy={1} r={0.3} className="fill-base-content/[0.03]" />
            <circle cx={5} cy={7} r={0.4} className="fill-base-content/[0.03]" />
            <circle cx={10} cy={9} r={0.3} className="fill-base-content/[0.03]" />
          </pattern>
        </defs>

        {/* ── Wooden table surface ── */}
        <rect x={0} y={0} width={VB_W} height={VB_H} rx={4} className="fill-base-300" />
        {/* Wood grain */}
        {[0.15, 0.3, 0.45, 0.55, 0.7, 0.85, 0.95].map((pct) => (
          <line
            key={`grain-${pct}`}
            x1={0} y1={VB_H * pct}
            x2={VB_W} y2={VB_H * pct}
            className="stroke-base-content/[0.04]"
            strokeWidth={0.5}
          />
        ))}

        {/* ── Parchment sheet ── */}
        <rect x={PARCH_X} y={PARCH_Y} width={PARCH_W} height={PARCH_H} rx={2} className="fill-base-100" />
        <rect x={PARCH_X} y={PARCH_Y} width={PARCH_W} height={PARCH_H} rx={2} fill="url(#ct-stipple)" />

        {/* ── Brass corner pins ── */}
        {(
          [
            [PARCH_X + 6, PARCH_Y + 6],
            [PARCH_X + PARCH_W - 6, PARCH_Y + 6],
            [PARCH_X + 6, PARCH_Y + PARCH_H - 6],
            [PARCH_X + PARCH_W - 6, PARCH_Y + PARCH_H - 6],
          ] as [number, number][]
        ).map(([cx, cy]) => (
          <g key={`pin-${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r={3} className="fill-warning/40" />
            <circle cx={cx} cy={cy} r={1.5} className="fill-warning/20" />
          </g>
        ))}

        {/* ── Grid lines — opacity driven by stepsCompleted ── */}
        {[0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((pct) => (
          <line
            key={`vgrid-${pct}`}
            x1={PARCH_X + PARCH_W * pct} y1={PARCH_Y}
            x2={PARCH_X + PARCH_W * pct} y2={PARCH_Y + PARCH_H}
            stroke="currentColor"
            className="text-base-content"
            strokeWidth={0.5}
            opacity={gridOpacity}
          />
        ))}
        {[0.2, 0.4, 0.6, 0.8].map((pct) => (
          <line
            key={`hgrid-${pct}`}
            x1={PARCH_X} y1={PARCH_Y + PARCH_H * pct}
            x2={PARCH_X + PARCH_W} y2={PARCH_Y + PARCH_H * pct}
            stroke="currentColor"
            className="text-base-content"
            strokeWidth={0.5}
            opacity={gridOpacity}
          />
        ))}

        {/* ── Compass rose — inks in at step >= 1 ── */}
        <g transform={`translate(${PARCH_X + 28}, ${PARCH_Y + 28})`}>
          <circle r={10} fill="none" className="stroke-primary/20" strokeWidth={0.6} />
          <g opacity={effectiveSteps >= 1 ? 0.5 : 0.12} className="transition-opacity duration-300">
            <polygon points="0,-10 -2.5,-4 2.5,-4" className="fill-primary" />
            <polygon points="0,10 -2,5 2,5" className="fill-primary/50" />
            <polygon points="10,0 5,-2 5,2" className="fill-primary/50" />
            <polygon points="-10,0 -5,-2 -5,2" className="fill-primary/50" />
          </g>
          <circle r={1.2} className="fill-primary" opacity={effectiveSteps >= 1 ? 0.5 : 0.15} />
          <text y={-13} textAnchor="middle" fontSize={4.5} fontWeight="bold"
            className="fill-primary" opacity={effectiveSteps >= 1 ? 0.5 : 0.15}>N</text>
        </g>

        {/* ── Dividers — open during live, closed at baseline/stamped ── */}
        <g>
          <circle cx={divPivotX} cy={divPivotY} r={1.8} className="fill-warning/50" />
          <line
            x1={divPivotX} y1={divPivotY}
            x2={divPivotX - Math.sin(legRad) * legLen}
            y2={divPivotY - Math.cos(legRad) * legLen}
            className="stroke-warning/40" strokeWidth={1.5} strokeLinecap="round"
          />
          <line
            x1={divPivotX} y1={divPivotY}
            x2={divPivotX + Math.sin(legRad) * legLen}
            y2={divPivotY - Math.cos(legRad) * legLen}
            className="stroke-warning/40" strokeWidth={1.5} strokeLinecap="round"
          />
          <circle
            cx={divPivotX - Math.sin(legRad) * legLen}
            cy={divPivotY - Math.cos(legRad) * legLen}
            r={1} className="fill-warning/30"
          />
          <circle
            cx={divPivotX + Math.sin(legRad) * legLen}
            cy={divPivotY - Math.cos(legRad) * legLen}
            r={1} className="fill-warning/30"
          />
        </g>

        {/* ── Quill — nib at top-right of parchment, angled -30° ── */}
        <g transform={`translate(${PARCH_X + PARCH_W - 30}, ${PARCH_Y + 30}) rotate(-30)`}>
          <line x1={0} y1={0} x2={30} y2={0} className="stroke-base-content/20" strokeWidth={1.2} strokeLinecap="round" />
          <path d="M30,0 Q34,-5 38,-2 Q34,-0.5 30,0" className="fill-base-content/10" />
          <path d="M30,0 Q34,4 38,2 Q34,0.5 30,0" className="fill-base-content/8" />
          <path d="M0,0 L-4,-1.2 L-5.5,0 L-4,1.2 Z" className="fill-warning/50" />
          {effectiveSteps >= 1 && (
            <circle cx={-7} cy={1} r={1} className="fill-primary/25" />
          )}
          {(phase === "live" || phase === "stamped") && (
            <path
              d="M-5.5,0 Q-12,3 -18,1 Q-22,-1 -28,2"
              fill="none"
              className="stroke-primary/15"
              strokeWidth={0.8}
              strokeLinecap="round"
            />
          )}
        </g>

        {/* ── Scale bar — appears at step >= 2 ── */}
        {effectiveSteps >= 2 && (
          <g className="transition-opacity duration-300">
            <line
              x1={PARCH_X + PARCH_W * 0.35} y1={PARCH_Y + PARCH_H - 12}
              x2={PARCH_X + PARCH_W * 0.65} y2={PARCH_Y + PARCH_H - 12}
              className="stroke-base-content/20" strokeWidth={1}
            />
            <line
              x1={PARCH_X + PARCH_W * 0.35} y1={PARCH_Y + PARCH_H - 15}
              x2={PARCH_X + PARCH_W * 0.35} y2={PARCH_Y + PARCH_H - 9}
              className="stroke-base-content/20" strokeWidth={0.8}
            />
            <line
              x1={PARCH_X + PARCH_W * 0.65} y1={PARCH_Y + PARCH_H - 15}
              x2={PARCH_X + PARCH_W * 0.65} y2={PARCH_Y + PARCH_H - 9}
              className="stroke-base-content/20" strokeWidth={0.8}
            />
            <line
              x1={PARCH_X + PARCH_W * 0.5} y1={PARCH_Y + PARCH_H - 14}
              x2={PARCH_X + PARCH_W * 0.5} y2={PARCH_Y + PARCH_H - 10}
              className="stroke-base-content/15" strokeWidth={0.6}
            />
            <text
              x={PARCH_X + PARCH_W * 0.5} y={PARCH_Y + PARCH_H - 5}
              textAnchor="middle" fontSize={5}
              className="fill-base-content/25"
            >min</text>
          </g>
        )}

        {/* ── Cartouche — begins at step >= 3, completes at step >= 4 or live/stamped ── */}
        {effectiveSteps >= 3 && (
          <g className="transition-opacity duration-300">
            <rect x={cartoucheX} y={cartoucheY} width={cartoucheW} height={cartoucheH}
              rx={3} fill="none" className="stroke-base-content/15" strokeWidth={0.8} />
            <rect x={cartoucheX + 2} y={cartoucheY + 2} width={cartoucheW - 4} height={cartoucheH - 4}
              rx={2} fill="none" className="stroke-base-content/10" strokeWidth={0.5} />
            {(
              [
                [cartoucheX, cartoucheY],
                [cartoucheX + cartoucheW, cartoucheY],
                [cartoucheX, cartoucheY + cartoucheH],
                [cartoucheX + cartoucheW, cartoucheY + cartoucheH],
              ] as [number, number][]
            ).map(([cx, cy], i) => {
              const dx = i % 2 === 0 ? 4 : -4;
              const dy = i < 2 ? 4 : -4;
              return (
                <line key={`cfl-${i}`} x1={cx} y1={cy} x2={cx + dx} y2={cy + dy}
                  className="stroke-base-content/[0.12]" strokeWidth={0.5} />
              );
            })}
            {cartoucheComplete ? (
              <text
                x={cartoucheX + cartoucheW / 2} y={cartoucheY + cartoucheH / 2 + 2}
                textAnchor="middle" fontSize={5.5}
                className="fill-base-content/30"
              >
                {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </text>
            ) : (
              <line
                x1={cartoucheX + cartoucheW} y1={cartoucheY + 8}
                x2={cartoucheX + cartoucheW} y2={cartoucheY + cartoucheH - 8}
                className="stroke-base-content/10" strokeWidth={0.5} strokeDasharray="2 2"
              />
            )}
          </g>
        )}

        {/* ── Wax seal — stamped phase only ── */}
        {phase === "stamped" && (
          <g transform={`translate(${PARCH_X + PARCH_W - 24}, ${PARCH_Y + PARCH_H - 24})`}>
            <circle r={10} className="fill-primary/25" />
            <circle r={8} className="fill-primary/15" />
            <polygon
              points="0,-5 1.5,-1.5 5,0 1.5,1.5 0,5 -1.5,1.5 -5,0 -1.5,-1.5"
              className="fill-primary/30"
            />
            <circle r={1.2} className="fill-primary/20" />
          </g>
        )}

        {/* ── Planned deliverable lanes ── */}
        {deliverables.slice(0, MAX_LANES).map((d, i) => {
          const laneY = routeAreaTopY + i * (LANE_H + LANE_GAP);
          const planEndX = timeToX(d.estimateMins);
          const actualEndX = timeToX(d.actualMins);
          const isCp = d.isCriticalPath;
          const routeOpacity = hasCp ? (isCp ? 1 : 0.45) : 1;
          const label = d.label.length > 20 ? d.label.slice(0, 18) + ".." : d.label;
          const statusClass = STATUS_CLASS[d.status ?? "null"] ?? STATUS_CLASS["null"];

          return (
            <g key={d.id} opacity={routeOpacity}>
              {/* Lane label */}
              <text
                x={PARCH_X + 6} y={laneY + LANE_H / 2 + 1.5}
                fontSize={7.5} className="fill-base-content/70"
                fontWeight={isCp ? 600 : 500}
                dominantBaseline="middle"
              >
                {isCp ? "★ " : ""}{label}
              </text>

              {/* Planned route — always visible, dashed */}
              <line
                x1={ROUTE_AREA_X} y1={laneY + 8}
                x2={planEndX} y2={laneY + 8}
                className="stroke-base-content/25" strokeWidth={1.5}
                strokeDasharray="4 3" strokeLinecap="round"
              />
              <text x={planEndX} y={laneY + 4} fontSize={6} textAnchor="middle"
                className="fill-base-content/40">{d.estimateMins}m</text>

              {/* Actual route — live/stamped only */}
              {(phase === "live" || phase === "stamped") && (
                <>
                  <line
                    x1={ROUTE_AREA_X} y1={laneY + 18}
                    x2={actualEndX} y2={laneY + 18}
                    stroke="currentColor" className={statusClass}
                    strokeWidth={2.5} strokeLinecap="round"
                  />
                  <text x={actualEndX} y={laneY + 27} fontSize={6} textAnchor="middle"
                    fill="currentColor" className={statusClass}>{d.actualMins}m</text>

                  {/* Status marker at actual endpoint */}
                  {d.status === "done" && (
                    <circle cx={actualEndX} cy={laneY + 18} r={3} fill="currentColor" className="text-success" />
                  )}
                  {d.status === "partial" && (
                    <g>
                      <circle cx={actualEndX} cy={laneY + 18} r={3} fill="none"
                        stroke="currentColor" className="text-warning" strokeWidth={1} />
                      <path d={`M${actualEndX},${laneY + 15} A3,3 0 0,1 ${actualEndX},${laneY + 21} Z`}
                        fill="currentColor" className="text-warning" />
                    </g>
                  )}
                  {(d.status === "not_done" || d.status === null) && (
                    <g className="text-error/40">
                      <circle cx={actualEndX} cy={laneY + 18} r={3} fill="none"
                        stroke="currentColor" strokeWidth={1} />
                      <line x1={actualEndX - 2} y1={laneY + 16} x2={actualEndX + 2} y2={laneY + 20}
                        stroke="currentColor" strokeWidth={0.8} />
                      <line x1={actualEndX + 2} y1={laneY + 16} x2={actualEndX - 2} y2={laneY + 20}
                        stroke="currentColor" strokeWidth={0.8} />
                    </g>
                  )}

                  {/* Critical path pennant */}
                  {isCp && (
                    <g>
                      <line x1={actualEndX} y1={laneY + 15} x2={actualEndX} y2={laneY + 4}
                        className="stroke-primary/50" strokeWidth={1} />
                      <polygon
                        points={`${actualEndX},${laneY + 4} ${actualEndX + 7},${laneY + 7} ${actualEndX},${laneY + 10}`}
                        className="fill-primary/40"
                      />
                    </g>
                  )}
                </>
              )}
            </g>
          );
        })}

        {/* ── Unplanned routes — wavy, warning-colored, no baseline ── */}
        {(phase === "live" || phase === "stamped") &&
          unplanned.slice(0, MAX_LANES - Math.min(deliverables.length, MAX_LANES)).map((u, i) => {
            const laneIndex = Math.min(deliverables.length, MAX_LANES) + i;
            const laneY = routeAreaTopY + laneIndex * (LANE_H + LANE_GAP);
            const endX = timeToX(u.minutesTaken);
            const label = u.label.length > 20 ? u.label.slice(0, 18) + ".." : u.label;
            const qx1 = ROUTE_AREA_X + (endX - ROUTE_AREA_X) * 0.25;
            const qx2 = ROUTE_AREA_X + (endX - ROUTE_AREA_X) * 0.5;
            const qx3 = ROUTE_AREA_X + (endX - ROUTE_AREA_X) * 0.75;
            return (
              <g key={`up-${u.id}`}>
                <text x={PARCH_X + 4} y={laneY + LANE_H / 2 + 1.5}
                  fontSize={9} fontWeight="bold" className="fill-warning/70"
                  dominantBaseline="middle">+</text>
                <text x={PARCH_X + 14} y={laneY + LANE_H / 2 + 1.5}
                  fontSize={7.5} className="fill-warning/75"
                  dominantBaseline="middle">{label}</text>
                <path
                  d={`M${ROUTE_AREA_X},${laneY + 14} Q${qx1},${laneY + 10} ${qx2},${laneY + 14} Q${qx3},${laneY + 18} ${endX},${laneY + 14}`}
                  fill="none" className="stroke-warning/60" strokeWidth={2} strokeLinecap="round"
                />
                <text x={endX} y={laneY + 24} fontSize={6} textAnchor="middle"
                  className="fill-warning/55">{u.minutesTaken}m</text>
              </g>
            );
          })}

        {/* ── Overflow label ── */}
        {deliverables.length + unplanned.length > MAX_LANES && (
          <text
            x={PARCH_X + PARCH_W / 2}
            y={routeAreaTopY + MAX_LANES * (LANE_H + LANE_GAP) + 8}
            textAnchor="middle" fontSize={7}
            className="fill-base-content/40"
          >
            +{deliverables.length + unplanned.length - MAX_LANES} more
          </text>
        )}

        {/* ── Legend ── Anchored below the routes, above the scale bar. */}
        {hasRoutes && (() => {
          const legendY = routeAreaTopY + routeAreaH + 8;
          const legendItems: { x: number; render: React.ReactNode; label: string }[] = [
            {
              x: PARCH_X + 8,
              label: "planned",
              render: (
                <line
                  x1={PARCH_X + 8} y1={legendY + 4}
                  x2={PARCH_X + 24} y2={legendY + 4}
                  className="stroke-base-content/35"
                  strokeWidth={1.5} strokeDasharray="4 3" strokeLinecap="round"
                />
              ),
            },
            {
              x: PARCH_X + 60,
              label: "actual",
              render: (
                <line
                  x1={PARCH_X + 60} y1={legendY + 4}
                  x2={PARCH_X + 76} y2={legendY + 4}
                  className="stroke-success" strokeWidth={2.5} strokeLinecap="round"
                />
              ),
            },
            {
              x: PARCH_X + 110,
              label: "done",
              render: <circle cx={PARCH_X + 116} cy={legendY + 4} r={3} className="fill-success" />,
            },
            {
              x: PARCH_X + 150,
              label: "partial",
              render: (
                <g>
                  <circle cx={PARCH_X + 156} cy={legendY + 4} r={3} fill="none"
                    className="stroke-warning" strokeWidth={1} />
                  <path d={`M${PARCH_X + 156},${legendY + 1} A3,3 0 0,1 ${PARCH_X + 156},${legendY + 7} Z`}
                    className="fill-warning" />
                </g>
              ),
            },
            {
              x: PARCH_X + 195,
              label: "missed",
              render: (
                <g className="stroke-error/60">
                  <circle cx={PARCH_X + 201} cy={legendY + 4} r={3} fill="none" strokeWidth={1} />
                  <line x1={PARCH_X + 199} y1={legendY + 2} x2={PARCH_X + 203} y2={legendY + 6} strokeWidth={0.8} />
                  <line x1={PARCH_X + 203} y1={legendY + 2} x2={PARCH_X + 199} y2={legendY + 6} strokeWidth={0.8} />
                </g>
              ),
            },
            {
              x: PARCH_X + 245,
              label: "unplanned",
              render: (
                <path
                  d={`M${PARCH_X + 245},${legendY + 4} Q${PARCH_X + 249},${legendY + 1} ${PARCH_X + 253},${legendY + 4} Q${PARCH_X + 257},${legendY + 7} ${PARCH_X + 261},${legendY + 4}`}
                  fill="none" className="stroke-warning/60" strokeWidth={2} strokeLinecap="round"
                />
              ),
            },
          ];

          return (
            <g>
              {legendItems.map((item, i) => (
                <g key={`legend-${i}`}>
                  {item.render}
                  <text
                    x={item.x + (item.label === "planned" || item.label === "actual" || item.label === "unplanned" ? 20 : 10)}
                    y={legendY + 6}
                    fontSize={6.5}
                    className="fill-base-content/55"
                    dominantBaseline="middle"
                  >
                    {item.label}
                  </text>
                </g>
              ))}
            </g>
          );
        })()}

        {/* ── Ink splatters — live phase, touched deliverables only ── */}
        {phase === "live" && [...touchedIds].map((id) => {
          const laneIndex = deliverables.findIndex((d) => d.id === id);
          if (laneIndex === -1) return null;
          const laneY = routeAreaTopY + laneIndex * (LANE_H + LANE_GAP) + LANE_H / 2;
          const d = deliverables[laneIndex];
          const actualX = ROUTE_AREA_X + (d.actualMins / maxTime) * ROUTE_AREA_W;
          const { dx, dy } = splatPos(id);
          return (
            <g key={`splat-${id}`} className="text-primary/15">
              <circle cx={actualX + dx} cy={laneY + dy} r={1.5} fill="currentColor" />
              <circle cx={actualX + dx + 2.5} cy={laneY + dy - 1} r={0.8} fill="currentColor" />
              <circle cx={actualX + dx - 1.5} cy={laneY + dy + 2} r={0.6} fill="currentColor" />
            </g>
          );
        })}
      </svg>
    </motion.div>
  );
}
