"use client";

import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { Section } from "@/components/shared/Section";
import { ListCheckIcon } from "@/components/shared/icons";
import {
  usePlanQuestions,
  useSavePlanAnswers,
} from "@/lib/hooks/aavahana/use-weekly-transformation";
import type {
  WeeklyQuestion,
  QuestionAnswer,
} from "@/lib/services/aavahana/weekly-transformation.service";

type LocalAnswer = {
  text?: string;
  person?: string;
  change?: string;
  type?: string;
  detail?: string;
  answer?: string;
};

function buildValue(q: WeeklyQuestion, ans: LocalAnswer | undefined): unknown {
  if (!ans) return "";
  switch (q.type) {
    case "coaching_pick":
      return { person: ans.person ?? "", change: ans.change ?? "" };
    case "action_type_text":
      return { type: ans.type ?? "", detail: ans.detail ?? "" };
    case "yesno_text":
      return { answer: ans.answer ?? "", detail: ans.detail ?? "" };
    default:
      return ans.text ?? "";
  }
}

export function WeeklyPlanQuestions() {
  const { data, isLoading } = usePlanQuestions();
  const save = useSavePlanAnswers();
  const [answers, setAnswers] = useState<Record<string, LocalAnswer>>({});

  if (isLoading || !data || data.questions.length === 0) return null;

  const patch = (k: string, p: LocalAnswer) =>
    setAnswers((a) => ({ ...a, [k]: { ...a[k], ...p } }));

  const onSave = () => {
    const payload: QuestionAnswer[] = data.questions.map((q) => ({
      key: q.key,
      value: buildValue(q, answers[q.key]),
    }));
    save.mutate({ answers: payload, level: data.level });
  };

  return (
    <Section>
      <Section.Header
        icon={<ListCheckIcon size="sm" />}
        title="Plan your week"
        subtitle="A question or two to sharpen the week before you commit"
        size="sm"
      />
      <Section.Body>
        <div className="space-y-5">
      {data.questions.map((q) => {
        const ans = answers[q.key];
        return (
          <div key={q.key} className="space-y-2">
            <p className="text-sm font-medium text-black">{q.prompt}</p>

            {q.type === "coaching_pick" ? (
              <div className="flex gap-2 flex-wrap">
                <input
                  placeholder="Who?"
                  value={ans?.person ?? ""}
                  onChange={(e) => patch(q.key, { person: e.target.value })}
                  className="input input-bordered input-sm flex-1 min-w-[8rem]"
                />
                <input
                  placeholder="On what?"
                  value={ans?.change ?? ""}
                  onChange={(e) => patch(q.key, { change: e.target.value })}
                  className="input input-bordered input-sm flex-[2] min-w-[10rem]"
                />
              </div>
            ) : q.type === "action_type_text" ? (
              <div className="space-y-2">
                <select
                  value={ans?.type ?? ""}
                  onChange={(e) => patch(q.key, { type: e.target.value })}
                  className="select select-bordered select-sm w-full max-w-xs"
                >
                  <option value="">Action…</option>
                  {(q.options ?? []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Specifically…"
                  value={ans?.detail ?? ""}
                  maxLength={q.maxLen ?? 240}
                  onChange={(e) => patch(q.key, { detail: e.target.value })}
                  className="input input-bordered input-sm w-full"
                />
              </div>
            ) : q.type === "yesno_text" ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  {["Yes", "No"].map((c) => (
                    <Button
                      key={c}
                      color="primary"
                      variant={ans?.answer === c ? undefined : "outline"}
                      size="xs"
                      onClick={() => patch(q.key, { answer: c })}
                    >
                      {c}
                    </Button>
                  ))}
                </div>
                {ans?.answer === "Yes" && (
                  <input
                    placeholder="What decision does V4 need to make?"
                    value={ans?.detail ?? ""}
                    onChange={(e) => patch(q.key, { detail: e.target.value })}
                    className="input input-bordered input-sm w-full"
                  />
                )}
              </div>
            ) : q.type === "basket_pick" ? (
              <input
                placeholder="Name the item that holds up the most other work"
                value={ans?.text ?? ""}
                onChange={(e) => patch(q.key, { text: e.target.value })}
                className="input input-bordered input-sm w-full"
              />
            ) : (
              <textarea
                placeholder="Your answer…"
                value={ans?.text ?? ""}
                maxLength={q.maxLen ?? 240}
                rows={2}
                onChange={(e) => patch(q.key, { text: e.target.value })}
                className="textarea textarea-bordered textarea-sm w-full"
              />
            )}
          </div>
        );
      })}

      <div className="flex gap-2 items-center">
        <Button color="primary" size="sm" loading={save.isPending} onClick={onSave}>
          Save
        </Button>
        {save.isSuccess && <span className="text-xs text-success">Saved ✓</span>}
      </div>
        </div>
      </Section.Body>
    </Section>
  );
}
