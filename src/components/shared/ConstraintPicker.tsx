"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon } from "@/components/shared/icons";
import { cn } from "@/utils";
import type { ConstraintEntry, ConstraintType } from "@/types";

const CONSTRAINT_LABELS: Record<ConstraintType, string> = {
  budget: "Budget",
  talent: "Talent",
  internal_support: "Internal Support",
  assumptions: "Assumptions",
  permissions: "Permissions",
};

const CONSTRAINT_DESCRIPTIONS: Record<ConstraintType, string> = {
  budget: "Lack of funds or financial resources",
  talent: "Missing skills, expertise, or headcount",
  internal_support: "Blocked by another team or stakeholder",
  assumptions: "An assumption proved wrong or unvalidated",
  permissions: "Access, approvals, or legal clearance needed",
};

interface ConstraintPickerProps {
  constraints: ConstraintEntry[];
  onChange: (constraints: ConstraintEntry[]) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * 5-type constraint picker for the bottleneck section of Daily Report.
 */
export function ConstraintPicker({
  constraints,
  onChange,
  disabled = false,
  className,
}: ConstraintPickerProps) {
  const [selectedType, setSelectedType] = useState<ConstraintType>("budget");
  const [description, setDescription] = useState("");
  const [ticketRef, setTicketRef] = useState("");

  function addConstraint() {
    if (!description.trim()) return;
    onChange([
      ...constraints,
      {
        type: selectedType,
        description: description.trim(),
        ticketRef: ticketRef.trim() || undefined,
      },
    ]);
    setDescription("");
    setTicketRef("");
  }

  function removeConstraint(index: number) {
    onChange(constraints.filter((_, i) => i !== index));
  }

  const typeOptions = Object.entries(CONSTRAINT_LABELS) as [
    ConstraintType,
    string
  ][];

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm font-medium opacity-70">Bottlenecks / Constraints</p>

      {constraints.length > 0 && (
        <ul className="space-y-2">
          {constraints.map((c, i) => (
            <li
              key={i}
              className="flex items-start gap-2 bg-base-200 rounded-lg px-3 py-2"
            >
              <span className="badge badge-outline badge-sm mt-0.5 shrink-0">
                {CONSTRAINT_LABELS[c.type]}
              </span>
              <span className="text-sm flex-1">{c.description}</span>
              {c.ticketRef && (
                <span className="text-xs opacity-50">#{c.ticketRef}</span>
              )}
              {!disabled && (
                <button
                  onClick={() => removeConstraint(i)}
                  className="btn btn-ghost btn-xs text-error shrink-0"
                  aria-label="Remove constraint"
                >
                  <TrashIcon size="xs" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!disabled && (
        <div className="space-y-2 border border-base-300 rounded-xl p-3">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as ConstraintType)}
            className="select select-sm select-bordered w-full"
          >
            {typeOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label} — {CONSTRAINT_DESCRIPTIONS[value]}
              </option>
            ))}
          </select>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the constraint…"
            className="textarea textarea-bordered textarea-sm w-full resize-none"
            rows={2}
          />

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={ticketRef}
              onChange={(e) => setTicketRef(e.target.value)}
              placeholder="Ticket # (optional)"
              className="input input-sm input-bordered flex-1"
            />
            <button
              onClick={addConstraint}
              disabled={!description.trim()}
              className="btn btn-sm btn-primary"
            >
              <PlusIcon size="sm" />
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
