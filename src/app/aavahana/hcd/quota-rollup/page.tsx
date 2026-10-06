"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/Section";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/lib/hooks/shared/use-auth";
import { UserRole } from "@/types";
import { FellowQuotaRollup } from "@/components/hcd/FellowQuotaRollup";

// W3.4 — DT-management fellow quota rollup. Per-Fellow lifecycle adherence this
// week: did each Fellow spot a new improvement and move one forward?
export default function FellowQuotaRollupPage() {
  const { hasRole } = useAuth();
  const canView = hasRole([UserRole.ADMIN, UserRole.MANAGER]);

  return (
    <div className="min-h-screen bg-base-200 pb-20">
      <PageHeader
        title="Fellow Quotas"
        label="Aavahana"
        subtitle="Per-fellow lifecycle adherence this week: new improvements spotted and stage movements"
      />
      <div className="w-full px-4 sm:px-6 mt-4">
        <Section>
          <Section.Header title="This Week" size="sm" />
          <Section.Body>
            {canView ? (
              <FellowQuotaRollup />
            ) : (
              <EmptyState
                size="sm"
                variant="info"
                title="Management view"
                subtitle="Fellow quota adherence is visible to DT-management only."
              />
            )}
          </Section.Body>
        </Section>
      </div>
    </div>
  );
}
