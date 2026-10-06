"use client";

import { useState } from "react";
import { useAtomValue } from "jotai";
import { Section } from "@/components/shared/Section";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { HcdByokSetup } from "@/components/hcd/HcdByokSetup";
import { hcdByokAtom, type HcdByokConfig } from "@/lib/store/hcd/hcd-byok.store";
import {
  useMyDrills,
  useCompleteDrill,
  useAutoDetect,
  useGenerateDrills,
} from "@/lib/hooks/hcd/use-drills";
import type { PrescribedDrill } from "@/lib/services/hcd/drill.service";
import type { ColorVariant } from "@/utils/shared/design.utils";

const GAP_BADGE: Record<string, { label: string; variant: ColorVariant }> = {
  default_gap: { label: "Default Gap", variant: "error" },
  know_gap: { label: "Know Gap", variant: "warning" },
  unverified: { label: "Unverified", variant: "neutral" },
  intuitive: { label: "Intuitive", variant: "info" },
  competent: { label: "Competent", variant: "success" },
};

function DrillCard({ drill }: { drill: PrescribedDrill }) {
  const completeMutation = useCompleteDrill();
  const detectMutation = useAutoDetect();

  const gap = GAP_BADGE[drill.gapType] ?? { label: drill.gapType, variant: "neutral" as ColorVariant };

  const handleTap = () => {
    completeMutation.mutate({ prescriptionId: drill.id, method: "tap" });
  };

  const handleDetect = () => {
    detectMutation.mutate(drill.id);
  };

  const isBusy = completeMutation.isPending || detectMutation.isPending;

  return (
    <div className="rounded-lg border border-base-300 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-semibold text-sm text-black">{drill.drill.title}</h4>
          <p className="text-xs dt-text-dim mt-1">{drill.drill.description}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge variant={gap.variant} icon={null} size="sm">{gap.label}</Badge>
          <Badge variant="neutral" icon={null} size="sm">{drill.gridCell}</Badge>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <Button
          color="primary"
          size="xs"
          loading={completeMutation.isPending}
          disabled={isBusy}
          onClick={handleTap}
        >
          Done
        </Button>

        {drill.drill.hasAutoDetect && (
          <Button
            color="neutral"
            variant="outline"
            size="xs"
            loading={detectMutation.isPending}
            disabled={isBusy}
            onClick={handleDetect}
          >
            Auto-Detect
          </Button>
        )}
      </div>

      {detectMutation.isSuccess && (
        <div className="text-xs mt-2">
          {detectMutation.data.detected ? (
            <span className="text-success">
              Detected! Found {detectMutation.data.evidence.length} matching item(s).
            </span>
          ) : (
            <span className="dt-text-dim">
              No matching activity found in the last 7 days.
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function GeneratePanel({ instanceId }: { instanceId: number }) {
  const byok = useAtomValue(hcdByokAtom);
  const generateMutation = useGenerateDrills();
  const [showConnect, setShowConnect] = useState(false);

  const generate = (config: HcdByokConfig) => {
    generateMutation.mutate({ instanceId, byok: config });
    setShowConnect(false);
  };

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-black">Personalize with AI</h4>
          <p className="text-xs dt-text-dim mt-0.5">
            Rewrite these as specific actions grounded in your own answers, using your AI key.
          </p>
        </div>
        {byok ? (
          <Button
            color="primary"
            size="xs"
            loading={generateMutation.isPending}
            onClick={() => generate(byok)}
          >
            Generate AI drills
          </Button>
        ) : (
          <Button
            color="primary"
            variant="outline"
            size="xs"
            onClick={() => setShowConnect((s) => !s)}
          >
            Connect AI key
          </Button>
        )}
      </div>

      {!byok && showConnect && (
        <div className="mt-3">
          <HcdByokSetup onConnected={generate} />
        </div>
      )}

      {generateMutation.isError && (
        <p className="text-xs text-error mt-2">{generateMutation.error.message}</p>
      )}
      {generateMutation.isSuccess && (
        <p className="text-xs text-success mt-2">
          Drills rewritten from your assessment answers.
        </p>
      )}
    </div>
  );
}

export function DrillPanel() {
  const { data: drills, isLoading } = useMyDrills();
  const instanceId = drills?.[0]?.instanceId ?? null;

  return (
    <Section>
      <Section.Header
        title="Prescribed drills"
        subtitle="Targeted practice from your latest assessment."
      />
      <Section.Body>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-sm" />
          </div>
        ) : !drills?.length ? (
          <EmptyState
            size="sm"
            title="No active drills"
            subtitle="Complete an assessment to get prescribed drills."
          />
        ) : (
          <div className="space-y-3">
            {instanceId !== null && <GeneratePanel instanceId={instanceId} />}
            {drills.map((drill) => (
              <DrillCard key={drill.id} drill={drill} />
            ))}
          </div>
        )}
      </Section.Body>
    </Section>
  );
}
