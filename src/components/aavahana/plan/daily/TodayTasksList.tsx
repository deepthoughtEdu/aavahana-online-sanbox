"use client";

import { useState, useRef, useEffect } from "react";
import { DailyTask } from "@/types";
import {
  CloseIcon,
  CheckIcon,
  TrashIcon,
  EditIcon,
  ListCheckIcon,
  PlusIcon,
} from "@/components/shared/icons";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { Section } from "@/components/shared/Section";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAlert } from "@/lib/hooks/shared/use-alert";
import { cn } from "@/utils";
import { sizes } from "@/utils/shared/design.utils";

interface TodayTasksListProps {
  tasks: DailyTask[];
  onRemove: (index: number) => void;
  onUpdate: (index: number, updates: Partial<DailyTask>) => void;
  onMarkCriticalPath: (index: number) => void;
  onUpdateEstimate: (index: number, mins: number) => void;
  onAdd: (task: DailyTask) => void;
}

const SOURCE_LABELS: Record<string, string> = {
  weekly_basket:    "weekly plan",
  event_loop:       "event loop",
  yesterday:        "carryover",
  manual:           "self-added",
  deferred:         "deferred",
};

function TaskRow({
  task,
  index,
  onRemove,
  onUpdate,
  onMarkCriticalPath,
  onUpdateEstimate,
  isFirst,
}: {
  task: DailyTask;
  index: number;
  onRemove: (index: number) => void;
  onUpdate: (index: number, updates: Partial<DailyTask>) => void;
  onMarkCriticalPath: (index: number) => void;
  onUpdateEstimate: (index: number, mins: number) => void;
  isFirst?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.text);
  const [editMins, setEditMins] = useState(task.budgetMins ?? 0);
  const { delete: deleteAlert } = useAlert();

  const handleSave = () => {
    if (editValue.trim() && editValue !== task.text) {
      onUpdate(index, { text: editValue.trim() });
    }
    if (editMins !== (task.budgetMins ?? 0)) {
      onUpdateEstimate(index, editMins);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(task.text);
    setEditMins(task.budgetMins ?? 0);
    setIsEditing(false);
  };

  const handleDeleteClick = async () => {
    const result = await deleteAlert({
      resourceName: "Task",
      message: `Remove "${task.text}"?`,
    });
    if (result.isConfirmed) onRemove(index);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  if (isEditing) {
    return (
      <div
        className={cn(
          "flex items-center w-full gap-2 mb-2",
          "bg-primary/5 border border-primary/20",
          sizes.sm.padding,
          sizes.lg.rounded,
          "transition-all duration-200",
        )}
      >
        <Badge size="sm">{index + 1}</Badge>
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          className={cn(
            "flex-1 px-3 py-2 border bg-base-100",
            "border-accent/40",
            sizes.sm.text,
            sizes.sm.rounded,
          )}
          autoFocus
        />
        <input
          type="number"
          value={editMins}
          onChange={(e) => setEditMins(Number(e.target.value))}
          onKeyDown={handleKeyPress}
          className={cn(
            "w-16 px-2 py-2 border bg-base-100 text-center",
            "border-accent/40",
            sizes.sm.text,
            sizes.sm.rounded,
          )}
          min={0}
        />
        <span className="text-xs dt-text-muted">min</span>
        <Button size="sm" variant="ghost" color="secondary" shape="circle" onClick={handleSave} iconBefore={<CheckIcon size="sm" />} />
        <Button size="sm" variant="ghost" color="secondary" shape="circle" onClick={handleCancel} iconBefore={<CloseIcon size="sm" />} />
      </div>
    );
  }

  const sourceLabel = SOURCE_LABELS[task.source ?? ""] ?? task.source;

  return (
    <div
      className={cn(
        "flex items-center w-full gap-3 mb-2",
        "border border-base-300 hover:border-base-400",
        sizes.sm.padding,
        sizes.lg.rounded,
        "transition-all duration-200",
      )}
    >
      <Badge>{index + 1}</Badge>

      <div className="flex-1 min-w-0">
        <p className={cn("font-medium", sizes.sm.text)}>{task.text}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {(task.budgetMins ?? 0) > 0 && (
            <span className="text-xs dt-text-muted">{task.budgetMins} min</span>
          )}
          {sourceLabel && (
            <Badge
              label={sourceLabel}
              variant={task.source === "deferred" ? "warning" : "primary"}
              size="sm"
            />
          )}
          {task.sourceId && (
            <span className="text-xs dt-text-dim">{task.sourceId}</span>
          )}
        </div>
      </div>

      <div className="flex items-center shrink-0 gap-1">
        <label id={isFirst ? "tour-task-cp" : undefined} className="flex items-center gap-1 cursor-pointer" title="Critical path">
          <input
            type="radio"
            name="criticalPath"
            checked={task.isCriticalPath ?? false}
            onChange={() => onMarkCriticalPath(index)}
            className="radio radio-xs radio-primary"
          />
          <span className="text-xs dt-text-dim">CP</span>
        </label>

        <Button id={isFirst ? "tour-task-edit" : undefined} size="sm" variant="ghost" shape="circle" color="secondary" onClick={() => setIsEditing(true)} iconBefore={<EditIcon size="sm" />} />
        <Button id={isFirst ? "tour-task-remove" : undefined} size="sm" variant="ghost" color="secondary" shape="circle" onClick={handleDeleteClick} iconBefore={<TrashIcon size="sm" />} />
      </div>
    </div>
  );
}

function AddTaskForm({ onAdd }: { onAdd: (task: DailyTask) => void }) {
  const [title, setTitle] = useState("");
  const [estimate, setEstimate] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd({
      text: title.trim(),
      status: "notStarted",
      type: "planned",
      source: "manual",
      budgetMins: Number(estimate) || 0,
      isCriticalPath: false,
    });
    setTitle("");
    setEstimate("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className={cn("flex items-center gap-2 mt-3", sizes.sm.padding)}>
      <input
        id="tour-task-add-input"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Add a task..."
        className={cn(
          "flex-1 px-3 py-2 border bg-base-100 border-base-300",
          sizes.sm.text,
          sizes.sm.rounded,
        )}
      />
      <input
        type="number"
        value={estimate}
        onChange={(e) => setEstimate(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="min"
        min={0}
        className={cn(
          "w-16 px-2 py-2 border bg-base-100 border-base-300 text-center",
          sizes.sm.text,
          sizes.sm.rounded,
        )}
      />
      <Button
        id="tour-task-add-btn"
        size="sm"
        variant="soft"
        color="primary"
        onClick={handleSubmit}
        disabled={!title.trim()}
        iconBefore={<PlusIcon size="sm" />}
      >
        Add
      </Button>
    </div>
  );
}

export function TodayTasksList({
  tasks,
  onRemove,
  onUpdate,
  onMarkCriticalPath,
  onUpdateEstimate,
  onAdd,
}: TodayTasksListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [tasks.length]);

  return (
    <Section>
      <Section.Header
        icon={<ListCheckIcon size="sm" />}
        title="Today's Tasks"
        size="sm"
      >
        {tasks.length > 0 && (
          <Badge variant="ghost" size="sm">
            {tasks.length} · {tasks.reduce((s, t) => s + (t.budgetMins ?? 0), 0)} min
          </Badge>
        )}
      </Section.Header>
      <Section.Body>
        <div ref={scrollContainerRef} className="overflow-y-auto max-h-[400px] scrollbar-hover">
          {tasks.length === 0 ? (
            <EmptyState
              title="No tasks yet"
              subtitle="Pick from the basket above or add your own task below."
              icon={<ListCheckIcon size="sm" />}
              size="sm"
            />
          ) : (
            tasks.map((task, index) => (
              <TaskRow
                key={`task-${index}-${task.text.substring(0, 20)}`}
                task={task}
                index={index}
                onRemove={onRemove}
                onUpdate={onUpdate}
                onMarkCriticalPath={onMarkCriticalPath}
                onUpdateEstimate={onUpdateEstimate}
                isFirst={index === 0}
              />
            ))
          )}
        </div>
        <AddTaskForm onAdd={onAdd} />
      </Section.Body>
    </Section>
  );
}
