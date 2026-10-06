// src/components/aavahana/dashboard/DrillsThisWeek.tsx
"use client";

import { useMemo } from "react";
import { Section } from "@/components/shared/Section";
import { ClockIcon } from "@/components/shared/icons";
import { formatDate } from "@/utils/shared/date.utils";
import { DRILL_PURPOSE } from "./dashboard.constants";
import type { UBSScore } from "@/types";

interface DrillsThisWeekProps {
  score: UBSScore | null;
  isLoading: boolean;
}

interface DrillSummary {
  eventType: string;
  eventLabel: string;
  participated: number;
  total: number;
  allParticipated: boolean;
}

function aggregateDrills(
  breakdown: UBSScore["breakdown"]
): DrillSummary[] {
  const map = new Map<string, DrillSummary>();
  for (const event of breakdown) {
    const existing = map.get(event.eventType);
    if (existing) {
      existing.total += 1;
      existing.participated += event.participated ? 1 : 0;
      existing.allParticipated = existing.participated === existing.total;
    } else {
      map.set(event.eventType, {
        eventType: event.eventType,
        eventLabel: event.eventLabel,
        total: 1,
        participated: event.participated ? 1 : 0,
        allParticipated: event.participated,
      });
    }
  }
  return Array.from(map.values());
}

export function DrillsThisWeek({ score, isLoading }: DrillsThisWeekProps) {
  const drills = useMemo(
    () => (score?.breakdown ? aggregateDrills(score.breakdown) : []),
    [score]
  );

  const activeDrills = drills.filter((d) => d.participated > 0).length;

  return (
    <Section>
      <Section.Header
        icon={<ClockIcon size="sm" />}
        title="Your Drills This Week"
        subtitle={
          score ? `Week of ${formatDate(score.weekStart, "D MMM")}` : undefined
        }
      />
      <Section.Body>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-10 w-full" />
            ))}
          </div>
        ) : !score ? (
          <p className="text-sm text-base-content/60">
            No drill data yet — scores appear after your first week of submissions.
          </p>
        ) : (
          <div className="space-y-3">
            <ul className="space-y-2">
              {drills.map((drill) => (
                <li key={drill.eventType} className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 text-sm flex-shrink-0 ${
                      drill.allParticipated
                        ? "text-success"
                        : "text-base-content/30"
                    }`}
                  >
                    {drill.allParticipated ? "✓" : "○"}
                  </span>
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-black">
                      {drill.eventLabel}
                    </span>
                    {drill.total > 1 && (
                      <span className="text-xs text-base-content/50 ml-1.5">
                        {drill.participated}/{drill.total} days
                      </span>
                    )}
                    {DRILL_PURPOSE[drill.eventType] && (
                      <span className="text-xs text-base-content/50">
                        {" · "}
                        {DRILL_PURPOSE[drill.eventType]}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-xs text-base-content/60 pt-1 border-t border-base-300">
              {activeDrills} of {drills.length} drills active · keep going
            </p>
          </div>
        )}
      </Section.Body>
    </Section>
  );
}
