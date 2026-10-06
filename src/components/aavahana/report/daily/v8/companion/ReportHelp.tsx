"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/shared/Button";
import { SendIcon } from "@/components/shared/icons";
import { MicTextarea } from "@/components/aavahana/report/MicTextarea";
import { useV7Synthesize } from "@/lib/hooks/aavahana/use-report-v7";
import type { PlannedDeliverable } from "@/types/aavahana/report-engine.types";
import type { PlannedItemStatus } from "@/types/aavahana/report-v5.types";
import type {
  V7Dictionaries,
  V7SynthesizeMessage,
} from "@/types/aavahana/report-v7.types";
import { countWords, looksLikeGibberish } from "@/utils/aavahana/text-quality.utils";
import { ChipRow } from "../ChipRow";
import {
  CHANGE_QUESTION,
  MAX_EXCHANGE,
  READY_MESSAGE,
  STATUS_CHOICES,
  applyProposal,
  dayLine,
  draftFacts,
  hasAnswers,
  needsLongerExplanation,
  openingQuestion,
  readyToSubmit,
  statusLabel,
  statusQuestion,
  tasksWithoutStatus,
  type Proposal,
  type ReportDraft,
} from "./report-help";

/**
 * "Help me with my report": one open question, then a quick check of any task
 * the answer did not place, then the whole report, ready to submit or change.
 *
 * It starts from the report as it stands and shows that first, so it never
 * works from answers the person cannot see. It asks only for what is missing,
 * and opens straight on the report when nothing is.
 *
 * The questions and every sentence here are the app's own (report-help.ts).
 * The model only reads the answers and proposes which task went how, what got
 * in the way and how they felt, from the report's own lists. A task status is
 * never guessed: if the answer does not say, the person is asked, with a row of
 * three choices per task so a long plan is still one step. Nothing is saved
 * until they submit.
 *
 * A microphone is offered here, unlike the private chat around it: this is the
 * report, and every other report field can be spoken into too.
 */

type Stage = "asking" | "statuses" | "preview" | "changing";

interface Props {
  date: string;
  /** The report as it was when the helper opened. Every draft starts from it. */
  report: ReportDraft;
  dictionaries: V7Dictionaries | null;
  wentWellOptions: { id: string; label: string }[];
  /** Sent only when this browser holds the key; otherwise the server uses their saved one. */
  credentials: { apiKey?: string; provider?: string; model?: string };
  submitting: boolean;
  onUseDraft: (draft: ReportDraft) => void;
  onSubmitDraft: (draft: ReportDraft) => void;
}

/** One row of three choices per task. The highlighted one is its status now. */
function StatusRows({
  tasks,
  onPick,
}: {
  tasks: PlannedDeliverable[];
  onPick: (id: number, status: PlannedItemStatus) => void;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {tasks.map((task) => (
        <li key={task.id} className="flex flex-col gap-1.5">
          <span className="text-sm text-base-content/80">{task.label}</span>
          <div role="group" aria-label={task.label}>
            <ChipRow
              size="sm"
              options={STATUS_CHOICES}
              selectedId={task.status}
              onPick={(option) => option && onPick(task.id, option.id as PlannedItemStatus)}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ReportHelp({
  date,
  report,
  dictionaries,
  wentWellOptions,
  credentials,
  submitting,
  onUseDraft,
  onSubmitDraft,
}: Props) {
  const synth = useV7Synthesize();
  // A status they tap lands here, so a later change keeps it.
  const [base, setBase] = useState<ReportDraft>(report);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  // What the report is missing decides how the helper opens.
  const [opening] = useState(() => openingQuestion(report));
  const [exchange, setExchange] = useState<V7SynthesizeMessage[]>(() => [
    { role: "assistant", text: opening ?? READY_MESSAGE },
  ]);
  const [stage, setStage] = useState<Stage>(opening ? "asking" : "preview");
  // The tasks the status check asked about. Kept fixed, so the list does not
  // shrink under their finger as each one is answered.
  const [asked, setAsked] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const busy = useRef(false);
  const alive = useRef(true);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [exchange]);

  const draft = proposal && dictionaries ? applyProposal(base, proposal, dictionaries) : base;
  const unplaced = tasksWithoutStatus(draft);
  const text = message.trim();
  // The answer becomes the report, so text that is not words is not sent.
  const junk = countWords(text) >= 3 && looksLikeGibberish(text);
  const pending = synth.isPending;
  const canChange = exchange.length + 2 <= MAX_EXCHANGE;
  const roomForAnswer = exchange.length < MAX_EXCHANGE;

  async function send() {
    if (!text || junk || busy.current || !dictionaries || !roomForAnswer) return;
    busy.current = true;
    setError("");
    const sent: V7SynthesizeMessage[] = [...exchange, { role: "user", text }];
    try {
      const result = await synth.mutateAsync({
        date,
        messages: sent,
        deliverables: base.deliverables.map(({ id, label, status }) => ({ id, label, status })),
        ...credentials,
      });
      if (!alive.current) return;
      const missing = tasksWithoutStatus(applyProposal(base, result.proposed, dictionaries));
      setProposal(result.proposed);
      setMessage("");
      if (missing.length === 0) {
        setExchange(sent);
        setStage("preview");
      } else if (stage === "statuses") {
        // Some are still unplaced, and their list is already on screen.
        setExchange(sent);
      } else {
        // The answer did not say where these stand, so ask rather than guess.
        setExchange([...sent, { role: "assistant", text: statusQuestion(missing) }]);
        setAsked(missing.map((t) => t.id));
        setStage("statuses");
      }
    } catch {
      if (alive.current) {
        setError(
          "I couldn't put your report together just now. Your answer is still here, so you can try again.",
        );
      }
    } finally {
      busy.current = false;
      synth.reset();
    }
  }

  function startChange() {
    setExchange((previous) => [...previous, { role: "assistant", text: CHANGE_QUESTION }]);
    setStage("changing");
  }

  function pickStatus(id: number, status: PlannedItemStatus) {
    setBase((previous) => ({
      ...previous,
      deliverables: previous.deliverables.map((d) => (d.id === id ? { ...d, status } : d)),
    }));
    // A tap is the newest word on that task, so what the model read earlier no
    // longer overrides it.
    setProposal(
      (previous) =>
        previous && {
          ...previous,
          taskStatuses: previous.taskStatuses.filter((t) => t.id !== id),
        },
    );
  }

  const known = base.deliverables.filter((d) => d.status !== null);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-base-content/65">
        Answer in your own words, typed or spoken. I&apos;ll turn it into your report and
        show it to you before anything is submitted.
      </p>

      {/* Whatever the report already says, from its steps or an earlier go
          with the helper, shown before the first question so nothing the
          helper builds on is out of sight. */}
      {stage === "asking" && hasAnswers(base) && (
        <section
          aria-label="Already in your report"
          className="flex flex-col gap-2 rounded-2xl border border-base-content/10 p-4 text-sm"
        >
          <p className="text-xs font-medium text-base-content/55">Already in your report</p>
          {known.map((task) => (
            <div key={task.id} className="flex items-start justify-between gap-3">
              <span className="text-base-content/80">{task.label}</span>
              <span className="shrink-0 text-xs font-medium text-base-content/60">
                {statusLabel(task.status)}
              </span>
            </div>
          ))}
          {draftFacts(base, wentWellOptions).map((fact) => (
            <p key={fact.term}>
              <span className="text-base-content/55">{fact.term}: </span>
              {fact.value}
            </p>
          ))}
          {base.narrative.trim() && (
            <p className="line-clamp-3 whitespace-pre-wrap break-words text-base-content/75">
              {base.narrative}
            </p>
          )}
        </section>
      )}

      <div
        ref={log}
        role="log"
        aria-label="Your answers"
        aria-live="polite"
        className="flex max-h-72 flex-col gap-3 overflow-y-auto"
      >
        {exchange.map((turn, index) =>
          turn.role === "user" ? (
            <p
              key={index}
              className="max-w-sm self-end whitespace-pre-wrap break-words rounded-2xl bg-primary/10 px-4 py-2 text-sm"
            >
              {turn.text}
            </p>
          ) : (
            <p
              key={index}
              className="max-w-md whitespace-pre-wrap break-words rounded-2xl bg-base-200 px-4 py-2 text-sm leading-relaxed"
            >
              {turn.text}
            </p>
          ),
        )}
      </div>

      {stage === "statuses" && (
        <section
          aria-label="Where your tasks stand"
          className="flex flex-col gap-3 rounded-2xl border border-base-content/10 p-4"
        >
          <StatusRows
            tasks={draft.deliverables.filter((d) => asked.includes(d.id))}
            onPick={pickStatus}
          />
          <Button
            color="primary"
            className="w-fit"
            disabled={unplaced.length > 0}
            onClick={() => setStage("preview")}
          >
            Show my report
          </Button>
        </section>
      )}

      {(stage === "preview" || stage === "changing") && (
        <section
          aria-label="Your report"
          className="flex flex-col gap-3 rounded-2xl border border-base-content/10 p-4 text-sm"
        >
          <p className="font-medium">{dayLine(draft)}</p>

          {draft.deliverables.length > 0 && (
            <StatusRows tasks={draft.deliverables} onPick={pickStatus} />
          )}

          {draftFacts(draft, wentWellOptions).length > 0 && (
            <dl className="flex flex-col gap-2">
              {draftFacts(draft, wentWellOptions).map((fact) => (
                <div key={fact.term}>
                  <dt className="text-xs text-base-content/55">{fact.term}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {draft.narrative && (
            <div>
              <p className="text-xs text-base-content/55">In your words</p>
              <p className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words leading-relaxed">
                {draft.narrative}
              </p>
            </div>
          )}

          {needsLongerExplanation(draft) && (
            <p className="text-xs text-base-content/60">
              When you submit, the report will first ask for a fuller note about your day
              (at least 250 characters), as it does for every report like this one.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              color="primary"
              disabled={!readyToSubmit(draft)}
              loading={submitting}
              onClick={() => onSubmitDraft(draft)}
            >
              {submitting ? "Submitting…" : "Submit my report"}
            </Button>
            {stage === "preview" && canChange && (
              <Button variant="outline" color="neutral" onClick={startChange}>
                Make changes
              </Button>
            )}
            {(stage === "changing" || !canChange) && (
              <Button variant="ghost" color="neutral" onClick={() => onUseDraft(draft)}>
                Edit the steps myself
              </Button>
            )}
          </div>
          {draft.deliverables.length === 0 && (
            <p className="text-xs text-base-content/55">
              There are no planned tasks for today, so there is nothing to submit yet.
            </p>
          )}
        </section>
      )}

      {stage !== "preview" &&
        roomForAnswer &&
        (dictionaries ? (
          <>
            <label htmlFor="report-help-answer" className="sr-only">
              Your answer
            </label>
            <div className="flex items-start gap-2">
              <MicTextarea
                id="report-help-answer"
                value={message}
                onChange={setMessage}
                rows={3}
                autoFocus
                disabled={pending}
                className="flex-1"
                placeholder="Type, or tap the mic and talk. Enter sends."
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
              />
              <Button
                color="primary"
                disabled={!text || junk || pending}
                loading={pending}
                iconBefore={pending ? undefined : <SendIcon size="sm" />}
                onClick={send}
              >
                Send
              </Button>
            </div>
            {pending && (
              <p role="status" className="text-sm text-base-content/65">
                Putting your report together…
              </p>
            )}
          </>
        ) : (
          <p role="status" className="text-sm text-base-content/65">
            Getting this ready…
          </p>
        ))}

      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
