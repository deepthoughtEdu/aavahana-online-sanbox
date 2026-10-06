'use client';

import { useMemo } from 'react';
import type { CareerRunrateData, CareerRunrateSnapshot, LadderDetails } from '@/types';
import {
  enrichSnapshotsWithDeltas,
  computeAxisGaps,
  computeTrajectoryDelta,
  computeDialFill,
  buildRunwayNodes,
} from '@/utils/aavahana/career-runrate.utils';
import { formatDate } from '@/utils/shared/date.utils';
import { JourneyStrip } from './zones/JourneyStrip';
import { CompositeScoreDial } from './zones/CompositeScoreDial';
import { TrajectorySignal } from './zones/TrajectorySignal';
import { MomentumStrip } from './zones/MomentumStrip';
import { AxisGapBoard } from './zones/AxisGapBoard';
import { RunwayTimeline } from './zones/RunwayTimeline';

export interface CareerRunrateContainerProps {
  data: CareerRunrateData | null;
  snapshots?: CareerRunrateSnapshot[];
  ladderDetails?: LadderDetails | null;
}

export function CareerRunrateContainer({ data, snapshots, ladderDetails }: CareerRunrateContainerProps) {
  const derived = useMemo(() => {
    if (!data) return null;

    const actualSnapshots = data.actual ?? [];
    const effectiveSnapshots = snapshots && snapshots.length > 0 ? snapshots : actualSnapshots;
    const latestActual = actualSnapshots.length > 0 ? actualSnapshots[actualSnapshots.length - 1] : null;
    const enrichedSnapshots = enrichSnapshotsWithDeltas(effectiveSnapshots);

    // Build L4 thresholds from ladderDetails
    const l4Thresholds: Record<string, number> = {};
    if (ladderDetails?.levels) {
      const l4 = ladderDetails.levels.find((l) => l.level === data.nextLevel?.name);
      if (l4?.criteria) {
        Object.entries(l4.criteria).forEach(([axis, crit]) => {
          l4Thresholds[axis] = crit.minScore ?? 0;
        });
      }
    }
    if (data.nextLevel?.criteria?.length) {
      data.nextLevel.criteria.forEach((c) => {
        if (!l4Thresholds[c.axis]) l4Thresholds[c.axis] = c.minScore;
      });
    }

    const axisScores = (latestActual?.axisScores as unknown as Record<string, number>) ?? {};
    const axisGaps = computeAxisGaps(axisScores, l4Thresholds);
    const planned = data.planned ?? { points: [] };
    const trajectoryDelta = computeTrajectoryDelta(planned, effectiveSnapshots);
    const dialFill = data.nextLevel && data.currentLevel
      ? computeDialFill(latestActual?.compositeScore ?? 0, data.currentLevel.minCompositeScore, data.nextLevel.minCompositeScore)
      : 100;
    const runwayNodes = buildRunwayNodes(data, effectiveSnapshots);

    const levelTitles: Record<string, string> = {};
    if (ladderDetails?.levels) {
      ladderDetails.levels.forEach((l) => {
        if (l.level && l.title) levelTitles[l.level] = l.title;
      });
    }

    const plannedNextLevel = planned.points.find((p) => p.level === data.nextLevel?.name);

    return { latestActual, enrichedSnapshots, axisGaps, trajectoryDelta, dialFill, runwayNodes, levelTitles, plannedNextLevel };
  }, [data, snapshots, ladderDetails]);

  if (!derived || !data) {
    return (
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body text-center py-16">
          <p className="opacity-50">No career runrate data available.</p>
        </div>
      </div>
    );
  }

  const { latestActual, enrichedSnapshots, axisGaps, trajectoryDelta, dialFill, runwayNodes, levelTitles, plannedNextLevel } = derived;

  return (
    <div className="space-y-5">

      {/* Zone 1 — Hero: Journey Strip + Dial + Trajectory Signal */}
      <div
        className="card bg-base-100 border border-base-300"
      >
        <div className="card-body p-4 md:p-5 space-y-5">
          {/* Ladder name */}
          <p className="text-xs uppercase tracking-widest opacity-40">{data.ladder?.name}</p>

          {/* Journey Strip */}
          {data.ladder && data.currentLevel && (
            <JourneyStrip
              ladder={data.ladder}
              currentLevel={data.currentLevel}
              levelTitles={levelTitles}
            />
          )}

          {/* Dial + Signal */}
          <div className="flex flex-col sm:flex-row items-center gap-5 pt-2">
            {latestActual && (
              <CompositeScoreDial
                score={latestActual.compositeScore}
                fillPct={dialFill}
                nextLevelMin={data.nextLevel?.minCompositeScore ?? 100}
                nextLevelName={data.nextLevel?.name ?? '—'}
              />
            )}
            <div className="flex-1 space-y-4">
              <TrajectorySignal delta={trajectoryDelta} />
              {data.nextLevel && data.projected?.nextLevelEligibility && (
                <div className="text-sm">
                  <span className="opacity-50">Projected {data.nextLevel.name} eligibility: </span>
                  <span className="font-semibold">
                    {data.projected.nextLevelEligibility.estimatedDate
                      ? formatDate(data.projected.nextLevelEligibility.estimatedDate, "MMM YYYY")
                      : "Insufficient data"}
                  </span>
                  {plannedNextLevel?.date && (
                    <span className="opacity-40 text-xs ml-2">
                      (planned: {formatDate(plannedNextLevel.date, "MMM YYYY")})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {enrichedSnapshots.length === 0 ? (
        <div className="card border border-base-300 bg-base-100">
          <div className="card-body py-10 text-center">
            <p className="font-medium">No weekly career snapshots yet</p>
            <p className="mt-1 text-sm opacity-60">
              Momentum and runway will appear after career history is generated.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Zone 2 — Momentum Strip */}
          <div>
            <MomentumStrip snapshots={enrichedSnapshots} />
          </div>

          {/* Zone 3 — Axis Gap Board */}
          {latestActual && data.nextLevel && (
            <div>
              <AxisGapBoard
                gaps={axisGaps}
                nextLevelName={data.nextLevel.name}
              />
            </div>
          )}

          {/* Zone 4 — Runway Timeline */}
          <div>
            <RunwayTimeline
              nodes={runwayNodes}
              plannedNextLevelDate={plannedNextLevel?.date}
              projectedNextLevelDate={data.projected?.nextLevelEligibility?.estimatedDate}
              nextLevelName={data.nextLevel?.name}
            />
          </div>
        </>
      )}

    </div>
  );
}
