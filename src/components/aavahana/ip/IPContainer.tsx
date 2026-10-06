"use client";

import { useState } from "react";
import { cn } from "@/utils";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import type { MonthlyIPGoal } from "@/types/aavahana/monthly-plan.types";
import type { UseIPReturn, IPGoalHistory } from "@/lib/hooks/aavahana/use-ip";

interface IPContainerProps {
  ipData: UseIPReturn;
}

export function IPContainer({ ipData }: IPContainerProps) {
  const {
    monthLabel,
    goToPrevMonth,
    goToNextMonth,
    ipGoals,
    filteredGoals,
    ipSummary,
    weeklySummaries,
    planStatus,
    goalHistory,
    filters,
    setFilters,
    addIPGoal,
    isAdding,
  } = ipData;

  const [showAddForm, setShowAddForm] = useState(false);

  const totalTarget = ipGoals.reduce((sum, g) => sum + g.targetCommits, 0);
  const totalActual = ipSummary?.totalCommits ?? 0;
  const progressPct = totalTarget > 0 ? Math.min(100, Math.round((totalActual / totalTarget) * 100)) : 0;
  const programCount = ipGoals.filter((g) => g.zone === "program").length;
  const myzoneCount = ipGoals.filter((g) => g.zone === "myzone").length;

  const planLocked = planStatus === "submitted" || planStatus === "locked";

  return (
    <div className="space-y-5">
      {/* Zone 1: Overview */}
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body py-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-base">Intellectual Property</h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="xs" onClick={goToPrevMonth}>‹</Button>
              <span className="text-sm font-medium px-1">{monthLabel}</span>
              <Button variant="ghost" size="xs" onClick={goToNextMonth}>›</Button>
            </div>
          </div>
          <p className="text-xs opacity-60 mb-3">
            {ipGoals.length} IP goals · {totalActual} commits this month · Target: {totalTarget} commits
          </p>
          <progress
            className={cn(
              "progress w-full",
              progressPct >= 100 ? "progress-success" : progressPct >= 60 ? "progress-warning" : "progress-error"
            )}
            value={progressPct}
            max={100}
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs opacity-50">Program: {programCount} · MyZone: {myzoneCount}</p>
            <p className="text-xs opacity-50">{progressPct}%</p>
          </div>
        </div>
      </div>

      {/* Zone 2: IP Registry */}
      <div className="space-y-3">
        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Button
              size="xs"
              color={!filters.zone ? "primary" : undefined}
              variant={!filters.zone ? undefined : "ghost"}
              onClick={() => setFilters({})}
            >
              All
            </Button>
            <Button
              size="xs"
              color={filters.zone === "program" ? "primary" : undefined}
              variant={filters.zone === "program" ? undefined : "ghost"}
              onClick={() => setFilters({ zone: "program" })}
            >
              Program
            </Button>
            <Button
              size="xs"
              color={filters.zone === "myzone" ? "primary" : undefined}
              variant={filters.zone === "myzone" ? undefined : "ghost"}
              onClick={() => setFilters({ zone: "myzone" })}
            >
              MyZone
            </Button>
          </div>
          <div className="ml-auto">
            {planLocked ? (
              <span className="text-xs opacity-50 italic">Plan locked</span>
            ) : (
              <Button
                color="primary"
                size="sm"
                onClick={() => setShowAddForm((v) => !v)}
              >
                {showAddForm ? "Cancel" : "+ Add IP Goal"}
              </Button>
            )}
          </div>
        </div>

        {/* Add Goal Form */}
        {showAddForm && !planLocked && (
          <IPAddGoalForm
            isAdding={isAdding}
            onAdd={async (goal) => {
              await addIPGoal(goal);
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {/* Goal cards */}
        {filteredGoals.length === 0 ? (
          <div className="card bg-base-100 border border-base-300">
            <div className="card-body text-center py-10">
              <p className="opacity-50 text-sm">
                No IP goals for this month.{" "}
                {!planLocked && (
                  <button
                    className="text-primary underline"
                    onClick={() => setShowAddForm(true)}
                  >
                    Add one
                  </button>
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGoals.map((goal) => (
              <IPGoalCard
                key={goal.id}
                goal={goal}
                actualCommits={
                  ipSummary?.items.find((i) => i.title === goal.title)?.commits ?? null
                }
                history={goalHistory.get(goal.title) ?? []}
              />
            ))}
          </div>
        )}
      </div>

      {/* Zone 3: Commit Timeline */}
      {weeklySummaries.length > 0 && (
        <CommitTimeline weeklySummaries={weeklySummaries} monthLabel={monthLabel} />
      )}
    </div>
  );
}

// ─── IPGoalCard ───────────────────────────────────────────────────────────────

function IPGoalCard({
  goal,
  actualCommits,
  history,
}: {
  goal: MonthlyIPGoal;
  actualCommits: number | null;
  history: IPGoalHistory[];
}) {
  const actual = actualCommits ?? 0;
  const pct =
    goal.targetCommits > 0
      ? Math.min(100, Math.round((actual / goal.targetCommits) * 100))
      : 0;

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body py-4">
        <div className="flex items-start gap-2 mb-2">
          <h3 className="font-semibold text-sm flex-1 min-w-0">{goal.title}</h3>
          <Badge
            variant={goal.zone === "myzone" ? "secondary" : "neutral"}
            size="sm"
            icon={null}
            label={goal.zone === "myzone" ? "MyZone" : "Program"}
            className="shrink-0"
          />
        </div>
        <p className="text-xs opacity-60 mb-2">
          Target: {goal.targetCommits} commits · Actual: {actual} commits · {pct}%
        </p>
        <progress
          className={cn(
            "progress w-full",
            pct >= 100 ? "progress-success" : pct >= 60 ? "progress-warning" : "progress-error"
          )}
          value={pct}
          max={100}
        />
        {history.length > 0 && (
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-base-200">
            {history.map((h) => {
              const hit = h.target > 0 && h.actual >= h.target;
              return (
                <span key={h.month} className="text-xs opacity-60">
                  {h.monthLabel}: {h.actual}/{h.target}{" "}
                  <span className={hit ? "text-success" : "opacity-40"}>
                    {hit ? "\u2713" : "\u00B7"}
                  </span>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── IPAddGoalForm ────────────────────────────────────────────────────────────

function IPAddGoalForm({
  isAdding,
  onAdd,
  onCancel,
}: {
  isAdding: boolean;
  onAdd: (goal: Omit<MonthlyIPGoal, "id">) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [targetCommits, setTargetCommits] = useState(2);
  const [zone, setZone] = useState<"program" | "myzone">("program");

  async function handleSubmit() {
    if (!title.trim()) return;
    await onAdd({ title: title.trim(), targetCommits, programId: null, zone });
  }

  return (
    <div className="card bg-base-100 border border-primary/40">
      <div className="card-body py-4">
        <h3 className="font-semibold text-sm mb-3">Add IP Goal</h3>
        <div className="space-y-3">
          <div>
            <label className="label label-text text-xs">Title *</label>
            <input
              type="text"
              className="input input-bordered input-sm w-full"
              placeholder="IP goal title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="label label-text text-xs">Target Commits</label>
              <input
                type="number"
                className="input input-bordered input-sm w-full"
                min={1}
                value={targetCommits}
                onChange={(e) => setTargetCommits(Math.max(1, Number(e.target.value)))}
              />
            </div>
            <div className="flex-1">
              <label className="label label-text text-xs">Zone</label>
              <select
                className="select select-bordered select-sm w-full"
                value={zone}
                onChange={(e) => setZone(e.target.value as "program" | "myzone")}
              >
                <option value="program">Program</option>
                <option value="myzone">MyZone</option>
              </select>
            </div>
          </div>
          <div className="card-actions justify-end pt-1">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              color="primary"
              size="sm"
              className={cn(isAdding && "loading")}
              disabled={isAdding || !title.trim()}
              onClick={handleSubmit}
            >
              {isAdding ? "Adding…" : "Add Goal"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CommitTimeline ───────────────────────────────────────────────────────────

function CommitTimeline({
  weeklySummaries,
  monthLabel,
}: {
  weeklySummaries: UseIPReturn["weeklySummaries"];
  monthLabel: string;
}) {
  const max = Math.max(...weeklySummaries.map((w) => w.ipCommits), 1);

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body py-4">
        <p className="font-semibold text-sm mb-3">Commit Timeline — {monthLabel}</p>
        <div className="space-y-2">
          {weeklySummaries.map((w) => {
            const pct = Math.round((w.ipCommits / max) * 100);
            return (
              <div key={w.weekStart} className="flex items-center gap-3">
                <span className="text-xs opacity-60 w-12 shrink-0">
                  {w.weekStart.slice(5)}
                </span>
                <div className="flex-1">
                  <progress className="progress progress-primary w-full" value={pct} max={100} />
                </div>
                <span className="text-xs font-medium w-16 text-right shrink-0">
                  {w.ipCommits} commit{w.ipCommits !== 1 ? "s" : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
