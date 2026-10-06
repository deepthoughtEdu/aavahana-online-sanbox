"use client";

import { Section } from "@/components/shared/Section";
import { DailyBreakdownItem } from "@/types";
import { CalendarIcon } from "@/components/shared/icons";

interface UnplannedWorkCalendarProps {
  data: DailyBreakdownItem[];
}

export function UnplannedWorkCalendar({ data }: UnplannedWorkCalendarProps) {
  const maxUnplanned = Math.max(...data.map((d) => d.unplanned), 1);
  const totalUnplanned = data.reduce((sum, d) => sum + d.unplanned, 0);

  const getHeatColor = (count: number) => {
    if (count === 0) return "bg-base-200 border-base-300";
    const intensity = (count / maxUnplanned) * 100;
    if (intensity >= 75)
      return "bg-primary border-primary text-primary-content";
    if (intensity >= 50)
      return "bg-primary/70 border-primary/70 text-primary-content";
    if (intensity >= 25) return "bg-primary/40 border-primary/40";
    return "bg-primary/20 border-primary/20";
  };

  const getHighestDay = () => {
    const max = Math.max(...data.map((d) => d.unplanned));
    const day = data.find((d) => d.unplanned === max);
    return day ? `${day.day} (${max})` : "None";
  };

  return (
    <Section>
      <Section.Header
        icon={<CalendarIcon />}
        title="Unplanned Work"
        subtitle={`${totalUnplanned} total unplanned tasks this week`}
      />
      <Section.Body>
        <div className="space-y-6">
          {/* Heatmap */}
          <div className="flex justify-center gap-3">
            {data.map((item) => (
              <div key={item.day} className="flex flex-col items-center gap-2">
                <div
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-lg border-2 ${getHeatColor(
                    item.unplanned
                  )} flex items-center justify-center font-bold text-xl transition-all hover:scale-110 hover:shadow-lg cursor-pointer`}
                  title={`${item.day}: ${item.unplanned} unplanned tasks`}
                >
                  {item.unplanned}
                </div>
                <div className="text-xs font-medium dt-text-muted">
                  {item.day.slice(0, 3)}
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-base-300">
            <div className="text-center p-3 bg-base-200 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {totalUnplanned}
              </div>
              <div className="text-xs dt-text-muted mt-1">
                Total Unplanned
              </div>
            </div>
            <div className="text-center p-3 bg-base-200 rounded-lg">
              <div className="text-2xl font-bold text-warning">
                {getHighestDay()}
              </div>
              <div className="text-xs dt-text-muted mt-1">
                Highest Day
              </div>
            </div>
            <div className="text-center p-3 bg-base-200 rounded-lg">
              <div className="text-2xl font-bold text-info">
                {Math.round((totalUnplanned / 7) * 10) / 10}
              </div>
              <div className="text-xs dt-text-muted mt-1">
                Daily Average
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            <span className="dt-text-muted">Intensity:</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-base-200 border border-base-300 rounded" />
              <span>None</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-primary/20 border border-primary/20 rounded" />
              <span>Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-primary/40 border border-primary/40 rounded" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-primary/70 border border-primary/70 rounded" />
              <span>High</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-primary border border-primary rounded" />
              <span>Very High</span>
            </div>
          </div>
        </div>
      </Section.Body>
    </Section>
  );
}
