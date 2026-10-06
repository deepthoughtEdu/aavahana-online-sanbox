"use client";

import { useState, useMemo, useCallback } from "react";
import { Section } from "@/components/shared/Section";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { DataTable } from "@/components/shared/ui/DataTable";
import {
  EditIcon,
  PlusIcon,
  ClockIcon,
  ListIcon,
  CalendarIcon,
} from "@/components/shared/icons";
import { TaskEditModal } from "./TaskEditModal";
import { Column, WeeklyPlanResponse, WeeklyTask } from "@/types";
import { cn, gaps } from "@/utils";
import { sizes, textColors } from "@/utils/shared/design.utils";

interface PostSubmissionViewProps {
  weeklyPlan: WeeklyPlanResponse;
  weekStart: string;
  onUpdate: () => void;
}

/**
 * Column definitions for weekly tasks table
 */
const getWeeklyTasksColumns = (
  onEdit: (task: WeeklyTask, index: number) => void
): Column<WeeklyTask>[] => [
  {
    key: "day",
    label: "Day",
    width: "120px",
    render: (value) => <span className="font-medium">{value as string}</span>,
  },
  {
    key: "taskTitle",
    label: "Task Title",
    render: (value, record) => (
      <div className={cn("flex items-center", gaps.sm)}>
        <span>{value as string}</span>
        {record.isManual && <Badge label="Manual" variant="ghost" size="sm" />}
      </div>
    ),
  },
  {
    key: "doneDefinition",
    label: "DONE Definition",
    width: "300px",
    render: (value) => (
      <div className={cn(sizes.sm.text, textColors.ghost, "max-w-xs")}>
        <div className="line-clamp-2">{(value as string) || "-"}</div>
      </div>
    ),
  },
  {
    key: "estimateMins",
    label: "Estimate",
    width: "120px",
    render: (value) =>
      value ? (
        <div className={cn("flex items-center", gaps.xs)}>
          <ClockIcon size="sm" className="dt-text-dim" />
          <span>{value as number} mins</span>
        </div>
      ) : (
        <span>-</span>
      ),
  },
  {
    key: "priority",
    label: "Priority",
    width: "120px",
    render: (value) => {
      if (!value) return <span>-</span>;

      const getPriorityVariant = (priority: string) => {
        switch (priority) {
          case "High":
            return "error" as const;
          case "Medium":
            return "warning" as const;
          case "Low":
            return "info" as const;
          default:
            return "neutral" as const;
        }
      };

      return (
        <Badge
          label={value as string}
          variant={getPriorityVariant(value as string)}
          size="sm"
        />
      );
    },
  },
  // {
  //   key: "status",
  //   label: "Status",
  //   width: "140px",
  //   render: (value) => {
  //     const getStatusVariant = (status?: string) => {
  //       switch (status) {
  //         case "Completed":
  //           return "success" as const;
  //         case "inProgress":
  //           return "info" as const;
  //         case "notStarted":
  //         default:
  //           return "neutral" as const;
  //       }
  //     };

  //     const getStatusLabel = (status?: string) => {
  //       switch (status) {
  //         case "Completed":
  //           return "Completed";
  //         case "inProgress":
  //           return "In Progress";
  //         case "notStarted":
  //         default:
  //           return "Not Started";
  //       }
  //     };

  //     return (
  //       <Badge
  //         label={getStatusLabel(value as string)}
  //         variant={getStatusVariant(value as string)}
  //         icon={value === "Completed" ? <CheckIcon size="sm" /> : undefined}
  //         size="sm"
  //       />
  //     );
  //   },
  // },
  {
    key: "actions",
    label: "Actions",
    width: "100px",
    render: (_, record, index) => (
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="ghost"
          color="secondary"
          iconBefore={<EditIcon size="sm" />}
          onClick={() => onEdit(record, index!)}
        >
          Edit
        </Button>
      </div>
    ),
  },
];

export function PostSubmissionView({
  weeklyPlan,
  weekStart,
  onUpdate,
}: PostSubmissionViewProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<WeeklyTask | null>(null);
  const [taskIndex, setTaskIndex] = useState<number | null>(null);

  const tasks = weeklyPlan.evaluation?.plan || [];

  // ============================================
  // HANDLERS
  // ============================================

  const handleEditTask = useCallback((task: WeeklyTask, index: number) => {
    setSelectedTask(task);
    setTaskIndex(index);
    setEditModalOpen(true);
  }, []);

  const handleAddTask = useCallback(() => {
    setSelectedTask(null);
    setTaskIndex(null);
    setEditModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setEditModalOpen(false);
    setSelectedTask(null);
    setTaskIndex(null);
  }, []);

  const handleTaskSaved = useCallback(() => {
    onUpdate();
    handleModalClose();
  }, [onUpdate, handleModalClose]);

  // ============================================
  // MEMOIZED COLUMNS
  // ============================================

  const columns = useMemo(
    () => getWeeklyTasksColumns(handleEditTask),
    [handleEditTask]
  );

  // ============================================
  // QUERY FUNCTION
  // ============================================

  const queryFn = async () => tasks;

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={cn("space-y-4")}>
      {/* Goal Display */}
      <Section>
        <Section.Header icon={<CalendarIcon />} title="Weekly Goal" size="md" />
        <Section.Body>
          <p className={cn(textColors.ghost, "leading-relaxed")}>
            {weeklyPlan.weeklyGoals || "No goal set"}
          </p>
        </Section.Body>
      </Section>

      <DataTable
        title="Weekly Tasks"
        queryFn={queryFn}
        subtitle={`${tasks.length} ${
          tasks.length === 1 ? "task" : "tasks"
        } planned for this week`}
        icon={<ListIcon />}
        columns={columns}
        enableRefresh={false}
        actions={
          <Button
            size="sm"
            color="primary"
            iconBefore={<PlusIcon size="sm" />}
            onClick={handleAddTask}
          >
            Add Task
          </Button>
        }
      />

      {/* Task Edit Modal */}
      <TaskEditModal
        isOpen={editModalOpen}
        onClose={handleModalClose}
        task={selectedTask}
        taskIndex={taskIndex}
        weekStart={weekStart}
        onSave={handleTaskSaved}
      />
    </div>
  );
}
