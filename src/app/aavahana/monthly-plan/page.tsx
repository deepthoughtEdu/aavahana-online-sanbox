'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/shared/Badge';
import { useMonthlyPlan } from '@/lib/hooks/aavahana/use-monthly-plan';
import { MonthOverview } from './_components/MonthOverview';
import { DeliverablesCurator } from './_components/DeliverablesCurator';
import { IPGoalsSection } from './_components/IPGoalsSection';
import { KPITargetsSection } from './_components/KPITargetsSection';
import { PlanSubmitSection } from './_components/PlanSubmitSection';
import { RecurringEventsSection } from './_components/RecurringEventsSection';
import { LastMonthContext } from './_components/LastMonthContext';
import { PlanFeedbackPanel } from './_components/PlanFeedbackPanel';

function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-');
  const names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${names[parseInt(m, 10) - 1] || m} ${y}`;
}

export default function MonthlyPlanPage() {
  const now = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const month = (() => {
    const d = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  const {
    plan,
    isLoading,
    error,
    basketItems,
    carryovers,
    programKPIs,
    ipItems,
    deliverables,
    ipGoals,
    acceptBasketItem,
    acceptCarryover,
    deferDeliverable,
    dropDeliverable,
    addDeliverable,
    updateEstimate,
    updateDeliverable,
    kpiTargets,
    setKpiTarget,
    feedback,
    context,
    addIPGoal,
    removeIPGoal,
    updateIPGoal,
    recurringEvents,
    weeklyRecurringHours,
    addRecurringEvent,
    updateRecurringEvent,
    removeRecurringEvent,
    submitPlan,
    isSubmitting,
  } = useMonthlyPlan(month);

  const monthLabel = formatMonthLabel(month);
  const status = plan?.status ?? 'draft';
  const isLocked = status === 'submitted' || status === 'locked';

  const statusVariant = {
    draft: 'warning' as const,
    submitted: 'success' as const,
    locked: 'info' as const,
  };

  const acceptedDeliverables = deliverables.filter(d => d.status === 'accepted' || d.status === 'deferred');
  const plannedHours = deliverables
    .filter(d => d.status === 'accepted')
    .reduce((sum, d) => sum + d.estimatedHours, 0);
  const carryoverHours = carryovers.reduce((sum, c) => sum + c.estimatedHours, 0);
  const workingDays = plan?.workingDays ?? 22;
  const rawAvailableHours = plan?.availableHours ?? workingDays * 8;
  const weeksInMonth = Math.ceil(workingDays / 5);
  const monthlyRecurringHours = Math.round(weeklyRecurringHours * weeksInMonth * 10) / 10;
  const availableHours = rawAvailableHours - monthlyRecurringHours;

  return (
    <div className="min-h-screen bg-base-200 pb-20">
      <PageHeader title="Monthly Plan" subtitle={monthLabel}>
        <Badge variant={statusVariant[status]} label={status} size="sm" />
      </PageHeader>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      )}

      {error && !isLoading && (
        <div className="text-center py-20 text-error">{error}</div>
      )}

      {!isLoading && !error && (
        <div className="w-full space-y-4 px-4 sm:px-6 mt-4">
          {/* Zone 1: Month Overview */}
          <MonthOverview
            monthLabel={monthLabel}
            workingDays={workingDays}
            availableHours={availableHours}
            plannedHours={plannedHours}
            carryoverCount={carryovers.length}
            carryoverHours={carryoverHours}
            status={status}
            onPrev={() => setMonthOffset((p) => p - 1)}
            onNext={() => setMonthOffset((p) => p + 1)}
          />

          {/* Zone 1.5: last month's signals — awareness, not inputs */}
          <LastMonthContext context={context} />

          {/* Zone 2: Deliverables Curator */}
          <DeliverablesCurator
            basketItems={basketItems}
            carryovers={carryovers}
            accepted={acceptedDeliverables}
            disabled={isLocked}
            onAcceptBasketItem={acceptBasketItem}
            onAcceptCarryover={acceptCarryover}
            onDefer={deferDeliverable}
            onDrop={dropDeliverable}
            onAdd={addDeliverable}
            onUpdateEstimate={updateEstimate}
            onUpdateDeliverable={updateDeliverable}
          />

          {/* Zone 2.5: Recurring Events */}
          <RecurringEventsSection
            events={recurringEvents}
            disabled={isLocked}
            weeklyHours={weeklyRecurringHours}
            weeksInMonth={weeksInMonth}
            availableHoursAfterRecurring={availableHours}
            onAdd={addRecurringEvent}
            onUpdate={updateRecurringEvent}
            onRemove={removeRecurringEvent}
          />

          {/* Zone 3: IP Goals + KPI Targets */}
          <IPGoalsSection
            goals={ipGoals}
            disabled={isLocked}
            ipItems={ipItems}
            onAdd={addIPGoal}
            onRemove={removeIPGoal}
            onUpdate={updateIPGoal}
          />

          <KPITargetsSection
            kpis={programKPIs}
            targets={kpiTargets}
            onSetTarget={setKpiTarget}
            disabled={isLocked}
          />

          {/* Zone 3.5: physics feedback on the plan as it stands */}
          <PlanFeedbackPanel flags={feedback} />

          {/* Zone 4: Submit */}
          <PlanSubmitSection
            deliverableCount={deliverables.filter(d => d.status === 'accepted').length}
            plannedHours={plannedHours}
            availableHours={availableHours}
            ipGoalCount={ipGoals.length}
            kpiCount={programKPIs.length}
            status={status}
            onSubmit={submitPlan}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
    </div>
  );
}
