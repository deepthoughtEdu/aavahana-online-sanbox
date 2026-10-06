"use client";

import { Section } from "@/components/shared/Section";
import { Badge } from "@/components/shared/Badge";
import { CalendarIcon } from "@/components/shared/icons";

interface DayOverviewProps {
  taskCount: number;
  totalMins: number;
  sources: {
    weeklyBasket: number;
    eventLoop: number;
    carryover: number;
    selfAdded: number;
  };
}

export function DayOverview({ taskCount, totalMins, sources }: DayOverviewProps) {
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const timeLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const sourceBadges = [
    { label: "weekly plan", count: sources.weeklyBasket, variant: "primary" as const },
    { label: "event loop", count: sources.eventLoop, variant: "accent" as const },
    { label: "carryover", count: sources.carryover, variant: "warning" as const },
    { label: "self-added", count: sources.selfAdded, variant: "ghost" as const },
  ].filter((s) => s.count > 0);

  return (
    <Section>
      <Section.Header
        icon={<CalendarIcon size="sm" />}
        title={`${taskCount} ${taskCount === 1 ? "task" : "tasks"} · ~${timeLabel} planned`}
        size="sm"
      />
      {sourceBadges.length > 0 && (
        <Section.Body noPadding={{ y: true }}>
          <div className="flex flex-wrap gap-2 px-3 pb-3">
            {sourceBadges.map((s) => (
              <Badge key={s.label} variant={s.variant} size="sm">
                {s.count} {s.label}
              </Badge>
            ))}
          </div>
        </Section.Body>
      )}
    </Section>
  );
}
