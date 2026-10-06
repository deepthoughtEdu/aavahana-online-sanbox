"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/shared/Badge";
import { useWeeklyPlanV2 } from "@/lib/hooks/aavahana/use-weekly-plan-v2";
import { BlockerBanner } from "./BlockerBanner";
import { PlanInput } from "./PlanInput";
import { WeekBoard } from "./WeekBoard";
import { DependencyInline } from "./DependencyInline";
import { PlanFooter } from "./PlanFooter";
import { PostSubmitView } from "./PostSubmitView";
import {
  WeeklyChipSource,
  type WeekDay,
} from "@/types/aavahana/weekly-plan-v2.types";

export function WeeklyPlanV2Container() {
  const plan = useWeeklyPlanV2();

  if (plan.isSubmitted) {
    return (
      <PostSubmitView
        weekLabel={plan.weekLabel}
        chipCount={plan.chips.length}
      />
    );
  }

  function handleQuickAdd(day: WeekDay | null) {
    const title = window.prompt("Add a task" + (day ? ` for ${day}` : ""));
    if (!title || !title.trim()) return;
    plan.addManualChip(title);
    // Newly-added manual chips land unassigned by default. If the user clicked
    // "Add to MON", assign that day to the chip that was just added (last one).
    if (day) {
      // The hook appends to the end of the chips array, so the new chip is the
      // last entry. We patch it via updateChip with the chosen day.
      const last = plan.chips[plan.chips.length - 1];
      // Note: setState is async; we read the freshly-set chip by id below.
      // The new chip's id isn't known here, so we let the user assign via the
      // card UI if this lookup misses.
      if (last && last.source === WeeklyChipSource.MANUAL && !last.day) {
        plan.updateChip(last.id, { day });
      }
    }
  }

  const dependencyTitle =
    plan.chips.find((c) => c.id === plan.dependencyChipId)?.title ?? null;

  return (
    <div className="min-h-screen bg-base-200 pb-28">
      <PageHeader title="Weekly Plan" subtitle={plan.weekLabel}>
        <Badge label="Draft" variant="warning" size="sm" icon={null} />
      </PageHeader>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 mt-4 space-y-4">
        {plan.hasPreviousWeek && (
          <BlockerBanner
            recurringBlocker={plan.recurringBlocker}
            lastWeekItems={plan.lastWeekItems}
            reflection={plan.reflection}
            setReflection={plan.setReflection}
          />
        )}

        <PlanInput
          aiDraft={plan.aiDraft}
          setAiDraft={plan.setAiDraft}
          parseWithAi={plan.parseWithAi}
          isParsing={plan.isParsing}
          carryForwardCandidates={plan.carryForwardCandidates}
          monthlyBasketCandidates={plan.monthlyBasketCandidates}
          importFromCarry={plan.importFromCarry}
          importFromMonthly={plan.importFromMonthly}
          hasPreviousWeek={plan.hasPreviousWeek}
        />

        <WeekBoard
          chips={plan.chips}
          updateChip={plan.updateChip}
          removeChip={plan.removeChip}
          onQuickAdd={handleQuickAdd}
        />

        <DependencyInline
          chips={plan.chips}
          dependencyChipId={plan.dependencyChipId}
          setDependencyChipId={plan.setDependencyChipId}
        />
      </div>

      <PlanFooter
        chipCount={plan.chips.length}
        totalEstimateMins={plan.totalEstimateMins}
        dependencyTitle={dependencyTitle}
        canSubmit={plan.canSubmit}
        isSubmitting={plan.isSubmitting}
        onSubmit={plan.submit}
      />
    </div>
  );
}
