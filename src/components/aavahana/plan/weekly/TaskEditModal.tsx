"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/shared/Button";
import { PlanService } from "@/lib/services/aavahana/plan.service";
import { useApiMutation } from "@/lib/hooks/shared/use-api";
import { toast } from "react-hot-toast";
import {
  WeeklyTask,
  WeeklyTaskPriority,
  WeeklyTaskStatus,
  WeeklyPlanUpdatePayload,
} from "@/types";
import { cn, gaps } from "@/utils";

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: WeeklyTask | null;
  taskIndex: number | null;
  weekStart: string;
  onSave: () => void;
}

export function TaskEditModal({
  isOpen,
  onClose,
  task,
  taskIndex,
  weekStart,
  onSave,
}: TaskEditModalProps) {
  const [formData, setFormData] = useState<WeeklyTask>({
    day: "Monday",
    taskTitle: "",
    priority: WeeklyTaskPriority.MEDIUM,
    estimateMins: undefined,
    doneDefinition: "",
    status: WeeklyTaskStatus.NOT_STARTED,
    isManual: true,
  });

  // Update mutation
  const updateMutation = useApiMutation({
    mutationFn: PlanService.updateWeeklyPlan,
    onSuccess: () => {
      toast.success(
        task ? "Task updated successfully!" : "Task added successfully!"
      );
      onSave();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update task");
    },
  });

  useEffect(() => {
    if (task) {
      setFormData(task);
    } else {
      setFormData({
        day: "Monday",
        taskTitle: "",
        priority: WeeklyTaskPriority.MEDIUM,
        estimateMins: undefined,
        doneDefinition: "",
        status: WeeklyTaskStatus.NOT_STARTED,
        isManual: true,
      });
    }
  }, [task, isOpen]);

  const handleSave = async () => {
    // Validation
    if (!formData.taskTitle.trim()) {
      toast.error("Task title is required");
      return;
    }

    if (
      formData.estimateMins &&
      (formData.estimateMins < 0 || formData.estimateMins > 480)
    ) {
      toast.error("Estimate must be between 0 and 480 minutes (8 hours)");
      return;
    }

    const updates: Record<string, unknown> = {};

    if (taskIndex !== null) {
      // Editing existing task
      updates[`evaluation.plan.${taskIndex}.day`] = formData.day;
      updates[`evaluation.plan.${taskIndex}.taskTitle`] = formData.taskTitle;
      updates[`evaluation.plan.${taskIndex}.priority`] = formData.priority;
      updates[`evaluation.plan.${taskIndex}.estimateMins`] =
        formData.estimateMins;
      updates[`evaluation.plan.${taskIndex}.doneDefinition`] =
        formData.doneDefinition;
      updates[`evaluation.plan.${taskIndex}.status`] = formData.status;
      updates[`evaluation.plan.${taskIndex}.isManual`] = formData.isManual;
    } else {
      // Adding new task - TODO: Implement array push in backend
      toast.error(
        "Adding new tasks is not yet supported. Please contact admin."
      );
      return;
    }

    const payload: WeeklyPlanUpdatePayload = {
      weekStart,
      updates,
    };

    updateMutation.mutate(payload);
  };

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const priorities = [
    { value: WeeklyTaskPriority.HIGH, label: "High" },
    { value: WeeklyTaskPriority.MEDIUM, label: "Medium" },
    { value: WeeklyTaskPriority.LOW, label: "Low" },
  ];

  return (
    <Modal
      size="md"
      isOpen={isOpen}
      onClose={onClose}
      title={task ? "Edit Task" : "Add New Task"}
      subtitle={task ? "Update task details" : "Create a new weekly task"}
      footer={
        <div className={cn("flex justify-end", gaps.sm)}>
          <Button
            color="secondary"
            onClick={onClose}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onClick={handleSave}
            loading={updateMutation.isPending}
          >
            {task ? "Update Task" : "Add Task"}
          </Button>
        </div>
      }
    >
      <div className={cn(gaps.md)}>
        {/* Day */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Day *</span>
          </label>
          <select
            className="select select-bordered"
            value={formData.day}
            onChange={(e) => setFormData({ ...formData, day: e.target.value })}
            disabled={updateMutation.isPending}
          >
            {days.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>

        {/* Task Title */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Task Title *</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            placeholder="Move APIs for Weekly Plan"
            value={formData.taskTitle}
            onChange={(e) =>
              setFormData({ ...formData, taskTitle: e.target.value })
            }
            maxLength={200}
            disabled={updateMutation.isPending}
          />
          <label className="label">
            <span className="label-text-alt dt-text-muted">
              {formData.taskTitle.length} / 200
            </span>
          </label>
        </div>

        {/* DONE Definition */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">DONE Definition</span>
            <span className="label-text-alt dt-text-muted">
              Optional
            </span>
          </label>
          <textarea
            className="textarea textarea-bordered h-20 resize-none"
            placeholder="All APIs for the Weekly Plan have been successfully moved to the new backend."
            value={formData.doneDefinition || ""}
            onChange={(e) =>
              setFormData({ ...formData, doneDefinition: e.target.value })
            }
            maxLength={500}
            disabled={updateMutation.isPending}
          />
          <label className="label">
            <span className="label-text-alt dt-text-muted">
              {(formData.doneDefinition || "").length} / 500
            </span>
          </label>
        </div>

        {/* Priority & Estimate */}
        <div className={cn("grid grid-cols-2", gaps.md)}>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Priority</span>
            </label>
            <select
              className="select select-bordered"
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value })
              }
              disabled={updateMutation.isPending}
            >
              {priorities.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Estimate (mins)</span>
            </label>
            <input
              type="number"
              className="input input-bordered"
              placeholder="120"
              value={formData.estimateMins || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  estimateMins: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
              min="0"
              max="480"
              step="15"
              disabled={updateMutation.isPending}
            />
          </div>
        </div>

        {/* Status */}
        {/* <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Status</span>
          </label>
          <select
            className="select select-bordered"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
            disabled={updateMutation.isPending}
          >
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div> */}
      </div>
    </Modal>
  );
}
