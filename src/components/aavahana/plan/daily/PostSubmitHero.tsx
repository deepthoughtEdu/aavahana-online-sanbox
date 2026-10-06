"use client";

import { useRouter } from "next/navigation";
import { DailyTask } from "@/types/aavahana/plan.types";
import { Button } from "@/components/shared/Button";
import { Section } from "@/components/shared/Section";
import { EmptyState } from "@/components/shared/EmptyState";
import { ChartLineIcon, CheckCircleIcon, EditIcon } from "@/components/shared/icons";
import { cn } from "@/utils";
import { formatDate } from "@/utils/shared/date.utils";
import { ROUTES } from "@/config/routes";
import { Badge } from "@/components/shared/Badge";

interface PostSubmitHeroProps {
  date: string;
  tasks: DailyTask[];
  isToday: boolean;
  onEdit?: () => void;
  /** True once the daily report has been submitted — plan is frozen for the day. */
  isLocked?: boolean;
}

export function PostSubmitHero({ date, tasks, isToday, onEdit, isLocked = false }: PostSubmitHeroProps) {
  const router = useRouter();

  const isEmpty = tasks.length === 0;
  const taskCount = tasks.length;
  const totalMins = tasks.reduce((sum, t) => sum + (t.budgetMins ?? 0), 0);
  const formattedDate = formatDate(date, "dddd, MMMM DD");

  if (isEmpty) {
    return (
      <section className="mx-auto">
        <Section
          className={cn(
            "dt-rise bg-base-100 border border-base-300 overflow-hidden",
            "rounded-2xl",
          )}
        >
          <Section.Header
            icon={<CheckCircleIcon size="md" />}
            title="No Plan Submitted"
            subtitle={formattedDate}
            size="md"
          />
          <Section.Body>
            <EmptyState
              title="No tasks planned"
              subtitle="There were no tasks planned for this day"
              icon={<CheckCircleIcon size="lg" />}
              variant="empty"
              size="md"
            />
          </Section.Body>
        </Section>
      </section>
    );
  }

  return (
    <section className="max-w-3xl mx-auto">
      <Section
        className={cn(
          "dt-rise bg-base-100 border border-base-300 overflow-hidden",
          "rounded-lg",
        )}
      >
        <Section.Header
          icon={<CheckCircleIcon size="sm" />}
          title={formattedDate}
          subtitle={`${taskCount} ${taskCount === 1 ? "task" : "tasks"} · ~${totalMins} min planned`}
          size="sm"
        />

        <Section.Body className="px-2.5 py-2.5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-base-content uppercase tracking-wider">
              Your Tasks
            </h3>
          </div>

          <div className="space-y-3 mb-6 overflow-y-auto scroll-smooth max-h-[350px]">
            {tasks.map((task, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-3 p-2",
                  "border border-base-300",
                  "rounded-lg",
                  "transition-all duration-200",
                  "group hover:bg-primary/10",
                )}
              >
                <div className="shrink-0">
                  <Badge size="sm">{index + 1}</Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-base-content">{task.text}</span>
                  {(task.budgetMins ?? 0) > 0 && (
                    <span className="text-xs dt-text-muted ml-2">{task.budgetMins} min</span>
                  )}
                  {task.isCriticalPath && (
                    <Badge variant="error" size="sm" label="CP" className="ml-2" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section.Body>

        {isToday && (
          <Section.Footer className="flex flex-col items-center gap-2">
            {isLocked && (
              <p className="text-xs dt-text-muted text-center">
                Plan locked — daily report submitted for today.
              </p>
            )}
            <div className="flex justify-center gap-2">
              {onEdit && (
                <Button
                  size="md"
                  color="primary"
                  variant="soft"
                  onClick={onEdit}
                  iconBefore={<EditIcon size="sm" />}
                >
                  Edit plan
                </Button>
              )}
              <Button
                size="md"
                color="primary"
                onClick={() => router.push(ROUTES.aavahana.dailyReport._)}
                iconBefore={<ChartLineIcon size="sm" />}
              >
                Go to Daily Report
              </Button>
            </div>
          </Section.Footer>
        )}
      </Section>
    </section>
  );
}
