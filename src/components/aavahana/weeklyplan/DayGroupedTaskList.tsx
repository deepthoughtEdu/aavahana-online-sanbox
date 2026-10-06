"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { cn } from "@/utils";
import { containerPadding } from "@/utils/shared/design.utils";
import type { PlanTask } from "@/types/aavahana/weekly-plan-editor.types";

// Working days of the planned week (Mon–Fri).
const DAYS: { key: string; label: string; full: string }[] = [
  { key: "mon", label: "Mon", full: "Monday" },
  { key: "tue", label: "Tue", full: "Tuesday" },
  { key: "wed", label: "Wed", full: "Wednesday" },
  { key: "thu", label: "Thu", full: "Thursday" },
  { key: "fri", label: "Fri", full: "Friday" },
];
const DAY_KEYS = DAYS.map((d) => d.key);

function isUnscheduled(t: PlanTask): boolean {
  return !t.day || !DAY_KEYS.includes(t.day);
}
function groupLabel(key: string): string {
  const d = DAYS.find((x) => x.key === key);
  return d ? d.full : "Unscheduled";
}

interface Props {
  tasks: PlanTask[];
  isGenerating: boolean;
  isLoading: boolean;
  onUpdate: (id: string, label: string) => void;
  onUpdateDay: (id: string, day: string | null) => void;
  onAdd: (day?: string | null) => void;
  onRemove: (id: string) => void;
}

/**
 * The week's deliverables grouped by day. A clickable D1–D5 strip filters the
 * list to a single day (or "All"); tasks can be dragged onto a day in the strip
 * to move them. The AI assigns each task's day; the user edits the text.
 */
export function DayGroupedTaskList({
  tasks,
  isGenerating,
  isLoading,
  onUpdate,
  onUpdateDay,
  onAdd,
  onRemove,
}: Props) {
  // null = "All"; "" = Unscheduled; otherwise a day key.
  const [filter, setFilter] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  if (isGenerating) {
    return (
      <div className={cn("text-center text-neutral text-sm py-10", containerPadding.md)}>
        <div className="w-8 h-8 border-[3px] border-base-300 border-t-primary rounded-full mx-auto mb-3 animate-spin" />
        Creating your plan…
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className={cn("text-center text-neutral text-sm py-10", containerPadding.md)}>
        Loading your plan…
      </div>
    );
  }

  const countFor = (key: string) =>
    tasks.filter((t) => (key === "" ? isUnscheduled(t) : t.day === key)).length;
  const unscheduledCount = countFor("");

  const dropOnDay = (key: string) => {
    if (dragId) onUpdateDay(dragId, key || null);
    setDragId(null);
    setDropTarget(null);
  };

  // A draggable, editable task row.
  const Row = ({ t }: { t: PlanTask }) => (
    <li
      draggable
      onDragStart={() => setDragId(t.id)}
      onDragEnd={() => {
        setDragId(null);
        setDropTarget(null);
      }}
      className="flex items-center gap-2 cursor-grab active:cursor-grabbing"
    >
      <span className="text-neutral shrink-0">•</span>
      <input
        value={t.label}
        onChange={(e) => onUpdate(t.id, e.target.value)}
        placeholder="Describe a task…"
        className="flex-1 bg-transparent text-sm text-black focus:outline-none py-1"
      />
      <button
        type="button"
        onClick={() => onRemove(t.id)}
        aria-label="Remove task"
        className="btn btn-ghost btn-xs btn-circle text-neutral hover:text-error shrink-0"
      >
        <X size={14} />
      </button>
    </li>
  );

  // ── Day filter strip (also drop targets for moving tasks) ──
  const chips: { key: string | null; dropKey: string; label: string; count: number | null }[] = [
    { key: null, dropKey: "__none__", label: "All", count: null },
    ...DAYS.map((d) => ({ key: d.key, dropKey: d.key, label: d.label, count: countFor(d.key) })),
  ];
  if (unscheduledCount > 0) {
    chips.push({ key: "", dropKey: "", label: "Unscheduled", count: unscheduledCount });
  }

  const strip = (
    <div className={cn("flex flex-wrap gap-1.5 pt-3 pb-1", containerPadding.md)}>
      {chips.map((c) => {
        const droppable = c.dropKey !== "__none__";
        const isActive = filter === c.key;
        return (
          <button
            key={c.label}
            type="button"
            onClick={() => setFilter(c.key)}
            onDragOver={droppable ? (e) => { e.preventDefault(); setDropTarget(c.dropKey); } : undefined}
            onDragLeave={droppable ? () => setDropTarget((p) => (p === c.dropKey ? null : p)) : undefined}
            onDrop={droppable ? () => dropOnDay(c.dropKey) : undefined}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-medium border transition-colors",
              isActive
                ? "bg-primary text-primary-content border-primary"
                : "bg-base-100 text-neutral border-base-300 hover:border-primary",
              dropTarget === c.dropKey && droppable && "ring-2 ring-primary ring-offset-1",
            )}
            title={droppable && dragId ? "Drop to move here" : undefined}
          >
            {c.label}
            {c.count != null && c.count > 0 && (
              <span className="ml-1 opacity-70">{c.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );

  // ── Body ──
  let body;
  if (tasks.length === 0) {
    body = (
      <div className={cn("text-center text-neutral text-sm py-6", containerPadding.md)}>
        No tasks yet — add one below, or generate a plan from “Plan Your Week”.
      </div>
    );
  } else if (filter === null) {
    // Grouped by day (only days that have tasks).
    const groups = [
      ...DAYS.map((d) => ({ key: d.key, items: tasks.filter((t) => t.day === d.key) })),
      { key: "", items: tasks.filter(isUnscheduled) },
    ].filter((g) => g.items.length > 0);
    body = (
      <div>
        {groups.map((g) => (
          <div key={g.key || "unscheduled"} className="px-4 py-2">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral mb-1">
              {groupLabel(g.key)}
            </p>
            <ul className="space-y-1">
              {g.items.map((t) => (
                <Row key={t.id} t={t} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  } else {
    // Single selected day.
    const items = tasks.filter((t) => (filter === "" ? isUnscheduled(t) : t.day === filter));
    body = (
      <div className="px-4 py-2">
        <p className="text-xs font-bold uppercase tracking-wider text-neutral mb-1">
          {groupLabel(filter)}
        </p>
        {items.length === 0 ? (
          <p className="text-sm text-neutral italic py-2">Nothing for this day yet.</p>
        ) : (
          <ul className="space-y-1">
            {items.map((t) => (
              <Row key={t.id} t={t} />
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="pb-1">
      {strip}
      {body}
      <div className={cn("pt-2", containerPadding.md)}>
        <Button
          variant="ghost"
          color="primary"
          size="sm"
          onClick={() => onAdd(filter && filter !== "" ? filter : null)}
          iconBefore={<Plus size={16} />}
        >
          {filter && filter !== "" ? `Add task to ${groupLabel(filter)}` : "Add task"}
        </Button>
      </div>
    </div>
  );
}
