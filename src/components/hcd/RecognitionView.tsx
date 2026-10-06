"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Section } from "@/components/shared/Section";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Tabs, type Tab } from "@/components/shared/Tabs";
import { useAuth } from "@/lib/hooks/shared/use-auth";
import { UserRole } from "@/types";
import {
  useMyRecognition,
  useImpactSummary,
  usePendingVerifications,
} from "@/lib/hooks/hcd/use-recognition";
import { HcdInitiativeService } from "@/lib/services/hcd/initiative.service";
import { isError } from "@/lib/api/client";
import type { PendingVerification } from "@/lib/services/hcd/recognition.service";

type RecognitionTab = "mine" | "review";

const VIEW_TABS: Tab<RecognitionTab>[] = [
  { key: "mine", label: "My Recognition" },
  { key: "review", label: "Review Queue" },
];

function Stat({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className="rounded-[9px] border border-base-300 bg-white p-4 text-center">
      <div className={`text-2xl font-bold ${accent ? "text-success" : "text-black"}`}>{value}</div>
      <div className="text-xs dt-text-dim mt-0.5">{label}</div>
    </div>
  );
}

function ImpactSummaryCard() {
  const { data: summary, isLoading } = useImpactSummary();

  if (isLoading || !summary) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Stat value={summary.totalInitiatives} label="Total Initiatives" />
      <Stat value={summary.verifiedCount} label="Verified" accent />
      <Stat value={Object.keys(summary.byFramework).length} label="Frameworks" />
      <Stat value={summary.cellsCovered.length} label="Cells Covered" />
    </div>
  );
}

function VerifiedList() {
  const { data: initiatives, isLoading } = useMyRecognition();

  return (
    <Section>
      <Section.Header title="My recognition" subtitle="Your verified, recognised HCD work." />
      <Section.Body>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-sm" />
          </div>
        ) : !initiatives?.length ? (
          <EmptyState
            size="sm"
            title="No verified initiatives yet"
            subtitle="Apply and verify your HCD work to build recognition."
          />
        ) : (
          <div className="space-y-3">
            {initiatives.map((i) => (
              <div key={i.id} className="rounded-lg border border-base-300 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-black">{i.title}</h4>
                    <p className="text-xs dt-text-dim mt-1">{i.description}</p>
                  </div>
                  <Badge variant="success" icon={null} size="sm">Verified</Badge>
                </div>
                {i.actualOutcome && (
                  <p className="text-xs mt-2">
                    <span className="font-medium">Outcome:</span> {i.actualOutcome}
                  </p>
                )}
                {i.gridCells?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {i.gridCells.map((cell) => (
                      <Badge key={cell} variant="neutral" icon={null} size="sm">{cell}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Section.Body>
    </Section>
  );
}

function PendingCard({ item }: { item: PendingVerification }) {
  const qc = useQueryClient();
  const [note, setNote] = useState("");

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await HcdInitiativeService.verify(item.id, {});
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hcd", "recognition"] });
      qc.invalidateQueries({ queryKey: ["hcd", "initiatives"] });
      qc.invalidateQueries({ queryKey: ["hcd", "progress"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const res = await HcdInitiativeService.reject(item.id, note);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hcd", "recognition"] });
      qc.invalidateQueries({ queryKey: ["hcd", "initiatives"] });
      qc.invalidateQueries({ queryKey: ["hcd", "progress"] });
    },
  });

  return (
    <div className="rounded-lg border border-base-300 p-4">
      <h4 className="font-semibold text-sm text-black">{item.title}</h4>
      <p className="text-xs dt-text-dim mt-1">{item.description}</p>
      <div className="mt-2 space-y-0.5 text-xs">
        {item.scope && (
          <p><span className="font-medium">Scope:</span> {item.scope}</p>
        )}
        {item.expectedImpact && (
          <p><span className="font-medium">Expected impact:</span> {item.expectedImpact}</p>
        )}
        {item.timeline && (
          <p><span className="font-medium">Timeline:</span> {item.timeline}</p>
        )}
        {item.actualOutcome && (
          <p><span className="font-medium">Outcome:</span> {item.actualOutcome}</p>
        )}
      </div>
      <div className="flex gap-2 mt-3 items-end">
        <Button
          color="success"
          size="xs"
          loading={verifyMutation.isPending}
          onClick={() => verifyMutation.mutate()}
        >
          Verify
        </Button>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Rejection note"
          className="input input-bordered input-xs flex-1"
        />
        <Button
          color="error"
          size="xs"
          loading={rejectMutation.isPending}
          disabled={!note.trim()}
          onClick={() => rejectMutation.mutate()}
        >
          Reject
        </Button>
      </div>
    </div>
  );
}

function SupervisorQueue() {
  const { data: pending, isLoading } = usePendingVerifications();

  return (
    <Section>
      <Section.Header title="Review queue" subtitle="Submitted initiatives awaiting verification." />
      <Section.Body>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-sm" />
          </div>
        ) : !pending?.length ? (
          <EmptyState size="sm" title="No pending verifications" subtitle="Submitted work will appear here." />
        ) : (
          <div className="space-y-3">
            {pending.map((item) => (
              <PendingCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </Section.Body>
    </Section>
  );
}

export function RecognitionView() {
  const [view, setView] = useState<RecognitionTab>("mine");
  const { hasRole } = useAuth();
  const canReview = hasRole([UserRole.ADMIN, UserRole.MANAGER]);

  // The Review Queue is a supervisor surface — only admins/managers see it.
  // (The backend also enforces verify/reject authority and blocks self-verify.)
  if (!canReview) {
    return (
      <div className="space-y-6">
        <ImpactSummaryCard />
        <VerifiedList />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ImpactSummaryCard />
      <Tabs tabs={VIEW_TABS} activeKey={view} onChange={setView} variant="pills" />
      {view === "mine" ? <VerifiedList /> : <SupervisorQueue />}
    </div>
  );
}
