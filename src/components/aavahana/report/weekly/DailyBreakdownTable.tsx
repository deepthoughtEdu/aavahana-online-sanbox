"use client";

import { Section } from "@/components/shared/Section";
import { Badge } from "@/components/shared/Badge";
import { DailyBreakdownItem } from "@/types";
import { TableIcon } from "lucide-react";
import { cn, gaps } from "@/utils";

interface DailyBreakdownTableProps {
  data: DailyBreakdownItem[];
}

export function DailyBreakdownTable({ data }: DailyBreakdownTableProps) {
  const totals = data.reduce(
    (acc, item) => ({
      planned: acc.planned + item.planned,
      completed: acc.completed + item.completed,
      backlog: acc.backlog + item.backlog,
      unplanned: acc.unplanned + item.unplanned,
    }),
    { planned: 0, completed: 0, backlog: 0, unplanned: 0 }
  );

  const completionRate =
    totals.planned > 0
      ? Math.round((totals.completed / totals.planned) * 100)
      : 0;

  return (
    <Section>
      <Section.Header
        icon={<TableIcon />}
        title="Daily Breakdown"
        subtitle="Plan vs Actuals by day"
        size="sm"
      />
      <Section.Body noPadding>
        <div className="overflow-x-auto">
          <table className="table table-zebra table-sm">
            <thead>
              <tr>
                <th>Day</th>
                <th className="text-center">Planned</th>
                <th className="text-center">Completed</th>
                <th className="text-center">Backlog</th>
                <th className="text-center">Unplanned</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.day}>
                  <td className="font-medium">{item.day}</td>
                  <td className="text-center">
                    {item.planned > 0 ? (
                      <Badge
                        label={item.planned.toString()}
                        variant="info"
                        size="sm"
                      />
                    ) : (
                      <span className="dt-text-dim">0</span>
                    )}
                  </td>
                  <td className="text-center">
                    {item.completed > 0 ? (
                      <Badge
                        label={item.completed.toString()}
                        variant="success"
                        size="sm"
                      />
                    ) : (
                      <span className="dt-text-dim">0</span>
                    )}
                  </td>
                  <td className="text-center">
                    {item.backlog > 0 ? (
                      <Badge
                        label={item.backlog.toString()}
                        variant="error"
                        size="sm"
                      />
                    ) : (
                      <span className="dt-text-dim">0</span>
                    )}
                  </td>
                  <td className="text-center">
                    {item.unplanned > 0 ? (
                      <Badge
                        label={item.unplanned.toString()}
                        variant="warning"
                        size="sm"
                      />
                    ) : (
                      <span className="dt-text-dim">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td>Total</td>
                <td className="text-center">
                  <Badge
                    label={totals.planned.toString()}
                    variant="info"
                    size="sm"
                  />
                </td>
                <td className="text-center">
                  <Badge
                    label={totals.completed.toString()}
                    variant="success"
                    size="sm"
                  />
                </td>
                <td className="text-center">
                  <Badge
                    label={totals.backlog.toString()}
                    variant="error"
                    size="sm"
                  />
                </td>
                <td className="text-center">
                  <Badge
                    label={totals.unplanned.toString()}
                    variant="warning"
                    size="sm"
                  />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Completion Rate Footer */}
        <div
          className={cn("px-4 py-3 bg-base-200/50 border-t border-base-300")}
        >
          <div className="flex items-center justify-between text-sm">
            <span className="dt-text-muted">Completion Rate</span>
            <div className={cn("flex items-center", gaps.sm)}>
              <div className="w-32 h-2 bg-base-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-success transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <span className="font-bold text-success">{completionRate}%</span>
            </div>
          </div>
        </div>
      </Section.Body>
    </Section>
  );
}
