"use client";

import { useState } from "react";
import { Badge } from "@/components/shared/Badge";
import { useGraduationFlags } from "@/lib/hooks/hcd/use-graduation";
import type { GraduationFlag } from "@/lib/services/hcd/graduation.service";

// Growth Execution W3.5 — graduation flags, FLAG-ONLY (HG5). Renders the backend's
// "may be ready for the next level" signal to a coach as a read-only callout. There
// is no accept / reject / promote control here: a level is never mutated from this
// surface. A human validates and acts on the person's record elsewhere.

function FlagCard({ flag, name }: { flag: GraduationFlag; name?: string }) {
  const [open, setOpen] = useState(false);
  const subject = name ?? `Employee ${flag.eid}`;
  const crit = flag.evidence?.nextLevelCriteria;

  return (
    <div className="rounded-lg border border-warning/30 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-black">{subject}</p>
          <p className="text-xs dt-text-dim">
            {flag.fromLevel} &rarr; {flag.toLevel}
          </p>
        </div>
        <Badge variant="warning" icon={null} size="sm">
          May be ready for {flag.toLevel}
        </Badge>
      </div>

      <p className="text-xs dt-text-dim">{flag.reason}</p>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-primary"
      >
        {open ? "Hide evidence" : "Show evidence"}
      </button>

      {open && (
        <div className="space-y-2">
          <p className="text-xs dt-text-dim">
            Ladder {flag.evidence.ladder} &middot; sustained{" "}
            {flag.evidence.sustainWeeks} weeks
            {crit?.minCompositeScore != null
              ? ` · composite ≥ ${crit.minCompositeScore}`
              : ""}
          </p>
          <ul className="space-y-1">
            {flag.evidence.weeks.map((w) => (
              <li key={w.weekId} className="text-xs dt-text-dim">
                <span className={w.met ? "text-success" : "text-neutral"}>
                  {w.met ? "●" : "○"}
                </span>{" "}
                {w.weekId}
                {w.missing?.length ? ` · missing ${w.missing.join(", ")}` : " · met"}
              </li>
            ))}
          </ul>
          <p className="text-xs dt-text-dim">
            A coach validates the next level elsewhere. This is a signal, not a
            promotion.
          </p>
        </div>
      )}
    </div>
  );
}

export function GraduationFlags({
  title = "Graduation flags",
  names,
  showWhenEmpty = false,
}: {
  title?: string;
  // Optional eid → display name map. Omit to fall back to "Employee {eid}".
  names?: Record<number, string>;
  showWhenEmpty?: boolean;
}) {
  const { data, isLoading } = useGraduationFlags();
  const flags = data ?? [];

  if (isLoading) {
    if (!showWhenEmpty) return null;
    return (
      <div>
        <p className="text-sm font-medium text-black mb-2">{title}</p>
        <p className="text-xs dt-text-dim">Loading…</p>
      </div>
    );
  }

  if (!flags.length) {
    if (!showWhenEmpty) return null;
    return (
      <div>
        <p className="text-sm font-medium text-black mb-2">{title}</p>
        <p className="text-xs dt-text-dim">No one flagged for the next level yet.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-black mb-1">{title}</p>
      <p className="text-xs dt-text-dim mb-2">
        Signals only. A human validates and promotes elsewhere.
      </p>
      <div className="space-y-2">
        {flags.map((f) => (
          <FlagCard key={f.eid} flag={f} name={names?.[f.eid]} />
        ))}
      </div>
    </div>
  );
}
