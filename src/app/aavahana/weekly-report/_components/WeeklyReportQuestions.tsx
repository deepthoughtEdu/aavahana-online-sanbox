"use client";

import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { Section } from "@/components/shared/Section";
import { CalendarIcon } from "@/components/shared/icons";
import {
  useReportQuestions,
  useSaveReportAnswers,
  useFileRecurringConstraint,
} from "@/lib/hooks/aavahana/use-weekly-transformation";
import type {
  WeeklyQuestion,
  QuestionAnswer,
} from "@/lib/services/aavahana/weekly-transformation.service";

// Choice sets for the structured calibration/closure question types.
const CHOICE_SETS: Record<string, string[]> = {
  yesnopartial_text: ["Yes", "No", "Partially"],
  worked_partial_didnt_text: ["Worked", "Partially", "Didn't"],
  happened_helped_text: ["Happened & helped", "Happened, didn't help", "Didn't happen"],
};

type LocalAnswer = { choice?: string; note?: string; text?: string };

function buildValue(q: WeeklyQuestion, ans: LocalAnswer | undefined): unknown {
  if (!ans) return "";
  if (CHOICE_SETS[q.type] || q.type === "cause_text") {
    return { choice: ans.choice ?? "", note: ans.note ?? "" };
  }
  return ans.text ?? "";
}

export function WeeklyReportQuestions({ weekStart }: { weekStart: string }) {
  const { data, isLoading } = useReportQuestions(undefined, weekStart);
  const save = useSaveReportAnswers();
  const fileConstraint = useFileRecurringConstraint();
  const [answers, setAnswers] = useState<Record<string, LocalAnswer>>({});

  if (isLoading || !data || data.questions.length === 0) return null;

  const patch = (k: string, p: LocalAnswer) =>
    setAnswers((a) => ({ ...a, [k]: { ...a[k], ...p } }));

  const onSave = () => {
    const payload: QuestionAnswer[] = data.questions.map((q) => ({
      key: q.key,
      value: buildValue(q, answers[q.key]),
      refPlanKey: q.refPlanKey,
    }));
    save.mutate({ weekStart, answers: payload });
  };

  return (
    <Section>
      <Section.Header
        icon={<CalendarIcon size="sm" />}
        title="Close the week"
        subtitle="A couple of questions to calibrate what you planned against what happened"
        size="sm"
      />
      <Section.Body>
        <div className="space-y-5">
      {data.questions.map((q) => {
        const choices = CHOICE_SETS[q.type];
        const ans = answers[q.key];
        return (
          <div key={q.key} className="space-y-2">
            <p className="text-sm font-medium text-black">{q.prompt}</p>

            {q.type === "cause_text" && (
              <select
                value={ans?.choice ?? ""}
                onChange={(e) => patch(q.key, { choice: e.target.value })}
                className="select select-bordered select-sm w-full max-w-xs"
              >
                <option value="">Cause…</option>
                {(q.options ?? []).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            )}

            {choices && (
              <div className="flex gap-2 flex-wrap">
                {choices.map((c) => (
                  <Button
                    key={c}
                    color="primary"
                    variant={ans?.choice === c ? undefined : "outline"}
                    size="xs"
                    onClick={() => patch(q.key, { choice: c })}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            )}

            {choices || q.type === "cause_text" ? (
              <input
                value={ans?.note ?? ""}
                onChange={(e) => patch(q.key, { note: e.target.value })}
                maxLength={q.maxLen ?? 120}
                placeholder="One line…"
                className="input input-bordered input-sm w-full"
              />
            ) : (
              <textarea
                value={ans?.text ?? ""}
                onChange={(e) => patch(q.key, { text: e.target.value })}
                maxLength={q.maxLen ?? 240}
                rows={2}
                placeholder="Your answer…"
                className="textarea textarea-bordered textarea-sm w-full"
              />
            )}
          </div>
        );
      })}

      <div className="flex gap-2 items-center flex-wrap">
        <Button color="primary" size="sm" loading={save.isPending} onClick={onSave}>
          Save answers
        </Button>
        {save.isSuccess && <span className="text-xs text-success">Saved ✓</span>}

        <Button
          color="neutral"
          variant="ghost"
          size="sm"
          loading={fileConstraint.isPending}
          onClick={() => fileConstraint.mutate({})}
        >
          File recurring constraint
        </Button>
        {fileConstraint.isSuccess &&
          (fileConstraint.data?.recurring ? (
            <span className="text-xs text-success">
              Filed “{fileConstraint.data.initiative?.title}” as a Spotted improvement
            </span>
          ) : (
            <span className="text-xs dt-text-dim">No recurring constraint yet</span>
          ))}
      </div>
        </div>
      </Section.Body>
    </Section>
  );
}
