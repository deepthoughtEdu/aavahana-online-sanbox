"use client";

import { useInitiativeHistory } from "@/lib/hooks/hcd/use-initiatives";
import { IoStageBadge } from "@/components/hcd/IoStageBadge";

// Stage-log timeline (reads GET /:id/history). Adapts the ScoreHistory pattern
// rather than authoring a new timeline (FE-W1.0).
export function IoStageTimeline({ initiativeId }: { initiativeId: number }) {
  const { data: logs, isLoading } = useInitiativeHistory(initiativeId);

  if (isLoading) {
    return <p className="text-xs dt-text-dim py-2">Loading history…</p>;
  }
  if (!logs?.length) {
    return <p className="text-xs dt-text-dim py-2">No stage history yet.</p>;
  }

  return (
    <ol className="mt-2 space-y-1.5 border-l border-base-300 pl-3">
      {logs.map((l) => (
        <li key={l.id} className="flex items-center gap-1.5 text-xs">
          {l.fromStage && (
            <>
              <IoStageBadge stage={l.fromStage} />
              <span className="dt-text-dim">→</span>
            </>
          )}
          <IoStageBadge stage={l.toStage} />
          <span className="dt-text-dim ml-1">
            {new Date(l.at).toLocaleDateString()}
            {l.byRole ? ` · ${l.byRole}` : ""}
          </span>
        </li>
      ))}
    </ol>
  );
}
