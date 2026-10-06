'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Section } from '@/components/shared/Section';
import { Badge } from '@/components/shared/Badge';
import { AnalyticsSection } from '@/components/aavahana/analytics/AnalyticsSection';
import { CareerRunrateContainer } from '@/components/aavahana/career-runrate/CareerRunrateContainer';
import { UBSWidget } from '@/components/aavahana/ubs/UBSWidget';
import { HappinessSubmitSection } from '@/app/aavahana/weekly-report/_components/HappinessSubmitSection';
import { NarrativeSection } from '@/app/aavahana/weekly-report/_components/NarrativeSection';
import { useMonthlyReportPageData } from './_components/useMonthlyReportPageData';
import { MonthOverview } from './_components/MonthOverview';
import { ContributionsSummary } from './_components/ContributionsSummary';
import { KPIInput } from './_components/KPIInput';
import { CapabilitySummary } from './_components/CapabilitySummary';
import { ConstraintPatterns } from './_components/ConstraintPatterns';
import { LeadershipPortfolio } from './_components/LeadershipPortfolio';
import { UnplannedSummaryPanel } from './_components/UnplannedSummaryPanel';

function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-');
  const names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${names[parseInt(m, 10) - 1] || m} ${y}`;
}

export default function MonthlyReportPage() {
  const now = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const month = (() => {
    const d = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  const {
    report,
    kpiCommits,
    narrative,
    happiness,
    setHappiness,
    constraintPatterns,
    portfolio,
    isSubmitting,
    updateKPICommit,
    submitReport,
    ubs,
    runrateData,
    snapshots,
    isLoading,
    error,
  } = useMonthlyReportPageData(month);

  const monthLabel = formatMonthLabel(month);
  const status = report?.status ?? 'draft';
  const isLocked = status === 'submitted' || status === 'locked';

  const statusVariant = {
    draft: 'warning' as const,
    submitted: 'success' as const,
    locked: 'info' as const,
  };

  const weeklySubmitted = report?.weeklySummaries.filter((w) => w.submitted).length ?? 0;
  const weeklyTotal = report?.weeklySummaries.length ?? 0;
  const missingDaysList = report?.missingDays ?? [];
  const dailyTotal = 22;
  const dailySubmitted = dailyTotal - missingDaysList.length;

  return (
    <div className="min-h-screen bg-base-200 pb-20">
      <PageHeader title="Monthly Report" subtitle={monthLabel}>
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

      {!isLoading && !error && report && (
        <div className="w-full space-y-4 px-4 sm:px-6 mt-4">
          {/* Section 1: Month Overview */}
          <MonthOverview
            monthLabel={monthLabel}
            weeklySubmitted={weeklySubmitted}
            weeklyTotal={weeklyTotal}
            dailySubmitted={dailySubmitted}
            dailyTotal={dailyTotal}
            status={status}
            missingDays={missingDaysList}
            onPrev={() => setMonthOffset((p) => p - 1)}
            onNext={() => setMonthOffset((p) => p + 1)}
          />

          {/* Section 2: Contributions — Deliverables + IP */}
          <ContributionsSummary
            deliverables={report.axisSummaries.deliverables}
            ip={report.axisSummaries.ip}
            weeklySummaries={report.weeklySummaries}
            carryoverTrend={report.carryoverTrend}
          />

          {/* Section A2: what displaced the plan */}
          <UnplannedSummaryPanel unplanned={report.unplanned} />

          {/* Section 3: KPIs (employee input) */}
          <KPIInput
            kpiCommits={kpiCommits}
            onUpdate={updateKPICommit}
            disabled={isLocked}
          />

          {/* Section 4: Capabilities — Frameworks + Processes + Rituals */}
          <CapabilitySummary
            frameworks={report.axisSummaries.frameworks}
            processes={report.axisSummaries.processes}
            rituals={report.axisSummaries.rituals}
          />

          {/* Section 5: UBS */}
          {ubs.currentScore && (
            <Section>
              <Section.Header title="UBS Engagement" />
              <Section.Body>
                <UBSWidget
                  score={ubs.currentScore.score}
                  maxPossible={ubs.currentScore.maxPossible}
                  percentage={ubs.percentage}
                  trend={ubs.trend?.weeks}
                  showLink={false}
                />
              </Section.Body>
            </Section>
          )}

          {/* Section 6: Constraint Patterns */}
          <Section>
            <Section.Header title="Constraint Patterns" />
            <Section.Body>
              <ConstraintPatterns data={constraintPatterns} />
            </Section.Body>
          </Section>

          {/* Section 7: Analytics */}
          <Section>
            <Section.Header title="Time & Analytics" />
            <Section.Body>
              <AnalyticsSection snapshot={report.analyticsSnapshot ?? null} mode="embedded" />
            </Section.Body>
          </Section>

          {/* Section 8: Leadership Portfolio */}
          <Section>
            <Section.Header title="Leadership Portfolio" />
            <Section.Body>
              <LeadershipPortfolio portfolio={portfolio} isSubmitted={isLocked} />
            </Section.Body>
          </Section>

          {/* Section 9: Career Runrate */}
          <Section>
            <Section.Header title="Career Runrate" />
            <Section.Body>
              <CareerRunrateContainer data={runrateData} snapshots={snapshots} />
            </Section.Body>
          </Section>

          {/* Section 10: Happiness + Submit */}
          <Section>
            <Section.Body>
              <HappinessSubmitSection
                status={status}
                happiness={happiness}
                setHappiness={setHappiness}
                onSubmit={submitReport}
                isSubmitting={isSubmitting}
              />
            </Section.Body>
          </Section>

          {/* Narrative (appears after submit) */}
          {narrative && (
            <Section>
              <Section.Body>
                <NarrativeSection narrative={narrative} />
              </Section.Body>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}
