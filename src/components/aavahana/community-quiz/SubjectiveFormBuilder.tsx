"use client";

import { useState } from "react";
import { useCommunityQuizActions } from "@/lib/hooks/aavahana/use-community-quiz";
import { toast } from "@/utils";
import type { QuizQuestion } from "@/types/aavahana/community-quiz.types";

interface Props {
  quizId: number;
  questions: QuizQuestion[];
}

export function SubjectiveFormBuilder({ quizId, questions }: Props) {
  const actions = useCommunityQuizActions(quizId);
  const [newText, setNewText] = useState("");
  const [newContext, setNewContext] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editContext, setEditContext] = useState("");

  const handleAdd = async () => {
    if (!newText.trim()) return;
    const nextOrdinal = questions.length + 1;
    await actions.addQuestions({
      quizId,
      payload: { questions: [{ text: newText.trim(), context: newContext.trim() || undefined, ordinal: nextOrdinal }] },
    });
    setNewText("");
    setNewContext("");
  };

  const startEdit = (q: QuizQuestion) => {
    setEditingId(q.id);
    setEditText(q.text);
    setEditContext(q.context ?? "");
  };

  const saveEdit = async (questionId: number) => {
    if (!editText.trim()) {
      toast.error("Question text cannot be empty");
      return;
    }
    await actions.updateQuestion({
      quizId,
      questionId,
      updates: { text: editText.trim(), context: editContext.trim() || undefined },
    });
    setEditingId(null);
  };

  const handleMoveUp = async (idx: number) => {
    if (idx === 0) return;
    const reordered = [...questions];
    [reordered[idx - 1], reordered[idx]] = [reordered[idx], reordered[idx - 1]];
    const order = reordered.map((q, i) => ({ id: q.id, ordinal: i + 1 }));
    await actions.reorderQuestions({ quizId, order });
  };

  const handleMoveDown = async (idx: number) => {
    if (idx === questions.length - 1) return;
    const reordered = [...questions];
    [reordered[idx], reordered[idx + 1]] = [reordered[idx + 1], reordered[idx]];
    const order = reordered.map((q, i) => ({ id: q.id, ordinal: i + 1 }));
    await actions.reorderQuestions({ quizId, order });
  };

  return (
    <div className="p-4 rounded-xl border border-base-300 space-y-4">
      <h3 className="font-medium text-sm">Subjective Questions</h3>

      {questions.length === 0 && (
        <p className="text-xs dt-text-dim">No questions yet. Add one below.</p>
      )}

      <div className="space-y-2">
        {questions.map((q, idx) => (
          <div key={q.id} className="flex items-start gap-2 p-3 rounded-lg bg-base-200">
            {editingId === q.id ? (
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  className="input input-bordered input-sm w-full"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="Question text"
                />
                <input
                  type="text"
                  className="input input-bordered input-sm w-full"
                  value={editContext}
                  onChange={(e) => setEditContext(e.target.value)}
                  placeholder="Context (optional)"
                />
                <div className="flex gap-1">
                  <button className="btn btn-xs btn-primary" onClick={() => saveEdit(q.id)} disabled={actions.isUpdatingQuestion}>
                    Save
                  </button>
                  <button className="btn btn-xs btn-ghost" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <span className="text-xs font-bold text-primary mt-1">{q.ordinal}.</span>
                <div className="flex-1">
                  <p className="text-sm">{q.text}</p>
                  {q.context && <p className="text-xs dt-text-dim italic">{q.context}</p>}
                </div>
                <div className="flex flex-col gap-1">
                  <button className="btn btn-xs btn-ghost" onClick={() => handleMoveUp(idx)} disabled={idx === 0}>↑</button>
                  <button className="btn btn-xs btn-ghost" onClick={() => handleMoveDown(idx)} disabled={idx === questions.length - 1}>↓</button>
                  <button className="btn btn-xs btn-ghost" onClick={() => startEdit(q)}>✎</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-base-300 pt-3 space-y-2">
        <p className="text-xs font-medium">Add Question</p>
        <input
          type="text"
          className="input input-bordered input-sm w-full"
          placeholder="What did the speaker mean by…?"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
        />
        <input
          type="text"
          className="input input-bordered input-sm w-full"
          placeholder="Context hint (optional)"
          value={newContext}
          onChange={(e) => setNewContext(e.target.value)}
        />
        <button
          className="btn btn-sm btn-outline"
          onClick={handleAdd}
          disabled={actions.isAddingQuestions || !newText.trim()}
        >
          {actions.isAddingQuestions ? "Adding…" : "Add Question"}
        </button>
      </div>
    </div>
  );
}
