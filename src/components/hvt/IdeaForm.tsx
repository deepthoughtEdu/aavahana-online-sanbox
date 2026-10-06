"use client";

import React, { useState } from "react";
import type { SubmitIdeaPayload } from "@/types/shared/hvt.types";
import { submitIdeaSchema } from "@/validations/hvt/hvt.validations";

interface IdeaFormProps {
  programs: Array<{ id: string; name: string }>;
  onSubmit: (payload: SubmitIdeaPayload) => void;
  isSubmitting?: boolean;
}

export function IdeaForm({ programs, onSubmit, isSubmitting }: IdeaFormProps) {
  const [form, setForm] = useState<Partial<SubmitIdeaPayload>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: keyof SubmitIdeaPayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = submitIdeaSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    onSubmit(result.data);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-[600px]">
      <h3 className="text-lg font-bold text-base-content mb-4">
        Share an Idea
      </h3>

      {/* Emotional framing */}
      <div className="px-4 py-3 rounded-xl bg-base-200 border border-base-300 mb-5 text-sm dt-text-dim leading-relaxed">
        You&apos;ve noticed something that could work better — that&apos;s exactly what this is for. Describe what you&apos;d change and why. Your TPM will review it and decide whether to run it as an experiment. Every idea is acknowledged, whether it runs or not.
      </div>

      {/* Program selector */}
      <Field label="Program" error={errors.programId}>
        <select
          value={form.programId ?? ""}
          onChange={(e) => update("programId", e.target.value)}
          className="select select-bordered select-sm w-full"
        >
          <option value="">Select a program…</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </Field>

      {/* Title */}
      <Field label="Experiment Title" error={errors.title}>
        <input
          type="text"
          value={form.title ?? ""}
          onChange={(e) => update("title", e.target.value)}
          placeholder="Short name for this experiment idea…"
          className="input input-bordered input-sm w-full"
        />
      </Field>

      {/* Hypothesis */}
      <Field
        label="What you think will happen"
        hint="If we try [change], then [outcome] should improve, because [reason]"
        error={errors.hypothesis}
      >
        <textarea
          value={form.hypothesis ?? ""}
          onChange={(e) => update("hypothesis", e.target.value)}
          placeholder="If we change X, then Y will improve because Z…"
          rows={3}
          className="textarea textarea-bordered textarea-sm w-full resize-y"
        />
      </Field>

      {/* Variants */}
      <Field label="Current approach (what we do now) — optional">
        <input
          type="text"
          value={form.suggestedVariantA ?? ""}
          onChange={(e) => update("suggestedVariantA", e.target.value)}
          placeholder="Describe the current approach…"
          className="input input-bordered input-sm w-full"
        />
      </Field>

      <Field label="Proposed change (what you'd try instead) — optional">
        <input
          type="text"
          value={form.suggestedVariantB ?? ""}
          onChange={(e) => update("suggestedVariantB", e.target.value)}
          placeholder="Describe what you'd try instead…"
          className="input input-bordered input-sm w-full"
        />
      </Field>

      {/* Rationale */}
      <Field label="Why this matters" hint="Why this experiment would be valuable" error={errors.rationale}>
        <textarea
          value={form.rationale ?? ""}
          onChange={(e) => update("rationale", e.target.value)}
          placeholder="Explain why this experiment would be valuable…"
          rows={3}
          className="textarea textarea-bordered textarea-sm w-full resize-y"
        />
      </Field>

      {/* Cell ref. Canonical form is ASCII ("V1xH5"). The placeholder used to show
          a multiplication sign, which is not on anyone's keyboard, so typing the
          obvious "V1xH5" was rejected. The backend now accepts x, X or × and
          normalises, and this no longer asks for a character you cannot type. */}
      <Field label="Grid Cell Reference (optional)" hint="e.g. V1xH5">
        <input
          type="text"
          value={form.cellRef ?? ""}
          onChange={(e) => update("cellRef", e.target.value)}
          placeholder="V1xH5"
          className="input input-bordered input-sm w-full"
        />
      </Field>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn btn-primary btn-sm mt-2"
      >
        {isSubmitting ? "Submitting…" : "Share This Idea"}
      </button>
    </form>
  );
}

function Field({ label, hint, error, children }: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-bold text-base-content mb-1">
        {label}
      </label>
      {hint && <div className="text-[11px] dt-text-dim mb-1">{hint}</div>}
      {children}
      {error && <div className="text-[11px] text-error mt-0.5">{error}</div>}
    </div>
  );
}

