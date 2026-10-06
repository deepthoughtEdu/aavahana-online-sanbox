import type {
  CareerRunrateSnapshot,
  CareerRunrateSnapshotEnriched,
  AxisGapItem,
  TrajectoryDelta,
  RunwayNode,
  PlannedTrajectory,
  CareerRunrateData,
} from '@/types';
import { formatDate, todayISO } from '@/utils/shared/date.utils';

// ─── Label map ────────────────────────────────────────────────────────────────

const AXIS_LABELS: Record<string, string> = {
  deliverables: 'Deliverables',
  ip: 'IP',
  kpis: 'KPIs',
  frameworks: 'Frameworks',
  processes: 'Processes',
  rituals: 'Rituals',
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function monthDiff(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

// ─── 1. enrichSnapshotsWithDeltas ─────────────────────────────────────────────

export function enrichSnapshotsWithDeltas(
  snapshots: CareerRunrateSnapshot[]
): CareerRunrateSnapshotEnriched[] {
  return snapshots.map((snap, i) => {
    const prior = i > 0 ? snapshots[i - 1] : null;
    const delta = prior ? snap.compositeScore - prior.compositeScore : null;
    let deltaDirection: CareerRunrateSnapshotEnriched['deltaDirection'] = 'first';
    if (delta !== null) {
      deltaDirection = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
    }
    return {
      ...snap,
      delta,
      deltaDirection,
      isLevelChange: prior ? snap.level !== prior.level : false,
      monthLabel: formatDate(snap.date, "MMM"),
    };
  });
}

// ─── 2. computeAxisGaps ───────────────────────────────────────────────────────

export function computeAxisGaps(
  axisScores: Record<string, number>,
  l4Thresholds: Record<string, number>
): AxisGapItem[] {
  return Object.keys(axisScores)
    .map((axis) => {
      const current = axisScores[axis];
      const required = l4Thresholds[axis];
      const hasCriteria = required !== undefined && required > 0;
      const gap = hasCriteria ? required - current : 0;
      const cleared = hasCriteria ? gap <= 0 : false;
      const fillPct = hasCriteria ? Math.min(100, Math.round((current / required) * 100)) : 0;
      return {
        axis,
        label: AXIS_LABELS[axis] ?? axis,
        current,
        required: required ?? 0,
        gap,
        cleared,
        hasCriteria,
        fillPct,
      };
    })
    .sort((a, b) => {
      if (!a.hasCriteria && b.hasCriteria) return 1;
      if (a.hasCriteria && !b.hasCriteria) return -1;
      return b.gap - a.gap;
    });
}

// ─── 3. computeTrajectoryDelta ────────────────────────────────────────────────

export function computeTrajectoryDelta(
  planned: PlannedTrajectory,
  snapshots: CareerRunrateSnapshot[]
): TrajectoryDelta {
  if (!snapshots.length || !planned.points?.length) {
    return { monthsDelta: 0, direction: 'on-track', concreteMilestone: null };
  }

  // Find the most recently achieved level that also appears in the planned points
  const achievedLevels = new Set(snapshots.map((s) => s.level));
  let bestMilestone: TrajectoryDelta['concreteMilestone'] = null;

  for (const point of planned.points) {
    if (achievedLevels.has(point.level)) {
      const achievedDate = snapshots.find((s) => s.level === point.level)?.date;
      if (achievedDate) {
        const planned_ms = new Date(point.date).getTime();
        const actual_ms = new Date(achievedDate).getTime();
        const months = Math.round((planned_ms - actual_ms) / (1000 * 60 * 60 * 24 * 30.4));
        bestMilestone = {
          level: point.level,
          plannedDate: point.date,
          achievedDate,
        };
        const direction: TrajectoryDelta['direction'] =
          months > 1 ? 'ahead' : months < -1 ? 'behind' : 'on-track';
        return {
          monthsDelta: Math.abs(months),
          direction,
          concreteMilestone: bestMilestone,
        };
      }
    }
  }

  return { monthsDelta: 0, direction: 'on-track', concreteMilestone: null };
}

// ─── 4. computeDialFill ───────────────────────────────────────────────────────

export function computeDialFill(
  compositeScore: number,
  currentLevelMin: number,
  nextLevelMin: number
): number {
  const range = nextLevelMin - currentLevelMin;
  if (range <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round(((compositeScore - currentLevelMin) / range) * 100)));
}

// ─── 5. buildRunwayNodes ──────────────────────────────────────────────────────

export function buildRunwayNodes(
  data: CareerRunrateData,
  snapshots: CareerRunrateSnapshot[]
): RunwayNode[] {
  const allDates: string[] = [];
  const plannedPoints = data.planned?.points ?? [];
  const ladderLevels = data.ladder?.levels ?? [];

  // Collect all dates to find span
  plannedPoints.forEach((p) => allDates.push(p.date));
  snapshots.forEach((s) => allDates.push(s.date));
  if (data.projected?.nextLevelEligibility?.estimatedDate) {
    allDates.push(data.projected.nextLevelEligibility.estimatedDate);
  }

  if (allDates.length === 0) return [];

  const timelineStart = Math.min(...allDates.map((d) => new Date(d).getTime()));
  const timelineEnd = Math.max(...allDates.map((d) => new Date(d).getTime()));
  const span = timelineEnd - timelineStart || 1;

  const pct = (dateStr: string) =>
    Math.round(((new Date(dateStr).getTime() - timelineStart) / span) * 100);

  const today = new Date();
  const todayStr = todayISO();
  const latestActual = snapshots[snapshots.length - 1];
  const nodes: RunwayNode[] = [];

  // Past achieved level nodes (derive achievedDate from snapshots)
  const levelsSeen = new Set<string>();
  for (const point of plannedPoints) {
    const achievedSnap = snapshots.find((s) => s.level === point.level);
    if (achievedSnap && point.level !== data.currentLevel?.name) {
      if (!levelsSeen.has(point.level)) {
        levelsSeen.add(point.level);
        nodes.push({
          id: `achieved-${point.level}`,
          label: point.level,
          date: achievedSnap.date,
          type: 'achieved',
          positionPct: pct(achievedSnap.date),
        });
      }
    }
  }

  // TODAY node
  nodes.push({
    id: 'current',
    label: 'TODAY',
    date: todayStr,
    type: 'current',
    compositeScore: latestActual?.compositeScore,
    positionPct: Math.min(99, pct(todayStr)),
  });

  // Projected next level node with confidence band from velocity
  if (data.projected?.nextLevelEligibility?.estimatedDate && data.nextLevel && latestActual) {
    const estimatedDate = data.projected.nextLevelEligibility.estimatedDate;

    // Derive confidence band from velocity
    const gains = snapshots
      .slice(1)
      .map((s, i) => s.compositeScore - snapshots[i].compositeScore)
      .filter((g) => g > 0);

    const avgGain = gains.length
      ? gains.reduce((a, b) => a + b, 0) / gains.length
      : 2;
    const fastGain = Math.max(...gains, 1);
    const slowGain = Math.max(1, avgGain * 0.6);
    const gap = data.nextLevel.minCompositeScore - latestActual.compositeScore;

    const earliest = addMonths(today, Math.ceil(gap / fastGain));
    const latest = addMonths(today, Math.ceil(gap / slowGain));
    const earliestStr = formatDate(earliest, "date");
    const latestStr = formatDate(latest, "date");

    // Recompute pct with confidence band dates included in span
    const allWithBand = [...allDates, earliestStr, latestStr];
    const spanWithBand = Math.max(...allWithBand.map((d) => new Date(d).getTime())) - timelineStart;
    const pct2 = (dateStr: string) =>
      Math.round(((new Date(dateStr).getTime() - timelineStart) / spanWithBand) * 100);

    nodes.push({
      id: `projected-${data.nextLevel.name}`,
      label: data.nextLevel.name,
      date: estimatedDate,
      type: 'projected',
      positionPct: pct2(estimatedDate),
      confidenceBand: {
        leftPct: pct2(earliestStr),
        widthPct: pct2(latestStr) - pct2(earliestStr),
        earliest: earliestStr,
        latest: latestStr,
      },
    });
  }

  // Future levels beyond next
  const nextOrder = data.nextLevel?.order ?? 999;
  for (const point of plannedPoints) {
    const ladderLevel = ladderLevels.find((l) => l.name === point.level);
    if (ladderLevel && ladderLevel.order > nextOrder) {
      nodes.push({
        id: `future-${point.level}`,
        label: point.level,
        date: point.date,
        type: 'future',
        positionPct: pct(point.date),
      });
    }
  }

  return nodes.sort((a, b) => a.positionPct - b.positionPct);
}

// ─── 6. Helpers for display ───────────────────────────────────────────────────

export function formatDisplayDate(dateStr: string): string {
  return formatDate(dateStr, "MMM YY");
}

export function monthsBetween(a: string, b: string): number {
  return Math.abs(monthDiff(new Date(a), new Date(b)));
}
