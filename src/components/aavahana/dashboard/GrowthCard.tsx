// src/components/aavahana/dashboard/GrowthCard.tsx
"use client";

import Link from "next/link";
import { Section } from "@/components/shared/Section";
import { ChartLineIcon } from "@/components/shared/icons";
import { formatDate } from "@/utils/shared/date.utils";
import type { CareerRunrateData } from "@/types";

interface GrowthCardProps {
  data: CareerRunrateData | null;
  isLoading: boolean;
}

export function GrowthCard({ data, isLoading }: GrowthCardProps) {
  const latestSnapshot = data?.actual?.[data.actual.length - 1];
  const nextLevel = data?.projected?.nextLevelEligibility;

  return (
    <Section>
      <Section.Header icon={<ChartLineIcon size="sm" />} title="Your Growth">
        <Link
          href="/aavahana/career-runrate"
          className="text-xs font-medium text-primary hover:underline"
        >
          View trajectory →
        </Link>
      </Section.Header>
      <Section.Body>
        {isLoading ? (
          <div className="space-y-2">
            <div className="skeleton h-5 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
          </div>
        ) : !latestSnapshot ? (
          <p className="text-sm text-base-content/60">
            Growth data appears after your first monthly report.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-base-content">
              <span className="font-semibold text-black">
                Level {latestSnapshot.level ?? "—"}
              </span>
              {" · Composite "}
              <span className="font-semibold text-black">
                {latestSnapshot.compositeScore}
              </span>
              {nextLevel && (
                <>
                  {" · On track for "}
                  <span className="font-medium text-black">{nextLevel.level}</span>
                  {" by "}
                  <span className="font-medium text-black">
                    {formatDate(nextLevel.estimatedDate, "MMM YYYY")}
                  </span>
                </>
              )}
            </p>
            {nextLevel && nextLevel.gapAreas.length > 0 && (
              <p className="text-xs text-base-content/60">
                <span className="font-medium text-base-content/80">Gaps: </span>
                {nextLevel.gapAreas.join(", ")}
              </p>
            )}
          </div>
        )}
      </Section.Body>
    </Section>
  );
}
