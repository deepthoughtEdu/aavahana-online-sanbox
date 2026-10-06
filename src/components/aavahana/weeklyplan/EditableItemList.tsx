"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { cn } from "@/utils";
import { containerPadding } from "@/utils/shared/design.utils";
import type { PlanTask } from "@/types/aavahana/weekly-plan-editor.types";

interface Props {
  items: PlanTask[];
  isGenerating: boolean;
  isLoading: boolean;
  generatingLabel?: string;
  emptyMessage: string;
  placeholder: string;
  addLabel: string;
  onUpdate: (id: string, label: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

/**
 * A generic editable list (one text field per row + add/remove). Reused on the
 * Weekly Plan screen for both the deliverable tasks and the risks/blockers.
 * Shows a "creating your plan" state while the AI generates.
 */
export function EditableItemList({
  items,
  isGenerating,
  isLoading,
  generatingLabel = "Creating your plan…",
  emptyMessage,
  placeholder,
  addLabel,
  onUpdate,
  onAdd,
  onRemove,
}: Props) {
  if (isGenerating) {
    return (
      <div className={cn("text-center text-neutral text-sm py-10", containerPadding.md)}>
        <div className="w-8 h-8 border-[3px] border-base-300 border-t-primary rounded-full mx-auto mb-3 animate-spin" />
        {generatingLabel}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn("text-center text-neutral text-sm py-10", containerPadding.md)}>
        Loading…
      </div>
    );
  }

  return (
    <div>
      {items.length === 0 ? (
        <div className={cn("text-center text-neutral text-sm py-6", containerPadding.md)}>
          {emptyMessage}
        </div>
      ) : (
        <ul className="divide-y divide-base-300">
          {items.map((it) => (
            <li key={it.id} className="px-4 py-2 flex items-center gap-2">
              <input
                value={it.label}
                onChange={(e) => onUpdate(it.id, e.target.value)}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-sm text-black focus:outline-none py-1"
              />
              <button
                type="button"
                onClick={() => onRemove(it.id)}
                aria-label="Remove"
                className="btn btn-ghost btn-xs btn-circle text-neutral hover:text-error"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={cn("pt-2", containerPadding.md)}>
        <Button
          variant="ghost"
          color="primary"
          size="sm"
          onClick={onAdd}
          iconBefore={<Plus size={16} />}
        >
          {addLabel}
        </Button>
      </div>
    </div>
  );
}
