// src/components/aavahana/dashboard/DashboardContainer.tsx
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { useUBS } from "@/lib/hooks/aavahana/use-ubs";
import { useCareerRunrate } from "@/lib/hooks/aavahana/use-career-runrate";
import { useApi } from "@/lib/hooks/shared/use-api";
import { useEventLoopBadge } from "@/lib/hooks/shared/use-event-loop";
import { PlanService } from "@/lib/services";
import { startOf } from "@/utils/shared/date.utils";
import { TodayPulse } from "./TodayPulse";
import { TodayPlanSection } from "./TodayPlanSection";
import { DrillsThisWeek } from "./DrillsThisWeek";
import { GrowthCard } from "./GrowthCard";
import { QuickLinks } from "./QuickLinks";
import type { DailyTask } from "@/types";

const TODAY_ISO = startOf(new Date(), "day", "format", "YYYY-MM-DD") as string;

export function DashboardContainer() {
  const { currentScore, isLoading: ubsLoading } = useUBS();
  const { data: careerData, isLoading: careerLoading } = useCareerRunrate();
  const { data: badgeData } = useEventLoopBadge();
  const { data: tasks = [] as DailyTask[], isLoading: planLoading } = useApi({
    queryFn: () => PlanService.getDailyPlan(TODAY_ISO),
    queryKey: ["daily-plan", TODAY_ISO],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        label="Aavahana"
        subtitle="Start here. See where your day stands, what needs focus, and how your habits are building."
      />
      <TodayPulse tasks={tasks} isLoading={planLoading} openEventLoopCount={badgeData?.count} />
      <TodayPlanSection tasks={tasks} isLoading={planLoading} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DrillsThisWeek score={currentScore} isLoading={ubsLoading} />
        <GrowthCard data={careerData} isLoading={careerLoading} />
      </div>
      <QuickLinks />
    </div>
  );
}
