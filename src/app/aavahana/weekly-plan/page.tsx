'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { Section } from '@/components/shared/Section';
import {
  CalendarIcon,
  ChevronRightIcon,
  ClockIcon,
  ListCheckIcon,
} from '@/components/shared/icons';
import { AlertCircleIcon } from '@/components/shared/icons';
import { cn } from '@/utils';
import { containerPadding } from '@/utils/shared/design.utils';
import { Button } from '@/components/shared/Button';
import { MonthlyBasketPicker } from '@/components/aavahana/weeklyplan/MonthlyBasketPicker';
import { DayGroupedTaskList } from '@/components/aavahana/weeklyplan/DayGroupedTaskList';
import { EditableItemList } from '@/components/aavahana/weeklyplan/EditableItemList';
import { AnalyticsSection } from '@/components/aavahana/analytics/AnalyticsSection';
import { useApi } from '@/lib/hooks/shared/use-api';
import { WeeklyPlanService } from '@/lib/services/aavahana/weekly-plan.service';
import { useWeeklyPlanData } from './_components/useWeeklyPlanData';
import { useWeeklyPlanEditor } from './_components/useWeeklyPlanEditor';
import { WeeklyPlanQuestions } from './_components/WeeklyPlanQuestions';

// ─── Page ────────────────────────────────────────────────────────────────────

export default function WeeklyPlanPage() {
  const router = useRouter();
  const {
    overview,
    monthlyBasketItems, serverPickedIds,
    isLoading, lastWeekAnalytics,
  } = useWeeklyPlanData();
  const editor = useWeeklyPlanEditor();
  const nothingToSave = editor.tasks.every((t) => !t.label.trim());

  // A deliverable counts as picked if it is already in the editor for this week
  // (not yet saved) OR the server already recorded it against a week. The local
  // set is what makes the picker respond immediately, before any save.
  const pickedIds = useMemo(() => {
    const local = new Set(
      editor.tasks.map((t) => t.sourceItemId).filter(Boolean) as string[],
    );
    for (const id of serverPickedIds) local.add(String(id).replace(/^monthly-/, ""));
    return Array.from(local);
  }, [editor.tasks, serverPickedIds]);

  // Trailing-constraint nudge ("you named X as your blocker N of M weeks") —
  // pure arithmetic from the backend; shown above Risks & Blockers.
  const { data: plannerContext } = useApi({
    queryKey: ['planner-context'],
    queryFn: () => WeeklyPlanService.getPlannerContext(),
  });
  const recurringBlocker = plannerContext?.recurringBlocker ?? null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-200">
        <div className="text-center">
          <div className="w-9 h-9 border-[3px] border-base-300 border-t-primary rounded-full mx-auto mb-3 animate-spin" />
          <p className="text-sm text-neutral">Loading plan…</p>
        </div>
      </div>
    );
  }

  const overcommitted = overview.plannedMinutes > 0 && overview.plannedMinutes > overview.sprintDays * 480;
  const allocPct = overview.plannedMinutes > 0
    ? Math.min(100, Math.round((overview.plannedMinutes / (overview.sprintDays * 480)) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-base-200 pb-20">
      <PageHeader
        title="Weekly Plan"
        subtitle={overview.weekLabel ? `${overview.weekLabel} · ${overview.currentDay}` : ''}
      />

      <div className="w-full space-y-4 px-4 sm:px-6 mt-4">

        {/* ─── Zone 1: Week Overview ─────────────────────────────────── */}
        <Section>
          <Section.Body>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-lg font-bold text-black">
                  {overview.tasksDone}
                  <span className="text-sm text-neutral font-normal">/{overview.totalTasks} tasks</span>
                </p>
                <p className="text-xs text-neutral">
                  {overview.qaMet}/{overview.qaTotal} QA met · {overview.streak} day streak
                </p>
              </div>
              <div className="text-right">
                {overview.constraintsOpen > 0 && (
                  <p className="text-sm font-medium text-error">
                    {overview.constraintsOpen} open constraint{overview.constraintsOpen !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Sprint day breakdown */}
            {overview.dayBreakdown.length > 0 && (
              <div className="flex gap-1 mb-2">
                {overview.dayBreakdown.map((day) => {
                  const done = day.tasks?.done ?? 0;
                  const total = day.tasks?.total ?? 0;
                  return (
                    <div
                      key={day.day}
                      className={cn(
                        'flex-1 h-7 rounded flex items-center justify-center text-xs font-medium',
                        day.day === overview.currentDay
                          ? 'bg-primary text-primary-content'
                          : done > 0 && done >= total
                            ? 'bg-success/20 text-success'
                            : total > 0
                              ? 'bg-base-300 text-neutral'
                              : 'bg-base-200 text-neutral/50'
                      )}
                      title={`${day.day}: ${done}/${total}`}
                    >
                      {day.day.replace('Day ', 'D')}
                    </div>
                  );
                })}
              </div>
            )}

            {allocPct > 0 && (
              <div>
                <div className="flex justify-between text-xs text-neutral mb-1">
                  <span>{Math.round(overview.plannedMinutes / 60)}h planned</span>
                  <span>{allocPct}% allocated</span>
                </div>
                <progress
                  className={cn(
                    'progress w-full',
                    overcommitted ? 'progress-error' : 'progress-primary'
                  )}
                  value={allocPct}
                  max="100"
                />
                {overcommitted && (
                  <p className="text-xs text-error mt-1 font-medium">
                    Overcommitted — drop or defer something
                  </p>
                )}
              </div>
            )}
          </Section.Body>
        </Section>

        {/* ─── Last Week's Time Pattern ──────────────────────────── */}
        {lastWeekAnalytics && (
          <Section>
            <Section.Header
              icon={<ClockIcon size="sm" />}
              title="Last Week's Time Pattern"
              subtitle="Before you plan this week, look at where last week's time actually went. If deep work was under 20%, you planned more than your calendar could protect. Fewer commitments with protected time blocks beat a full list that fragments."
              size="sm"
            />
            <Section.Body>
              <AnalyticsSection
                snapshot={lastWeekAnalytics}
                mode="embedded"
              />
            </Section.Body>
          </Section>
        )}

        {/* ─── Zone 2: Monthly Basket ────────────────────────────────── */}
        {monthlyBasketItems.length > 0 && (
          <Section>
            <Section.Header
              icon={<CalendarIcon size="sm" />}
              title="Monthly Plan"
              subtitle={`${pickedIds.length}/${monthlyBasketItems.length} picked this week`}
              size="sm"
            />
            <Section.Body>
              <MonthlyBasketPicker
                items={monthlyBasketItems}
                pickedIds={pickedIds}
                onPick={editor.addTaskFromMonthly}
                onUnpick={(id) =>
                  editor.removeTaskBySourceItem(String(id).replace(/^monthly-/, ""))
                }
              />
            </Section.Body>
          </Section>
        )}

        {/* ─── Forward-plan thinking questions (FE-W1.2) ─────────────── */}
        <WeeklyPlanQuestions />

        {/* ─── Zone 3: Deliverables ──────────────────────────────────── */}
        <Section>
          <Section.Header
            icon={<ListCheckIcon size="sm" />}
            title="Deliverables"
            subtitle="Your plan for this week — edit and save"
            size="sm"
          />
          <Section.Body noPadding>
            <DayGroupedTaskList
              tasks={editor.tasks}
              isGenerating={editor.isGenerating}
              isLoading={editor.isLoading}
              onUpdate={editor.updateTask}
              onUpdateDay={editor.updateTaskDay}
              onAdd={editor.addTask}
              onRemove={editor.removeTask}
            />
          </Section.Body>
        </Section>

        {/* ─── Trailing constraint nudge (pattern the system noticed) ─── */}
        {recurringBlocker && (
          <div className="rounded-lg border border-[var(--dt-amberBorder)] bg-[var(--dt-amberDim)] px-4 py-3 flex items-start gap-2">
            <AlertCircleIcon size="sm" className="text-warning mt-0.5 shrink-0" />
            <p className="text-sm text-black">{recurringBlocker}</p>
          </div>
        )}

        {/* ─── Zone 3: Risks & Blockers (editable, synced from the plan) ─── */}
        <Section>
          <Section.Header
            icon={<AlertCircleIcon size="sm" />}
            title="Risks & Blockers"
            subtitle="What could block the week — generated with your plan, editable"
            size="sm"
          />
          <Section.Body noPadding>
            <EditableItemList
              items={editor.risks}
              isGenerating={editor.isGenerating}
              isLoading={editor.isLoading}
              generatingLabel="Spotting risks…"
              emptyMessage="No risks yet — add one below, or generate a plan from “Plan Your Week”."
              placeholder="Describe a risk or blocker…"
              addLabel="Add risk"
              onUpdate={editor.updateRisk}
              onAdd={editor.addRisk}
              onRemove={editor.removeRisk}
            />
            <div className={cn('flex items-center justify-end pt-2', containerPadding.md)}>
              <Button
                color="primary"
                size="sm"
                loading={editor.isSaving}
                disabled={!editor.dirty || editor.isSaving || nothingToSave}
                onClick={editor.save}
              >
                Save plan
              </Button>
            </div>
          </Section.Body>
        </Section>

        {/* ─── Timetable CTA ─────────────────────────────────────────── */}
        <button
          onClick={() => router.push('/aavahana/timetable')}
          className={cn(
            'w-full rounded-lg bg-white border border-base-300 flex items-center justify-between group hover:border-primary transition-colors',
            containerPadding.md
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarIcon size="sm" className="text-primary" />
            </div>
            <div className="text-left">
              <span className="font-medium text-sm text-black">View timetable</span>
              <p className="text-xs text-neutral">Time blocks for each deliverable</p>
            </div>
          </div>
          <ChevronRightIcon size="sm" className="text-neutral group-hover:text-primary transition-colors" />
        </button>
      </div>
    </div>
  );
}
