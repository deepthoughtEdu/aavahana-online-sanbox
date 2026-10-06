"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAtomValue } from "jotai";
import { ChevronLeft, ClipboardList } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { SendIcon } from "@/components/shared/icons";
import { useSupportReply } from "@/lib/hooks/aavahana/use-compassion";
import { useByokKeys } from "@/lib/hooks/admin";
import { byokConfigAtom, normalizeByokModel } from "@/lib/store/shared/byok.store";
import type { SupportMessage } from "@/types/aavahana/compassion.types";
import type { V7Dictionaries } from "@/types/aavahana/report-v7.types";
import { isServerByokKeyUsableForAavahanaAi } from "@/utils/aavahana/byok-key.utils";
import { ReportHelp } from "./ReportHelp";
import { reportKey, type ReportDraft } from "./report-help";

/**
 * "I could use some support": a private place to talk the day through.
 *
 * WHAT IT REPLACED
 * Four choice cards, then two more mode buttons, a consent checkbox, a canned
 * step, a draft editor, a rating and a "remember for tomorrow" panel. On a bad
 * day that was six decisions before anybody had listened. The replies were
 * pre-written too: somebody who said they had been scolded was told how to
 * unblock a task.
 *
 * WHAT IT IS NOW
 * One box to write in, and replies that answer what was actually said. The AI
 * writes each reply; the backend keeps it short, refuses anything that is not
 * support (code, facts, documents, tasks), and substitutes a fixed message if
 * the person describes being in danger (pdgms/loops/compassion-support.js).
 *
 * The composer matches the other chats in this report (AiCoachDrawer,
 * ChatReflectionModal): box and Send on one row, Send on the right, Enter sends
 * and Shift+Enter starts a new line.
 *
 * It is not a step in the report. It opens over the question they were on and
 * closes back to it, and nothing said here is saved or added to the report.
 *
 * Closing it hides it rather than removing it (DailyReportV8.tsx), so the
 * conversation is still there if they open it again during the same visit.
 * Leaving the page clears it.
 *
 * "Help me with my report" is the one exception, so it is a separate mode
 * (ReportHelp.tsx) with its own notice: what is said there does go into the
 * report, once they submit it. It never sees this conversation.
 */

type Turn = SupportMessage & { urgent?: boolean };

/** The backend accepts at most ten earlier messages. */
const MAX_TURNS = 10;

interface Props {
  canSubmit: boolean;
  submitting: boolean;
  /** Why the report cannot be submitted from here yet, if it cannot. */
  submitHint: string | null;
  onBack: () => void;
  onSubmit: () => void;
  /** The report's day, for the report helper. */
  date: string;
  /** The report as it stands. The helper starts from it. */
  report: ReportDraft;
  dictionaries: V7Dictionaries | null;
  wentWellOptions: { id: string; label: string }[];
  /** False when the helper has nothing to fill in, such as a day with no plan. */
  reportHelpAvailable: boolean;
  /** Put the helper's draft into the report and go back to it. */
  onUseDraft: (draft: ReportDraft) => void;
  /** Put the helper's draft into the report and submit it. */
  onSubmitDraft: (draft: ReportDraft) => void;
}

export function SupportChat({
  canSubmit,
  submitting,
  submitHint,
  onBack,
  onSubmit,
  date,
  report,
  dictionaries,
  wentWellOptions,
  reportHelpAvailable,
  onUseDraft,
  onSubmitDraft,
}: Props) {
  const router = useRouter();
  const byok = useAtomValue(byokConfigAtom);
  const keys = useByokKeys();
  const reply = useSupportReply();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"talk" | "report">("talk");
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
  }, [turns]);

  const browserKey = Boolean(byok.apiKey && byok.provider && byok.model);
  const savedKey = (keys.data ?? []).some(
    (k) => isServerByokKeyUsableForAavahanaAi(k) && k.ownershipType === "individual",
  );
  // Null while it is still being checked, so nobody is told to add a key they
  // already have.
  const hasKey: boolean | null =
    browserKey || savedKey ? true : keys.isLoading ? null : false;

  // The key travels with a request only when this browser holds it. Otherwise
  // the server uses the one saved to their account.
  const credentials = browserKey
    ? {
        apiKey: byok.apiKey,
        provider: byok.provider,
        model: normalizeByokModel(byok.model),
      }
    : {};

  async function send() {
    const text = message.trim();
    if (!text || busy.current) return;
    busy.current = true;
    setError("");
    try {
      const result = await reply.mutateAsync({
        message: text,
        // Role and text only. The danger flag stays on this screen.
        history: turns.slice(-MAX_TURNS).map(({ role, text: t }) => ({ role, text: t })),
        allowAi: true,
        offerReportHelp: reportHelpAvailable,
        ...credentials,
      });
      if (!alive.current) return;
      if (result.reportHelp && reportHelpAvailable) {
        // They asked for help with the report, so open the helper instead of
        // answering here. What they typed was only the request.
        setMessage("");
        setMode("report");
        return;
      }
      setTurns((previous) =>
        [
          ...previous,
          { role: "user" as const, text },
          { role: "assistant" as const, text: result.reply, urgent: result.urgent },
        ].slice(-MAX_TURNS),
      );
      setMessage("");
    } catch {
      if (alive.current) {
        setError("I couldn't reply just now. Your message is still here, so you can try again.");
      }
    } finally {
      busy.current = false;
      reply.reset();
    }
  }

  const footer = (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-content/10 pt-4">
      <Button
        variant="ghost"
        color="neutral"
        size="sm"
        iconBefore={<ChevronLeft className="h-4 w-4" aria-hidden />}
        onClick={onBack}
      >
        Back to my report
      </Button>
      {mode === "report" ? (
        <Button variant="ghost" color="neutral" size="sm" onClick={() => setMode("talk")}>
          Back to talking
        </Button>
      ) : (
        <div className="flex flex-col items-end gap-1">
          <Button color="primary" disabled={!canSubmit} loading={submitting} onClick={onSubmit}>
            {submitting ? "Submitting…" : "Submit my report"}
          </Button>
          {!canSubmit && submitHint && (
            <p className="text-xs text-base-content/55">{submitHint}</p>
          )}
        </div>
      )}
    </div>
  );

  const heading = (
    <h2 className="text-xl font-semibold">
      {mode === "report" ? "Help with my report" : "Talk it through"}
    </h2>
  );

  if (hasKey === false) {
    return (
      <section aria-label="Support" className="flex w-full max-w-xl flex-col gap-4 text-left">
        {heading}
        <p className="text-sm leading-relaxed text-base-content/75">
          This needs your own AI key, so the conversation runs on your account and
          stays private to you. Add it once and it works everywhere.
        </p>
        <Button
          color="primary"
          size="sm"
          className="w-fit"
          onClick={() => router.push("/aavahana/settings/ai-coach")}
        >
          Add my AI key
        </Button>
        {footer}
      </section>
    );
  }

  if (hasKey === null) {
    return (
      <section aria-label="Support" className="flex w-full max-w-xl flex-col gap-4 text-left">
        {heading}
        <p role="status" className="text-sm text-base-content/65">
          Getting this ready…
        </p>
        {footer}
      </section>
    );
  }

  if (mode === "report") {
    return (
      <section
        aria-label="Help with my report"
        data-clarity-mask="true"
        className="flex w-full max-w-xl flex-col gap-4 text-left"
      >
        {heading}
        <ReportHelp
          key={reportKey(report)}
          date={date}
          report={report}
          dictionaries={dictionaries}
          wentWellOptions={wentWellOptions}
          credentials={credentials}
          submitting={submitting}
          onUseDraft={onUseDraft}
          onSubmitDraft={onSubmitDraft}
        />
        {footer}
      </section>
    );
  }

  return (
    <section
      aria-label="Support"
      data-clarity-mask="true"
      className="flex w-full max-w-xl flex-col gap-4 text-left"
    >
      <div>
        {heading}
        <p className="mt-1 text-sm leading-relaxed text-base-content/65">
          Say whatever is on your mind. Your messages go to your AI provider to write
          each reply, and nothing here is saved or added to your report.
        </p>
      </div>

      {turns.length > 0 && (
        <div
          ref={log}
          role="log"
          aria-label="Your conversation"
          aria-live="polite"
          className="flex max-h-72 flex-col gap-3 overflow-y-auto"
        >
          {turns.map((turn, index) =>
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
                className={
                  turn.urgent
                    ? "alert alert-warning text-sm leading-relaxed"
                    : "max-w-md whitespace-pre-wrap break-words rounded-2xl bg-base-200 px-4 py-2 text-sm leading-relaxed"
                }
              >
                {turn.text}
              </p>
            ),
          )}
        </div>
      )}

      {reportHelpAvailable && (
        <Button
          variant="outline"
          color="neutral"
          size="sm"
          className="w-fit"
          iconBefore={<ClipboardList className="h-4 w-4" aria-hidden />}
          onClick={() => {
            setError("");
            setMode("report");
          }}
        >
          Help me with my report
        </Button>
      )}

      {/* Text only, deliberately. A microphone here would send private venting
          through the browser's own speech service as well as the AI provider,
          and the notice above would stop being true. */}
      <label htmlFor="support-message" className="sr-only">
        What&apos;s on your mind?
      </label>
      <div className="flex items-end gap-2">
        <textarea
          id="support-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send();
            }
          }}
          placeholder="What's on your mind? (Enter to send, Shift+Enter for a new line)"
          rows={2}
          maxLength={2000}
          autoFocus
          disabled={reply.isPending}
          className="textarea textarea-bordered flex-1 resize-none text-base leading-relaxed"
        />
        <Button
          color="primary"
          disabled={!message.trim() || reply.isPending}
          loading={reply.isPending}
          iconBefore={reply.isPending ? undefined : <SendIcon size="sm" />}
          onClick={send}
        >
          Send
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
      {footer}
    </section>
  );
}
