"use client";

import { useState } from "react";
import { cn } from "@/utils";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import type { IPGoal, IPZone } from "@/types";

interface IPGoalsSectionProps {
  goals: IPGoal[];
  onChange: (goals: IPGoal[]) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * IP goals section for Weekly Plan — commit targets per IP item/zone.
 * Module 3 (Weekly Plan) — NEW per PDGMS v4.0.
 */
export function IPGoalsSection({
  goals,
  onChange,
  disabled = false,
  className,
}: IPGoalsSectionProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState(1);
  const [newZone, setNewZone] = useState<IPZone>("program");

  function addGoal() {
    if (!newTitle.trim()) return;
    onChange([
      ...goals,
      {
        title: newTitle.trim(),
        targetCommitCount: newTarget,
        zone: newZone,
      },
    ]);
    setNewTitle("");
    setNewTarget(1);
    setNewZone("program");
  }

  function removeGoal(index: number) {
    onChange(goals.filter((_, i) => i !== index));
  }

  function updateTarget(index: number, target: number) {
    onChange(
      goals.map((g, i) => (i === index ? { ...g, targetCommitCount: Math.max(1, target) } : g))
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm font-medium opacity-70">IP Goals This Week</p>

      {goals.length === 0 ? (
        <p className="text-sm opacity-40">No IP goals set yet.</p>
      ) : (
        <ul className="space-y-2">
          {goals.map((goal, i) => (
            <li
              key={i}
              className="flex items-center gap-2 bg-base-200 rounded-xl px-3 py-2"
            >
              <Badge variant="neutral" size="sm" icon={null} label={goal.zone === "myzone" ? "MyZone" : "Program"} />
              <span className="text-sm flex-1">{goal.title}</span>
              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={goal.targetCommitCount}
                  onChange={(e) => updateTarget(i, Number(e.target.value))}
                  disabled={disabled}
                  className="input input-xs input-bordered w-14"
                />
                <span className="text-xs opacity-50">commits</span>
              </div>
              {!disabled && (
                <Button
                  variant="ghost"
                  size="xs"
                  color="error"
                  onClick={() => removeGoal(i)}
                >
                  ✕
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!disabled && (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="IP item title…"
            className="input input-sm input-bordered flex-1 min-w-40"
          />
          <select
            value={newZone}
            onChange={(e) => setNewZone(e.target.value as IPZone)}
            className="select select-sm select-bordered"
          >
            <option value="program">Program</option>
            <option value="myzone">MyZone</option>
          </select>
          <input
            type="number"
            min={1}
            max={20}
            value={newTarget}
            onChange={(e) => setNewTarget(Number(e.target.value))}
            className="input input-sm input-bordered w-16"
            title="Target commit count"
          />
          <Button
            color="primary"
            size="sm"
            onClick={addGoal}
            disabled={!newTitle.trim()}
          >
            + Add
          </Button>
        </div>
      )}
    </div>
  );
}
