"use client";

import { useState } from "react";
import { useCommunityQuizActions } from "@/lib/hooks/aavahana/use-community-quiz";
import { toast } from "@/utils";
import type { QuizMcq, McqOption, BaitType } from "@/types/aavahana/community-quiz.types";

interface Props {
  quizId: number;
  mcqs: QuizMcq[];
}

const BAIT_TYPES: BaitType[] = [
  "CORRECT",
  "VIRTUE_BAIT",
  "VICE_BAIT",
  "OVERGENERALIZATION",
  "EMOTIONAL_APPEAL",
  "STRAW_MAN",
  "FALSE_PRECISION",
  "ASSUMPTION_INJECTION",
];

const BAIT_LABELS: Record<BaitType, string> = {
  CORRECT: "Correct",
  VIRTUE_BAIT: "Virtue Bait",
  VICE_BAIT: "Vice Bait",
  OVERGENERALIZATION: "Overgeneralization",
  EMOTIONAL_APPEAL: "Emotional Appeal",
  STRAW_MAN: "Straw Man",
  FALSE_PRECISION: "False Precision",
  ASSUMPTION_INJECTION: "Assumption Injection",
};

interface DraftOption {
  id: string;
  text: string;
  baitType: BaitType;
}

export function McqFormBuilder({ quizId, mcqs }: Props) {
  const actions = useCommunityQuizActions(quizId);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStem, setEditStem] = useState("");
  const [editOptions, setEditOptions] = useState<DraftOption[]>([]);

  const [newStem, setNewStem] = useState("");
  const [newOptions, setNewOptions] = useState<DraftOption[]>([
    { id: "a", text: "", baitType: "CORRECT" },
    { id: "b", text: "", baitType: "VIRTUE_BAIT" },
  ]);

  const startEdit = (mcq: QuizMcq) => {
    setEditingId(mcq.id);
    setEditStem(mcq.stem);
    setEditOptions(mcq.options.map((o) => ({ id: o.id, text: o.text, baitType: o.baitType })));
  };

  const saveEdit = async (mcqId: number) => {
    if (!editStem.trim()) {
      toast.error("Stem cannot be empty");
      return;
    }
    if (editOptions.some((o) => !o.text.trim())) {
      toast.error("All options need text");
      return;
    }
    await actions.updateMcq({
      quizId,
      mcqId,
      updates: { stem: editStem.trim(), options: editOptions as McqOption[] },
    });
    setEditingId(null);
  };

  const updateEditOption = (idx: number, field: keyof DraftOption, value: string) => {
    setEditOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, [field]: value } : o)));
  };

  const addEditOption = () => {
    const nextId = String.fromCharCode(97 + editOptions.length);
    setEditOptions((prev) => [...prev, { id: nextId, text: "", baitType: "VIRTUE_BAIT" }]);
  };

  const removeEditOption = (idx: number) => {
    if (editOptions.length <= 2) return;
    setEditOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateNewOption = (idx: number, field: keyof DraftOption, value: string) => {
    setNewOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, [field]: value } : o)));
  };

  const addNewOption = () => {
    const nextId = String.fromCharCode(97 + newOptions.length);
    setNewOptions((prev) => [...prev, { id: nextId, text: "", baitType: "VIRTUE_BAIT" }]);
  };

  const removeNewOption = (idx: number) => {
    if (newOptions.length <= 2) return;
    setNewOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddMcq = async () => {
    if (!newStem.trim()) {
      toast.error("Stem is required");
      return;
    }
    if (newOptions.some((o) => !o.text.trim())) {
      toast.error("All options need text");
      return;
    }
    if (!newOptions.some((o) => o.baitType === "CORRECT")) {
      toast.error("At least one option must be marked CORRECT");
      return;
    }
    const nextOrdinal = mcqs.length + 1;
    await actions.addMcqs({
      quizId,
      payload: {
        mcqs: [{ stem: newStem.trim(), ordinal: nextOrdinal, options: newOptions as McqOption[] }],
      },
    });
    setNewStem("");
    setNewOptions([
      { id: "a", text: "", baitType: "CORRECT" },
      { id: "b", text: "", baitType: "VIRTUE_BAIT" },
    ]);
  };

  const handleMoveUp = async (idx: number) => {
    if (idx === 0) return;
    const reordered = [...mcqs];
    [reordered[idx - 1], reordered[idx]] = [reordered[idx], reordered[idx - 1]];
    const order = reordered.map((m, i) => ({ id: m.id, ordinal: i + 1 }));
    await actions.reorderMcqs({ quizId, order });
  };

  const handleMoveDown = async (idx: number) => {
    if (idx === mcqs.length - 1) return;
    const reordered = [...mcqs];
    [reordered[idx], reordered[idx + 1]] = [reordered[idx + 1], reordered[idx]];
    const order = reordered.map((m, i) => ({ id: m.id, ordinal: i + 1 }));
    await actions.reorderMcqs({ quizId, order });
  };

  return (
    <div className="p-4 rounded-xl border border-base-300 space-y-4">
      <h3 className="font-medium text-sm">MCQ Builder</h3>

      {mcqs.length === 0 && (
        <p className="text-xs dt-text-dim">No MCQs yet. Build one below.</p>
      )}

      <div className="space-y-3">
        {mcqs.map((mcq, idx) => (
          <div key={mcq.id} className="p-3 rounded-lg bg-base-200 space-y-2">
            {editingId === mcq.id ? (
              <div className="space-y-2">
                <input
                  type="text"
                  className="input input-bordered input-sm w-full"
                  value={editStem}
                  onChange={(e) => setEditStem(e.target.value)}
                  placeholder="Question stem"
                />
                {editOptions.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <span className="text-xs font-bold w-4">{opt.id}.</span>
                    <input
                      type="text"
                      className="input input-bordered input-xs flex-1"
                      value={opt.text}
                      onChange={(e) => updateEditOption(oi, "text", e.target.value)}
                      placeholder="Option text"
                    />
                    <select
                      className="select select-bordered select-xs"
                      value={opt.baitType}
                      onChange={(e) => updateEditOption(oi, "baitType", e.target.value)}
                    >
                      {BAIT_TYPES.map((bt) => (
                        <option key={bt} value={bt}>{BAIT_LABELS[bt]}</option>
                      ))}
                    </select>
                    <button className="btn btn-xs btn-ghost text-error" onClick={() => removeEditOption(oi)} disabled={editOptions.length <= 2}>×</button>
                  </div>
                ))}
                <div className="flex gap-1">
                  <button className="btn btn-xs btn-ghost" onClick={addEditOption}>+ Option</button>
                  <button className="btn btn-xs btn-primary" onClick={() => saveEdit(mcq.id)} disabled={actions.isUpdatingMcq}>Save</button>
                  <button className="btn btn-xs btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-primary mt-1">{mcq.ordinal}.</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{mcq.stem}</p>
                  <div className="mt-1 space-y-0.5">
                    {mcq.options.map((opt) => (
                      <div key={opt.id} className="flex items-center gap-2 text-xs">
                        <span className={`badge badge-xs ${opt.baitType === "CORRECT" ? "badge-success" : "badge-warning"}`}>
                          {opt.id}
                        </span>
                        <span>{opt.text}</span>
                        <span className="dt-text-dim">({BAIT_LABELS[opt.baitType]})</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <button className="btn btn-xs btn-ghost" onClick={() => handleMoveUp(idx)} disabled={idx === 0}>↑</button>
                  <button className="btn btn-xs btn-ghost" onClick={() => handleMoveDown(idx)} disabled={idx === mcqs.length - 1}>↓</button>
                  <button className="btn btn-xs btn-ghost" onClick={() => startEdit(mcq)}>✎</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-base-300 pt-3 space-y-2">
        <p className="text-xs font-medium">Add MCQ</p>
        <input
          type="text"
          className="input input-bordered input-sm w-full"
          placeholder="What did the speaker mean by…?"
          value={newStem}
          onChange={(e) => setNewStem(e.target.value)}
        />
        {newOptions.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-xs font-bold w-4">{opt.id}.</span>
            <input
              type="text"
              className="input input-bordered input-xs flex-1"
              value={opt.text}
              onChange={(e) => updateNewOption(idx, "text", e.target.value)}
              placeholder="Option text"
            />
            <select
              className="select select-bordered select-xs"
              value={opt.baitType}
              onChange={(e) => updateNewOption(idx, "baitType", e.target.value)}
            >
              {BAIT_TYPES.map((bt) => (
                <option key={bt} value={bt}>{BAIT_LABELS[bt]}</option>
              ))}
            </select>
            <button className="btn btn-xs btn-ghost text-error" onClick={() => removeNewOption(idx)} disabled={newOptions.length <= 2}>×</button>
          </div>
        ))}
        <div className="flex gap-2">
          <button className="btn btn-xs btn-ghost" onClick={addNewOption}>+ Option</button>
          <button
            className="btn btn-sm btn-outline"
            onClick={handleAddMcq}
            disabled={actions.isAddingMcqs || !newStem.trim()}
          >
            {actions.isAddingMcqs ? "Adding…" : "Add MCQ"}
          </button>
        </div>
      </div>
    </div>
  );
}
