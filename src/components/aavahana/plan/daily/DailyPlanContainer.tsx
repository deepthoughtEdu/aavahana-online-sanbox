"use client";

import { useEffect, useRef, useState } from "react";
import { useDailyPlan } from "@/lib/hooks/aavahana/use-daily-plan";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { DayNavigator } from "@/components/shared/DayNavigator";
import { EmptyState } from "@/components/shared/EmptyState";
import { CalendarIcon } from "@/components/shared/icons";
import { DayOverview } from "./DayOverview";
import { BasketPicker } from "./BasketPicker";
import { TodayTasksList } from "./TodayTasksList";
import { PlanSubmitSection } from "./PlanSubmitSection";
import { ContextPanels } from "./ContextPanels";
import { PostSubmitHero } from "./PostSubmitHero";
import { WorkloadBar } from "./WorkloadBar";
import { GrowthPlant } from "@/components/aavahana/GrowthPlant";
import { OverlayLoading } from "@/components/shared/OverlayLoading";
import { formatDate } from "@/utils/shared/date.utils";
import { TourHelpButton } from "@/components/shared/TourHelpButton";
import { createDailyPlanTour } from "@/lib/tours/daily-plan.tour";
import type { Tour } from "@/lib/managers/tour";
import { useApi } from "@/lib/hooks/shared/use-api";
import { ReportV7Service } from "@/lib/services/aavahana/report-v7.service";

export function DailyPlanContainer() {
  const plan = useDailyPlan();
  const tourRef = useRef<Tour | null>(null);
  // Re-edit toggle: when the plan is already submitted for today, the hero
  // shows an "Edit plan" button that flips this to true, unlocking the same
  // editor used before submission. Resetting on date-change keeps a stale
  // edit mode from leaking into another day.
  const [isEditing, setIsEditing] = useState(false);

  // Once the daily report has been submitted for a date, the plan for that
  // day is locked — the report freezes the day's commitments. The live report
  // screen is the V7 conversation engine, which records submission in the V7
  // draft row (status === "submitted") — NOT the legacy daily-plan report
  // shape. We surface the lock by hiding "Edit plan" and showing "Locked".
  const { data: v7Draft } = useApi({
    queryFn: () => ReportV7Service.getDraft(plan.currentDate),
    queryKey: ["v7-draft", plan.currentDate],
  });
  const isReportSubmitted = v7Draft?.status === "submitted";
  const isPlanLocked = plan.isPlanSubmitted && isReportSubmitted;

  useEffect(() => {
    setIsEditing(false);
  }, [plan.currentDate]);

  // If the report gets submitted while the user is mid-edit, kick them out
  // of edit mode immediately so they can't keep changing a now-locked plan.
  useEffect(() => {
    if (isPlanLocked && isEditing) setIsEditing(false);
  }, [isPlanLocked, isEditing]);

  useEffect(() => {
    tourRef.current = createDailyPlanTour();
    tourRef.current.start();
    return () => {
      tourRef.current?.forceDestroy();
    };
  }, []);

  if (plan.isLoading) return <OverlayLoading />;

  const dayLabel = formatDate(plan.currentDate, "dddd, MMMM DD YYYY");

  if (plan.isPlanSubmitted && !isEditing) {
    return (
      <div>
        <PageHeader
          title={plan.isToday ? "Daily Plan" : "Past Plan"}
          subtitle={dayLabel}
        >
          <div className="flex items-center gap-2">
            <GrowthPlant />
            <DayNavigator
              currentDate={plan.currentDate}
              todayISO={plan.todayISO}
              onPrev={plan.goToPrevDay}
              onNext={plan.goToNextDay}
              onJump={plan.jumpToDate}
            />
            <Badge
              variant={isPlanLocked ? "neutral" : "success"}
              size="sm"
              label={isPlanLocked ? "Locked" : "Submitted"}
            />
          </div>
        </PageHeader>
        <PostSubmitHero
          date={plan.currentDate}
          tasks={plan.todayTasks}
          isToday={plan.isToday}
          onEdit={
            plan.isToday && !isPlanLocked ? () => setIsEditing(true) : undefined
          }
          isLocked={isPlanLocked}
        />
      </div>
    );
  }

  // Past day with no plan on record — read-only empty state. You can only
  // create/edit a plan for today, so a missing past plan just gets reviewed.
  if (!plan.isToday) {
    return (
      <div>
        <PageHeader title="Past Plan" subtitle={dayLabel}>
          <div className="flex items-center gap-2">
            <GrowthPlant />
            <DayNavigator
              currentDate={plan.currentDate}
              todayISO={plan.todayISO}
              onPrev={plan.goToPrevDay}
              onNext={plan.goToNextDay}
              onJump={plan.jumpToDate}
            />
          </div>
        </PageHeader>
        <div className="px-4 sm:px-6 mt-6">
          <EmptyState
            icon={<CalendarIcon size="lg" />}
            title="No plan for this day"
            subtitle={`${formatDate(
              plan.currentDate,
              "dddd, MMMM DD",
            )} has no submitted daily plan. Use the arrows above to review another day.`}
            variant="empty"
            size="md"
          >
            <Button
              color="primary"
              variant="soft"
              size="sm"
              onClick={() => plan.jumpToDate(plan.todayISO)}
            >
              Back to today
            </Button>
          </EmptyState>
        </div>
      </div>
    );
  }

  // When editing a previously-submitted plan, the same submit handler
  // re-saves it; we collapse back to the read-only hero on success.
  const handleSubmit = async () => {
    await plan.submitPlan();
    if (isEditing) setIsEditing(false);
  };

  return (
    <div>
      <PageHeader
        title={isEditing ? "Edit Daily Plan" : "Daily Plan"}
        subtitle={dayLabel}
      >
        <div className="flex items-center gap-2">
          <GrowthPlant />
          <DayNavigator
            currentDate={plan.currentDate}
            todayISO={plan.todayISO}
            onPrev={plan.goToPrevDay}
            onNext={plan.goToNextDay}
            onJump={plan.jumpToDate}
            prevId="tour-plan-prev-day"
            nextId="tour-plan-next-day"
          />
          {isEditing && (
            <Button
              variant="ghost"
              color="secondary"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          )}
          <span id="tour-plan-status-badge">
            <Badge
              variant={
                isPlanLocked
                  ? "neutral"
                  : isEditing
                    ? "warning"
                    : plan.isPlanSubmitted
                      ? "success"
                      : "warning"
              }
              size="sm"
              label={
                isPlanLocked
                  ? "Locked"
                  : isEditing
                    ? "Editing"
                    : plan.isPlanSubmitted
                      ? "Submitted"
                      : "Draft"
              }
            />
          </span>
        </div>
      </PageHeader>

      <div className="w-full space-y-4 px-4 sm:px-6 mt-4">
        <WorkloadBar totalMins={plan.plannedMins} />
        <div id="tour-day-overview">
          <DayOverview
            taskCount={plan.todayTasks.length}
            totalMins={plan.plannedMins}
            sources={{
              weeklyBasket: plan.todayTasks.filter(
                (t) => t.source === "weekly_basket",
              ).length,
              eventLoop: plan.todayTasks.filter(
                (t) => t.source === "event_loop",
              ).length,
              carryover: plan.todayTasks.filter((t) => t.source === "yesterday")
                .length,
              selfAdded: plan.todayTasks.filter((t) => t.source === "manual")
                .length,
            }}
          />
        </div>

        <div id="tour-basket-picker">
          <BasketPicker
            weeklyItems={plan.weeklyBasketItems}
            eventLoopItems={plan.eventLoopItems}
            onPick={plan.pickFromBasket}
          />
        </div>

        <div id="tour-today-tasks">
          <TodayTasksList
            tasks={plan.todayTasks}
            onRemove={plan.removeTask}
            onUpdate={plan.updateTask}
            onMarkCriticalPath={plan.markCriticalPath}
            onUpdateEstimate={plan.updateEstimate}
            onAdd={plan.addTask}
          />
        </div>

        <div id="tour-context-panels">
          <ContextPanels
            yesterdayCarryovers={plan.yesterdayCarryovers}
            onAddCarryover={(task) =>
              plan.addTask({ ...task, source: "yesterday" })
            }
          />
        </div>

        <div id="tour-plan-submit">
          <PlanSubmitSection
            taskCount={plan.todayTasks.length}
            totalMins={plan.todayTasks.reduce(
              (sum, t) => sum + (t.budgetMins ?? 0),
              0,
            )}
            onSubmit={handleSubmit}
            isSubmitting={plan.isSubmitting}
            disabled={plan.todayTasks.length === 0}
            submitLabel={isEditing ? "Save changes" : undefined}
          />
        </div>
      </div>

      <TourHelpButton
        onClick={() => tourRef.current?.start(true)}
        tooltip="Take a tour of the Daily Plan screen"
      />
    </div>
  );
}
