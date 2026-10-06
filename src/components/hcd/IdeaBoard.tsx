"use client";

import { useState } from "react";
import { Section } from "@/components/shared/Section";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  useInitiativeList,
  useCreateInitiative,
  usePromoteInitiative,
  useSubmitForVerification,
  useDropInitiative,
  useRestoreInitiative,
} from "@/lib/hooks/hcd/use-initiatives";
import { useBlockList } from "@/lib/hooks/hcd/use-block";
import type { Initiative, PromoteData } from "@/lib/services/hcd/initiative.service";
import {
  STAGE_ORDER,
  STAGE_BADGE,
  CAPTURE_STAGES,
  nextStage,
  canDrop,
  type IoStage,
} from "@/components/hcd/lifecycle";
import { IoStageBadge } from "@/components/hcd/IoStageBadge";
import { IoStageTimeline } from "@/components/hcd/IoStageTimeline";
import { FileAsImprovementObject } from "@/components/hcd/FileAsImprovementObject";
import type { ColorVariant } from "@/utils/shared/design.utils";

const VERIFY_BADGE: Record<string, { label: string; variant: ColorVariant }> = {
  submitted: { label: "Submitted", variant: "warning" },
  verified: { label: "Verified", variant: "success" },
  rejected: { label: "Rejected", variant: "error" },
};

const FILTERS: { key: string | null; label: string }[] = [
  { key: null, label: "All" },
  ...STAGE_ORDER.map((s) => ({ key: s, label: STAGE_BADGE[s].label })),
  { key: "dropped", label: STAGE_BADGE.dropped.label },
];

// Capture prompts for the stages that record structure on entry.
function PromoteForm({
  toStage,
  isPending,
  onCancel,
  onSubmit,
}: {
  toStage: IoStage;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: (data: PromoteData) => void;
}) {
  const [scope, setScope] = useState("");
  const [expectedImpact, setExpectedImpact] = useState("");
  const [timeline, setTimeline] = useState("");
  const [actualOutcome, setActualOutcome] = useState("");
  const [scaleScope, setScaleScope] = useState("");

  const canSubmit =
    toStage === "prototyped"
      ? scope.trim() && expectedImpact.trim() && timeline.trim()
      : toStage === "piloted"
      ? actualOutcome.trim()
      : scaleScope.trim();

  const handle = () => {
    if (!canSubmit) return;
    if (toStage === "prototyped") {
      onSubmit({ scope: scope.trim(), expectedImpact: expectedImpact.trim(), timeline: timeline.trim() });
    } else if (toStage === "piloted") {
      onSubmit({ actualOutcome: actualOutcome.trim() });
    } else {
      onSubmit({ scaleScope: scaleScope.trim() });
    }
  };

  const heading =
    toStage === "prototyped"
      ? "Scope this as a prototype"
      : toStage === "piloted"
      ? "Record what actually happened in the pilot"
      : "How far did this scale beyond the pilot?";

  return (
    <div className="mt-3 rounded-lg border border-base-300 p-3 space-y-2">
      <p className="text-xs font-semibold text-black">{heading}</p>
      {toStage === "prototyped" && (
        <>
          <textarea
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            placeholder="Scope: what exactly will you do?"
            className="textarea textarea-bordered textarea-sm w-full"
            rows={2}
          />
          <textarea
            value={expectedImpact}
            onChange={(e) => setExpectedImpact(e.target.value)}
            placeholder="Expected impact: what result do you expect, ideally with a number?"
            className="textarea textarea-bordered textarea-sm w-full"
            rows={2}
          />
          <input
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            placeholder="Timeline: by when?"
            className="input input-bordered input-sm w-full"
          />
        </>
      )}
      {toStage === "piloted" && (
        <textarea
          value={actualOutcome}
          onChange={(e) => setActualOutcome(e.target.value)}
          placeholder="Outcome: what actually happened? Include a real number if you can."
          className="textarea textarea-bordered textarea-sm w-full"
          rows={3}
        />
      )}
      {toStage === "scaled" && (
        <textarea
          value={scaleScope}
          onChange={(e) => setScaleScope(e.target.value)}
          placeholder="Scale: where has this been adopted beyond the original pilot?"
          className="textarea textarea-bordered textarea-sm w-full"
          rows={2}
        />
      )}
      <div className="flex gap-2">
        <Button color="primary" size="xs" loading={isPending} disabled={!canSubmit} onClick={handle}>
          Advance to {STAGE_BADGE[toStage].label}
        </Button>
        <Button color="neutral" variant="ghost" size="xs" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function InitiativeCard({ initiative }: { initiative: Initiative }) {
  const promoteMutation = usePromoteInitiative();
  const submitMutation = useSubmitForVerification();
  const dropMutation = useDropInitiative();
  const restoreMutation = useRestoreInitiative();
  const [promoting, setPromoting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const status = initiative.status as IoStage;
  const next = nextStage(status);
  const verification = initiative.verificationStatus ? VERIFY_BADGE[initiative.verificationStatus] : null;

  const isDropped = status === "dropped";
  const scaledBlocked = next === "scaled" && initiative.verificationStatus !== "verified";
  const canAdvance = !!next && !isDropped && !scaledBlocked;
  const needsCapture = next ? CAPTURE_STAGES.has(next) : false;
  const canSubmit = status === "piloted" && !initiative.verificationStatus;
  const droppable = canDrop(status);

  const hasPlan = initiative.scope || initiative.expectedImpact || initiative.timeline;

  const doPromote = (data: PromoteData) => {
    promoteMutation.mutate({ id: initiative.id, data }, { onSuccess: () => setPromoting(false) });
  };

  const handleAdvance = () => {
    if (!next) return;
    if (needsCapture) setPromoting(true);
    else promoteMutation.mutate({ id: initiative.id, data: {} });
  };

  return (
    <div className="rounded-lg border border-base-300 p-4">
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-semibold text-sm text-black min-w-0">{initiative.title}</h4>
        <div className="flex gap-1 shrink-0 flex-wrap justify-end">
          <IoStageBadge stage={status} />
          {verification && (
            <Badge variant={verification.variant} icon={null} size="sm">
              {verification.label}
            </Badge>
          )}
          {initiative.independenceFlag === "independent" && (
            <Badge variant="success" icon={null} size="sm">
              Independent
            </Badge>
          )}
        </div>
      </div>
      <p className="text-xs dt-text-dim mt-1 line-clamp-2">{initiative.description}</p>

      {hasPlan && (
        <div className="mt-2 space-y-0.5 text-xs">
          {initiative.scope && (
            <p><span className="font-medium">Scope:</span> {initiative.scope}</p>
          )}
          {initiative.expectedImpact && (
            <p><span className="font-medium">Expected impact:</span> {initiative.expectedImpact}</p>
          )}
          {initiative.timeline && (
            <p><span className="font-medium">Timeline:</span> {initiative.timeline}</p>
          )}
        </div>
      )}
      {initiative.actualOutcome && (
        <p className="text-xs mt-1">
          <span className="font-medium">Outcome:</span> {initiative.actualOutcome}
        </p>
      )}
      {initiative.scaleScope && (
        <p className="text-xs mt-1">
          <span className="font-medium">Scaled:</span> {initiative.scaleScope}
        </p>
      )}

      {initiative.gridCells?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {initiative.gridCells.map((cell) => (
            <Badge key={cell} variant="neutral" icon={null} size="sm">{cell}</Badge>
          ))}
        </div>
      )}

      {scaledBlocked && (
        <p className="text-xs text-warning mt-2">Verify impact before this can be scaled.</p>
      )}

      {promoting && next ? (
        <PromoteForm
          toStage={next}
          isPending={promoteMutation.isPending}
          onCancel={() => setPromoting(false)}
          onSubmit={doPromote}
        />
      ) : (
        <div className="flex gap-2 mt-3 flex-wrap items-center">
          {canAdvance && (
            <Button color="primary" size="xs" loading={promoteMutation.isPending} onClick={handleAdvance}>
              Advance to {STAGE_BADGE[next!].label}
            </Button>
          )}
          {canSubmit && (
            <Button
              color="neutral"
              variant="outline"
              size="xs"
              loading={submitMutation.isPending}
              onClick={() => submitMutation.mutate(initiative.id)}
            >
              Submit for Verification
            </Button>
          )}
          {droppable && (
            <Button
              color="neutral"
              variant="ghost"
              size="xs"
              loading={dropMutation.isPending}
              onClick={() => dropMutation.mutate(initiative.id)}
            >
              Drop
            </Button>
          )}
          {isDropped && (
            <Button
              color="primary"
              variant="outline"
              size="xs"
              loading={restoreMutation.isPending}
              onClick={() => restoreMutation.mutate(initiative.id)}
            >
              Restore
            </Button>
          )}
          <Button color="neutral" variant="ghost" size="xs" onClick={() => setShowHistory((v) => !v)}>
            {showHistory ? "Hide history" : "History"}
          </Button>
        </div>
      )}

      {showHistory && <IoStageTimeline initiativeId={initiative.id} />}
    </div>
  );
}

function NewIdeaForm({ onClose }: { onClose: () => void }) {
  const { data: blocks } = useBlockList();
  const createMutation = useCreateInitiative();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frameworkKey, setFrameworkKey] = useState("");

  const frameworks = blocks
    ? [...new Map(blocks.map((b) => [b.frameworkKey, b.frameworkName])).entries()]
    : [];

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !frameworkKey) return;
    // New ideas land at 'ideated' (backend default) — the constraint-sourced
    // 'spotted' entry arrives with FE-W2.2's FileAsImprovementObject.
    await createMutation.mutateAsync({
      title: title.trim(),
      description: description.trim(),
      frameworkKey,
    });
    onClose();
  };

  return (
    <div className="rounded-lg border border-base-300 p-4 space-y-3">
      <h4 className="font-semibold text-sm text-black">New idea</h4>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="input input-bordered input-sm w-full"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        className="textarea textarea-bordered textarea-sm w-full"
        rows={3}
      />
      <select
        value={frameworkKey}
        onChange={(e) => setFrameworkKey(e.target.value)}
        className="select select-bordered select-sm w-full"
      >
        <option value="">Select framework</option>
        {frameworks.map(([key, name]) => (
          <option key={key} value={key}>
            {name}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <Button
          color="primary"
          size="sm"
          loading={createMutation.isPending}
          disabled={!title.trim() || !description.trim() || !frameworkKey}
          onClick={handleSubmit}
        >
          Create
        </Button>
        <Button color="neutral" variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function IdeaBoard() {
  const { data: initiatives, isLoading } = useInitiativeList();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = initiatives?.filter((i) => !filter || i.status === filter);

  return (
    <Section>
      <Section.Header title="Improvement board" subtitle="Spot, diagnose, prototype, pilot, and scale improvements.">
        <Button color="primary" size="sm" onClick={() => setShowForm(true)}>
          + New Idea
        </Button>
      </Section.Header>
      <Section.Body className="space-y-4">
        {/* Spot a constraint — files an Improvement Object at stage `spotted`
            (distinct from + New Idea, which starts at `ideated`). */}
        <div className="rounded-lg border border-dashed border-base-300 p-3 flex items-center justify-between gap-3">
          <p className="text-xs dt-text-dim">
            Hit a recurring blocker? Spot it as an improvement to track and diagnose.
          </p>
          <FileAsImprovementObject sourceType="manual" cta="Spot a constraint" />
        </div>

        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <Button
              key={f.key ?? "all"}
              color="primary"
              variant={filter === f.key ? undefined : "outline"}
              size="xs"
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {showForm && <NewIdeaForm onClose={() => setShowForm(false)} />}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-sm" />
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((initiative) => (
              <InitiativeCard key={initiative.id} initiative={initiative} />
            ))}
          </div>
        ) : (
          <EmptyState
            size="sm"
            title="No initiatives yet"
            subtitle="Create your first idea to start the lifecycle."
          />
        )}
      </Section.Body>
    </Section>
  );
}
