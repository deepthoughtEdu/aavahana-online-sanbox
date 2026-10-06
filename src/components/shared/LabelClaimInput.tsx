"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon } from "@/components/shared/icons";
import { cn } from "@/utils";
import type { LabelClaim, ProgramLabel } from "@/types";

interface LabelClaimInputProps {
  claims: LabelClaim[];
  availableLabels: ProgramLabel[];
  onChange: (claims: LabelClaim[]) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Number + Label picker for framework/process claims.
 * Renders as a list of (quantity, label) pairs with add/remove controls.
 * Used in Daily Plan, Daily Report, Weekly Plan.
 */
export function LabelClaimInput({
  claims,
  availableLabels,
  onChange,
  label = "Claims",
  disabled = false,
  className,
}: LabelClaimInputProps) {
  const [selectedLabelId, setSelectedLabelId] = useState("");
  const [quantity, setQuantity] = useState(1);

  function addClaim() {
    if (!selectedLabelId) return;
    const found = availableLabels.find((l) => l.id === selectedLabelId);
    if (!found) return;

    const existing = claims.findIndex((c) => c.labelId === selectedLabelId);
    if (existing >= 0) {
      const updated = [...claims];
      updated[existing] = {
        ...updated[existing],
        quantity: updated[existing].quantity + quantity,
      };
      onChange(updated);
    } else {
      onChange([
        ...claims,
        { labelId: found.id, labelName: found.name, quantity },
      ]);
    }

    setSelectedLabelId("");
    setQuantity(1);
  }

  function removeClaim(labelId: string) {
    onChange(claims.filter((c) => c.labelId !== labelId));
  }

  function updateQuantity(labelId: string, qty: number) {
    if (qty <= 0) {
      removeClaim(labelId);
      return;
    }
    onChange(
      claims.map((c) => (c.labelId === labelId ? { ...c, quantity: qty } : c))
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium opacity-70">{label}</p>

      {claims.length > 0 && (
        <ul className="space-y-1">
          {claims.map((claim) => (
            <li
              key={claim.labelId}
              className="flex items-center gap-2 bg-base-200 rounded-lg px-3 py-2"
            >
              <input
                type="number"
                min={1}
                max={99}
                value={claim.quantity}
                onChange={(e) =>
                  updateQuantity(claim.labelId, Number(e.target.value))
                }
                disabled={disabled}
                className="input input-xs input-bordered w-16"
              />
              <span className="text-sm flex-1">× {claim.labelName}</span>
              {!disabled && (
                <button
                  onClick={() => removeClaim(claim.labelId)}
                  className="btn btn-ghost btn-xs text-error"
                  aria-label="Remove claim"
                >
                  <TrashIcon size="xs" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!disabled && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={99}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="input input-sm input-bordered w-16"
            placeholder="Qty"
          />
          <select
            value={selectedLabelId}
            onChange={(e) => setSelectedLabelId(e.target.value)}
            className="select select-sm select-bordered flex-1"
          >
            <option value="">Select label…</option>
            {availableLabels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <button
            onClick={addClaim}
            disabled={!selectedLabelId}
            className="btn btn-sm btn-primary"
            aria-label="Add claim"
          >
            <PlusIcon size="sm" />
          </button>
        </div>
      )}
    </div>
  );
}
