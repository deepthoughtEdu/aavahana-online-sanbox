"use client";

import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { FileAsImprovementObject } from "@/components/hcd/FileAsImprovementObject";
import { GraduationFlags } from "@/components/hcd/GraduationFlags";
import { EscalationSection } from "@/components/aavahana/escalation/EscalationSection";
import {
  useWindowDecisions,
  useDecideDecision,
  useCommunicateDecision,
} from "@/lib/hooks/aavahana/use-window";
import type { WindowDecision } from "@/lib/services/aavahana/window.service";
import type { ColorVariant } from "@/utils/shared/design.utils";

const STATUS_VARIANT: Record<WindowDecision["status"], ColorVariant> = {
  pending: "warning",
  decided: "info",
  communicated: "success",
};

function DecisionRow({ d }: { d: WindowDecision }) {
  const decide = useDecideDecision();
  const communicate = useCommunicateDecision();
  const [note, setNote] = useState("");

  return (
    <div className="rounded-lg border border-base-300 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-black min-w-0">{d.title}</p>
        <Badge variant={STATUS_VARIANT[d.status]} icon={null} size="sm">
          {d.status}
        </Badge>
      </div>
      <p className="text-xs dt-text-dim">
        {d.latencyDays}d {d.status === "communicated" ? "to close" : "open"}
      </p>
      {d.status === "pending" && (
        <div className="flex gap-2 items-center">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Your decision…"
            className="input input-bordered input-xs flex-1"
          />
          <Button
            color="primary"
            size="xs"
            loading={decide.isPending}
            disabled={!note.trim()}
            onClick={() => decide.mutate({ id: d.id, decision: note })}
          >
            Decide
          </Button>
        </div>
      )}
      {d.status === "decided" && (
        <Button
          color="success"
          size="xs"
          loading={communicate.isPending}
          onClick={() => communicate.mutate(d.id)}
        >
          Mark communicated
        </Button>
      )}
    </div>
  );
}

export function CommWindow() {
  const { data: decisions, isLoading } = useWindowDecisions();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-black mb-1">Have an idea?</p>
        <p className="text-xs dt-text-dim mb-2">
          It won&apos;t die in a corridor. It becomes a tracked improvement.
        </p>
        <FileAsImprovementObject sourceType="comm_window" cta="Post an idea" />
      </div>

      <div>
        <p className="text-sm font-medium text-black mb-2">Pending decisions</p>
        {isLoading ? (
          <p className="text-xs dt-text-dim">Loading…</p>
        ) : !decisions?.length ? (
          <p className="text-xs dt-text-dim">Nothing waiting on a decision.</p>
        ) : (
          <div className="space-y-2">
            {decisions.map((d) => (
              <DecisionRow key={d.id} d={d} />
            ))}
          </div>
        )}
      </div>

      <GraduationFlags showWhenEmpty />

      <EscalationSection />
    </div>
  );
}
