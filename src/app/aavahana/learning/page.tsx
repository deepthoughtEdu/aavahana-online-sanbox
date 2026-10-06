"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, Check, X, Clock, CircleSlash, Play } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { OverlayLoading } from "@/components/shared/OverlayLoading";
import { Button } from "@/components/shared/Button";
import { SuggestionCheckIn } from "@/components/aavahana/report/daily/v8/learning/SuggestionCheckIn";
import {
  LearningContentModal,
  youtubeVideoId,
} from "@/components/aavahana/report/daily/v8/learning/LearningContentModal";
import {
  useOpenSuggestion,
  useRespondToSuggestion,
} from "@/lib/hooks/aavahana/use-report-v7";
import { useSuggestionHistory } from "@/lib/hooks/aavahana/use-report-v7";
import { useAtomValue } from "jotai";
import { byokConfigAtom } from "@/lib/store/shared/byok.store";
import { isError } from "@/lib/api/client";
import { formatDate } from "@/utils/shared/date.utils";
import { iconSizes } from "@/utils/shared/design.utils";
import {
  KIND_LABEL,
  type SuggestionAction,
  type SuggestionHistoryItem,
  type SuggestionStatus,
} from "@/types/aavahana/learning.types";

/**
 * Everything ever suggested to you, and what you said about each.
 *
 * This screen exists because the old system had no memory. Ten to fifteen
 * suggestions appeared at the bottom of one day's report and were gone by the
 * next morning, so a good one seen on Tuesday could not be found on Thursday.
 *
 * It is also the answer to "what do we show on a day with no new suggestion".
 * Not an empty state: the record of what you have actually used.
 */

const STATUS_META: Record<
  SuggestionStatus,
  { label: string; className: string; Icon: React.ElementType }
> = {
  applied: { label: "Applied", className: "text-success", Icon: Check },
  not_useful: { label: "Not useful", className: "text-base-content/50", Icon: X },
  dropped: { label: "Dropped", className: "text-base-content/40", Icon: CircleSlash },
  open: { label: "Open", className: "text-primary", Icon: Clock },
};

const OUTCOME_LABEL: Record<string, string> = {
  completed: "Completed",
  started: "Started, not finished",
  not_started: "Did not get to it",
  not_relevant: "Not relevant that day",
};

export default function LearningPage() {
  const { data: openData, isLoading: openLoading } = useOpenSuggestion(true, true);
  const { data: history, isLoading: historyLoading } = useSuggestionHistory();
  const { mutateAsync: respond } = useRespondToSuggestion();
  const byok = useAtomValue(byokConfigAtom);
  const [revisiting, setRevisiting] = useState<SuggestionHistoryItem | null>(null);

  const open = openData?.open ?? null;
  const totals = history?.totals;
  const applied = (history?.items ?? []).filter(
    (i) => i.status === "applied" && i.challengeOutcome !== "started",
  );
  const closed = (history?.items ?? []).filter((i) => i.status !== "open");

  const handleRespond = async (
    action: SuggestionAction,
    opts: { note?: string; reason?: string },
  ) => {
    if (!open) return false;
    try {
      const res = await respond({
        suggestionId: open.id,
        action,
        note: opts.note,
        reason: opts.reason,
      });
      return !isError(res);
    } catch {
      return false;
    }
  };

  if (openLoading && historyLoading) {
    return <OverlayLoading title="Loading your learning…" />;
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        label="Aavahana"
        title="Learning"
        subtitle="One suggestion at a time, and what you did with it."
      />

      {/* What you are holding right now. */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-base-content">Open now</h2>
        {open ? (
          <SuggestionCheckIn
            suggestion={open}
            deferReasons={openData?.deferReasons ?? []}
            onRespond={handleRespond}
            onDismiss={() => {}}
          />
        ) : (
          <div className="rounded-xl border border-base-300 bg-base-100 p-4 text-sm text-base-content/60">
            Nothing open. You will get a new suggestion the next time you close a
            daily report.
            {/* Without a key, this person cannot generate a suggestion at all.
                They can still receive one from the shared library once somebody
                else has found something that worked, so the wording promises
                that rather than pretending nothing is happening. */}
            {!byok.apiKey && (
              <p className="mt-2 text-base-content/70">
                You have no AI key set up, so suggestions can only reach you once
                a colleague has found something that worked. To get your own,
                tailored to what you actually do,{" "}
                <Link
                  href="/aavahana/settings/ai-coach"
                  className="font-medium text-primary hover:underline"
                >
                  add your key in AI coach
                </Link>
                .
              </p>
            )}
          </div>
        )}
      </section>

      {/* The counts, stated plainly. No score, no grade. */}
      {totals && totals.issued > 0 && (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Suggested" value={totals.issued} />
          <Stat label="Used or completed" value={totals.applied} tone="text-success" />
          <Stat label="Started" value={totals.started} />
          <Stat label="Not relevant" value={totals.notRelevant} />
        </section>
      )}

      {/* What worked. The part worth coming back for. */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-base-content">
          What you have used
        </h2>
        {applied.length === 0 ? (
          <p className="rounded-xl border border-base-300 bg-base-100 p-4 text-sm text-base-content/60">
            Nothing here yet. When you tell us a suggestion worked, it lands here
            with what you wrote about it, and we send you more of that kind.
          </p>
        ) : (
          <ul className="space-y-2">
            {applied.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-success/25 bg-success/[0.04] p-4"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-success/80">
                    {KIND_LABEL[item.kind]}
                  </p>
                  <span className="shrink-0 text-xs text-base-content/45">
                    {item.closedAt ? formatDate(item.closedAt, "MMM DD") : ""}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-base-content">
                  {item.title}
                </p>
                {item.appliedNote && (
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-base-content/70">
                    {item.appliedNote}
                  </p>
                )}
                <RevisitButton item={item} onClick={() => setRevisiting(item)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* The full trail, including the ones that did not land. */}
      {closed.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-base-content">Everything</h2>
          <ul className="divide-y divide-base-200 rounded-xl border border-base-300 bg-base-100">
            {closed.map((item) => (
              <HistoryRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-base-content/45">
        Suggestions come from your{" "}
        <Link href="/aavahana/daily-report" className="text-primary hover:underline">
          daily report
        </Link>
        . Nothing on this screen is scored, and nothing here is shared with your
        supervisor.
      </p>

      {revisiting && (
        <LearningContentModal
          isOpen
          suggestion={revisiting}
          onClose={() => setRevisiting(null)}
          returnMessage="Closing this returns you to your Learning history."
        />
      )}
    </div>
  );
}

function RevisitButton({
  item,
  onClick,
}: {
  item: SuggestionHistoryItem;
  onClick: () => void;
}) {
  const playableVideo =
    item.kind === "viewing" &&
    item.verified &&
    Boolean(youtubeVideoId(item.searchUrl));
  const reading = item.kind === "reading" || Boolean(item.expansion);
  const label = playableVideo
    ? "Watch again"
    : reading
      ? "Read again"
      : "Review learning";
  const Icon = playableVideo ? Play : BookOpen;

  return (
    <Button
      type="button"
      size="xs"
      variant="ghost"
      className="-ml-2 mt-2"
      onClick={onClick}
      iconBefore={<Icon className={iconSizes.xs} aria-hidden />}
    >
      {label}
    </Button>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-base-300 bg-base-100 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-base-content/40">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold ${tone ?? "text-base-content"}`}>
        {value}
      </p>
    </div>
  );
}

function HistoryRow({ item }: { item: SuggestionHistoryItem }) {
  const meta = STATUS_META[item.status];
  const { Icon } = meta;
  const statusLabel = item.challengeOutcome
    ? OUTCOME_LABEL[item.challengeOutcome]
    : meta.label;
  return (
    <li className="flex items-start gap-3 p-3.5">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.className}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-base-content/40">
            {KIND_LABEL[item.kind]}
          </span>
          <span className="text-sm font-medium text-base-content">
            {item.title}
          </span>
        </div>
        {item.notUsefulNote && (
          <p className="mt-1 whitespace-pre-wrap text-xs text-base-content/60">
            {item.notUsefulNote}
          </p>
        )}
        {/* The deferral trail. Four "no time" answers before applying it says
            something an overwritten status column never could. */}
        {item.deferrals.length > 0 && (
          <p className="mt-1 text-xs text-base-content/40">
            Put off {item.deferrals.length}x
            {item.deferrals.some((d) => d.reason) &&
              ` (${Array.from(
                new Set(item.deferrals.map((d) => d.reason).filter(Boolean)),
              )
                .join(", ")
                .replace(/_/g, " ")})`}
          </p>
        )}
      </div>
      <span className={`shrink-0 text-xs ${meta.className}`}>{statusLabel}</span>
    </li>
  );
}
