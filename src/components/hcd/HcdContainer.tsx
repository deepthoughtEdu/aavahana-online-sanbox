"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, type Tab } from "@/components/shared/Tabs";
import { EmptyState } from "@/components/shared/EmptyState";
import { useBlockList, useBlock } from "@/lib/hooks/hcd/use-block";
import { useAuth } from "@/lib/hooks/shared/use-auth";
import { UserRole } from "@/types";
import { BlockAssessment } from "@/components/hcd/BlockAssessment";
import { DrillPanel } from "@/components/hcd/DrillPanel";
import { PromptCopy } from "@/components/hcd/PromptCopy";
import { HcdChat } from "@/components/hcd/HcdChat";
import { IdeaBoard } from "@/components/hcd/IdeaBoard";
import { FellowQuotaPanel } from "@/components/hcd/FellowQuotaPanel";
import { RecognitionView } from "@/components/hcd/RecognitionView";
import { FlowGuide } from "@/components/hcd/FlowGuide";
import { CohortView } from "@/components/hcd/CohortView";
import { MetricsView } from "@/components/hcd/MetricsView";
import { TacitKnowledgeView } from "@/components/hcd/TacitKnowledgeView";
import { ProgressStrip } from "@/components/hcd/ProgressStrip";
import type { BlockListItem } from "@/lib/services/hcd/block.service";

type HcdTab =
  | "Assess"
  | "Apply"
  | "Innovate"
  | "Prove"
  | "Cohort"
  | "Metrics"
  | "Tacit Knowledge";

const TAB_ITEMS: Tab<HcdTab>[] = [
  { key: "Assess", label: "1 · Assess" },
  { key: "Apply", label: "2 · Apply" },
  { key: "Innovate", label: "3 · Innovate" },
  { key: "Prove", label: "4 · Prove" },
];

// Appended for managers and admins, in order, after the four Fellow tabs.
const OVERSIGHT_TAB_ITEMS: Tab<HcdTab>[] = [
  { key: "Cohort", label: "Cohort" },
  { key: "Metrics", label: "Metrics" },
  { key: "Tacit Knowledge", label: "Tacit Knowledge" },
];

const FRAMEWORKS_COLLAPSED_COUNT = 2;

function AssessTab({
  openBlockId,
  setOpenBlockId,
}: {
  openBlockId: number | null;
  setOpenBlockId: (id: number | null) => void;
}) {
  const { data: blocks, isLoading } = useBlockList();
  // Show a small set by default — the full library is a lot of cards at once.
  const [showAll, setShowAll] = useState(false);

  if (openBlockId) {
    return (
      <BlockView blockId={openBlockId} onBack={() => setOpenBlockId(null)} />
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }

  if (!blocks?.length) {
    return (
      <EmptyState
        title="No assessment blocks yet"
        subtitle="Seed HCD content to make assessment blocks available."
      />
    );
  }

  const hasMore = blocks.length > FRAMEWORKS_COLLAPSED_COUNT;
  const visibleBlocks =
    showAll || !hasMore ? blocks : blocks.slice(0, FRAMEWORKS_COLLAPSED_COUNT);
  const hiddenCount = blocks.length - FRAMEWORKS_COLLAPSED_COUNT;

  return (
    <div className="space-y-6">
      <div id="hcd-blocks" className="space-y-3">
        {hasMore && (
          <div className="flex items-center justify-end">
            <button
              onClick={() => setShowAll((v) => !v)}
              className="btn btn-ghost btn-sm gap-1"
            >
              {showAll ? (
                <>
                  Show less
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  Show all {blocks.length} frameworks
                  <span className="text-xs dt-text-dim">+{hiddenCount}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {visibleBlocks.map((block) => (
            <BlockCard
              key={block.id}
              block={block}
              onSelect={() => setOpenBlockId(block.id)}
            />
          ))}
        </div>
      </div>
      <div id="hcd-drills">
        <DrillPanel />
      </div>
    </div>
  );
}

function BlockCard({
  block,
  onSelect,
}: {
  block: BlockListItem;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="card bg-base-100 border border-base-300 hover:border-primary/40 transition-colors cursor-pointer text-left"
    >
      <div className="card-body p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium dt-text-dim uppercase tracking-wide">
              {block.frameworkName}
            </p>
            <h4 className="font-semibold mt-1">{block.name}</h4>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {block.completed && (
              <span className="badge badge-success badge-sm gap-1">
                ✓ Completed
              </span>
            )}
            <span className="badge badge-ghost badge-sm">
              {block.questionCount} Qs
            </span>
          </div>
        </div>
        {block.sourceTitle && (
          <p className="text-sm dt-text-dim mt-2 line-clamp-2">
            {block.sourceTitle}
          </p>
        )}
        {block.gridCellsCovered?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {block.gridCellsCovered.map((cell) => (
              <span key={cell} className="badge badge-outline badge-xs">
                {cell}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

function BlockView({
  blockId,
  onBack,
}: {
  blockId: number;
  onBack: () => void;
}) {
  const { data: block, isLoading } = useBlock(blockId);
  const qc = useQueryClient();

  // Opening a block creates its assessment attempt ("started" in Metrics) and
  // completing it writes a streak event server-side. Refresh progress, the
  // block list (completion badge) and metrics when the learner returns.
  const handleBack = () => {
    qc.invalidateQueries({ queryKey: ["hcd", "progress"] });
    qc.invalidateQueries({ queryKey: ["hcd", "blocks"] });
    qc.invalidateQueries({ queryKey: ["hcd", "recognition", "cohort"] });
    onBack();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }

  if (!block) {
    return (
      <div className="text-center py-12 dt-text-dim">Block not found.</div>
    );
  }

  // The assessment fills the content area itself, so it carries the way out.
  return (
    <BlockAssessment
      block={block}
      contextId={blockId}
      requireReflection
      header={
        <button onClick={handleBack} className="btn btn-ghost btn-sm gap-1">
          <span className="text-lg leading-none">&larr;</span>
          All blocks
        </button>
      }
    />
  );
}

export function HcdContainer() {
  const [tab, setTab] = useState<HcdTab>("Assess");
  const [openBlockId, setOpenBlockId] = useState<number | null>(null);
  const { data: blocks } = useBlockList();

  // Deep-link from a constraint-spotting notification (?tab=innovate) opens the
  // Improvement board directly. Read from location to avoid a Suspense boundary.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "innovate") setTab("Innovate");
  }, []);
  const { hasRole } = useAuth();
  const canSeeOversight = hasRole([UserRole.ADMIN, UserRole.MANAGER]);

  const tabItems: Tab<HcdTab>[] = canSeeOversight
    ? [...TAB_ITEMS, ...OVERSIGHT_TAB_ITEMS]
    : TAB_ITEMS;

  // Switch to the target stage (if needed), then scroll its section into view —
  // so the FlowGuide CTA always lands you on the exact thing to do, even when
  // you're already on that tab.
  const goTo = (next: HcdTab, target: string) => {
    setTab(next);
    setTimeout(() => {
      document
        .getElementById(target)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  };

  // Open the assessment directly. With a block id (e.g. from a framework
  // suggestion) open that one; otherwise prefer AIDCA (the block with drills),
  // else the first available block — so "Take an assessment" actually starts one.
  const startAssessment = (blockId?: number) => {
    setTab("Assess");
    if (blockId != null) {
      setOpenBlockId(blockId);
      return;
    }
    const aidca = blocks?.find((b) => b.frameworkKey === "aidca");
    setOpenBlockId(aidca?.id ?? blocks?.[0]?.id ?? null);
  };

  const inAssessment = tab === "Assess" && openBlockId != null;

  return (
    <div className="min-h-screen bg-base-200 pb-20">
      <PageHeader
        title="Human Capital"
        label="Aavahana"
        subtitle="Assess competency, practice through drills, apply frameworks via coaching, innovate with ideas, and prove impact through recognition."
      />

      <div className="w-full px-4 md:px-6 mt-4 space-y-6">
        <Tabs
          tabs={tabItems}
          activeKey={tab}
          onChange={setTab}
          variant="pills"
        />

        {!inAssessment && tab !== "Metrics" && <ProgressStrip />}

        {tab !== "Cohort" &&
          tab !== "Metrics" &&
          tab !== "Tacit Knowledge" &&
          !inAssessment && (
          <FlowGuide
            currentTab={tab}
            onGo={goTo}
            onStartAssessment={startAssessment}
          />
        )}

        {tab === "Assess" && (
          <AssessTab
            openBlockId={openBlockId}
            setOpenBlockId={setOpenBlockId}
          />
        )}
        {tab === "Apply" && (
          <div id="hcd-apply" className="space-y-6">
            <PromptCopy />
            <HcdChat />
          </div>
        )}
        {tab === "Innovate" && (
          <div id="hcd-innovate" className="space-y-6">
            <FellowQuotaPanel />
            <IdeaBoard />
          </div>
        )}
        {tab === "Prove" && (
          <div id="hcd-prove">
            <RecognitionView />
          </div>
        )}
        {tab === "Cohort" && canSeeOversight && <CohortView />}
        {tab === "Metrics" && canSeeOversight && <MetricsView />}
        {tab === "Tacit Knowledge" && canSeeOversight && <TacitKnowledgeView />}
      </div>
    </div>
  );
}
