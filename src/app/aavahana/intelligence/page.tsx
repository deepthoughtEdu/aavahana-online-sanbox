"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/Section";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConstraintTable } from "@/components/intelligence/ConstraintTable";
import { ConstraintDetailModal } from "@/components/intelligence/ConstraintDetailModal";
import { useMyInsights, useDetectInsights } from "@/lib/hooks/intelligence/use-intelligence";
import type { HcdInsight } from "@/types/intelligence/intelligence.types";

const PER_PAGE = 20;

export default function MyIntelligencePage() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<HcdInsight | null>(null);

  const detect = useDetectInsights();
  const q = useMyInsights({ signalType: "constraint", page, perPage: PER_PAGE });
  const insights = (q.data as HcdInsight[] | undefined) ?? [];
  const pagination = q.pagination;

  return (
    <>
      <div className="space-y-6 pb-8">
        <PageHeader
          title="My Constraints"
          subtitle="Constraints detected from your plans and reports, with suggested improvements"
        >
          <Button color="primary" size="sm" loading={detect.isPending} onClick={() => detect.mutate({})}>
            Refresh
          </Button>
        </PageHeader>

        <Section>
          <Section.Header title="Detected constraints" subtitle="Tap a constraint to see the suggested improvement" />
          <Section.Body>
            {q.isLoading ? (
              <div className="py-12 text-center text-neutral">
                <span className="loading loading-spinner" /> Loading…
              </div>
            ) : q.isError ? (
              <EmptyState variant="error" title="Couldn't load your constraints" subtitle="Please try again." />
            ) : (
              <>
                <ConstraintTable insights={insights} onSelect={setSelected} showEmployee={false} />
                {pagination && pagination.pageCount > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <span className="text-sm text-neutral">
                      Page {pagination.currentPage} of {pagination.pageCount}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        color="neutral"
                        variant="outline"
                        size="sm"
                        disabled={!pagination.prev.active}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        color="neutral"
                        variant="outline"
                        size="sm"
                        disabled={!pagination.next.active}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Section.Body>
        </Section>
      </div>

      <ConstraintDetailModal
        insight={selected}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        readOnly
      />
    </>
  );
}
