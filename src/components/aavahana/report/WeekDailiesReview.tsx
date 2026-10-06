"use client";

import { Section } from "@/components/shared/Section";
import { Badge } from "@/components/shared/Badge";
import { ListCheckIcon } from "@/components/shared/icons";
import { formatDate } from "@/utils/shared/date.utils";
import { cn } from "@/utils";
import type {
  WeekDailiesResponse,
  WeekDailyEntry,
} from "@/types/aavahana/weekly-report-ai.types";

interface Props {
  data: WeekDailiesResponse | null | undefined;
  isLoading: boolean;
}

const DONE = new Set(["done", "completed", "delivered"]);
const PROGRESS = new Set(["in_progress", "pending_qa", "in-progress"]);

function statusDotClass(status: string): string {
  const s = (status || "").toLowerCase();
  if (DONE.has(s)) return "bg-success";
  if (PROGRESS.has(s)) return "bg-warning";
  return "bg-base-300";
}

/**
 * Read-only review of the week's daily reports — the SOURCE DATA the weekly
 * report is synthesised from. Shown above the Generate button so the user sees
 * exactly what the report is built from.
 */
export function WeekDailiesReview({ data, isLoading }: Props) {
  const days = data?.days ?? [];
  const submitted = data?.submittedCount ?? 0;

  return (
    <Section>
      <Section.Header
        icon={<ListCheckIcon size="sm" />}
        title="Your week, day by day"
        subtitle="The daily reports your weekly report is built from"
        size="sm"
      >
        <Badge
          variant={submitted > 0 ? "success" : "warning"}
          size="sm"
          label={`${submitted} submitted`}
        />
      </Section.Header>
      <Section.Body>
        {isLoading ? (
          <p className="text-sm text-neutral py-6 text-center">Loading your week…</p>
        ) : days.length === 0 ? (
          <p className="text-sm text-neutral py-6 text-center">
            No daily reports found for this week.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {days.map((day) => (
              <DayCard key={day.date} day={day} />
            ))}
          </div>
        )}
      </Section.Body>
    </Section>
  );
}

function DayCard({ day }: { day: WeekDailyEntry }) {
  const missing = day.status !== "submitted";

  return (
    <div
      className={cn(
        "rounded-lg border p-3 text-sm flex flex-col gap-2",
        missing ? "border-dashed border-base-300 bg-base-200/40" : "border-base-300 bg-base-100",
      )}
    >
      <div className="flex items-baseline justify-between gap-1">
        <span className="font-bold text-black">{day.weekday}</span>
        <span className="text-xs text-neutral">{formatDate(day.date, "MMM DD")}</span>
      </div>

      {missing ? (
        <p className="text-xs text-neutral italic">
          {day.status === "upcoming" ? "—" : "No report submitted"}
        </p>
      ) : day.smoothDay ? (
        <p className="text-xs text-success">Smooth day — no blocker reported.</p>
      ) : (
        <>
          {day.deliverables.length > 0 ? (
            <ul className="space-y-1">
              {day.deliverables.map((d, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span
                    className={cn(
                      "inline-block w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                      statusDotClass(d.status),
                    )}
                  />
                  <span className="text-black leading-snug">{d.title}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-neutral italic">No deliverables logged.</p>
          )}

          {day.unplannedCount > 0 && (
            <p className="text-xs text-neutral">
              +{day.unplannedCount} unplanned
            </p>
          )}

          {day.constraint && (
            <p className="text-xs text-error leading-snug">
              <span className="font-semibold">Blocked:</span> {day.constraint}
            </p>
          )}

          {day.narrative && (
            <p className="text-xs text-neutral leading-snug line-clamp-3">{day.narrative}</p>
          )}
        </>
      )}
    </div>
  );
}
