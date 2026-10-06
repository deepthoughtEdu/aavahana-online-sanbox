"use client";

import { createTour } from "@/lib/managers/tour";

export function createDailyPlanTour() {
  return createTour({
    storageKey: "tour:daily-plan:v1",
    steps: [
      // ── Step 1: Day overview ──────────────────────────────────────────────
      {
        element: "#tour-day-overview",
        popover: {
          title: "Your day at a glance",
          description:
            "This panel shows your total task count, estimated time, and where each task came from — weekly plan, event loop, carryover, or self-added.",
          side: "bottom",
          align: "start",
        },
      },

      // ── Step 2: Status badge ──────────────────────────────────────────────
      {
        element: "#tour-plan-status-badge",
        popover: {
          title: "Draft or Submitted",
          description:
            "This badge shows the state of today's plan. It starts as Draft and flips to Submitted once you confirm your plan for the day.",
          side: "bottom",
          align: "end",
        },
      },

      // ── Step 3: Prev / Next day ───────────────────────────────────────────
      {
        element: "#tour-plan-prev-day",
        popover: {
          title: "Browse other days",
          description:
            "Use the ← arrow to look at previous days' plans. The → arrow is disabled when you're already on today.",
          side: "bottom",
          align: "center",
        },
      },

      // ── Step 4: Basket picker section ────────────────────────────────────
      {
        element: "#tour-basket-picker",
        popover: {
          title: "Pick from your basket",
          description:
            "Tasks from your weekly plan and event loop live here. They're waiting to be pulled into today — tap Pick on any item to add it to your day.",
          side: "bottom",
          align: "start",
        },
      },

      // ── Step 5: Pick button ───────────────────────────────────────────────
      {
        element: "#tour-basket-pick-btn",
        popover: {
          title: "Pick button — adds the task to today",
          description:
            "Tap this to move the task from the basket into your Today's Tasks list. The task will include its label and estimated time.",
          side: "left",
          align: "center",
        },
      },

      // ── Step 6: Today's tasks section ────────────────────────────────────
      {
        element: "#tour-today-tasks",
        popover: {
          title: "Today's tasks",
          description:
            "Everything you've committed to today lives here. You can see the source badge on each task — weekly plan, event loop, carryover, or self-added.",
          side: "top",
          align: "start",
        },
      },

      // ── Step 7: Critical path radio ──────────────────────────────────────
      {
        element: "#tour-task-cp",
        popover: {
          title: "CP — mark your critical path",
          description:
            "Select the one task that absolutely must get done today. This becomes your critical-path item and feeds directly into your daily report's Act 2.",
          side: "left",
          align: "center",
        },
      },

      // ── Step 8: Edit button ───────────────────────────────────────────────
      {
        element: "#tour-task-edit",
        popover: {
          title: "Edit a task",
          description:
            "Tap the pencil to rename the task or adjust its time estimate inline. Press Enter to save or Escape to cancel.",
          side: "left",
          align: "center",
        },
      },

      // ── Step 9: Remove button ─────────────────────────────────────────────
      {
        element: "#tour-task-remove",
        popover: {
          title: "Remove a task",
          description:
            "Tap the trash icon to remove a task from today's list. A confirmation prompt will appear before it's deleted.",
          side: "left",
          align: "center",
        },
      },

      // ── Step 10: Add task input ───────────────────────────────────────────
      {
        element: "#tour-task-add-input",
        popover: {
          title: "Add a task manually",
          description:
            "Type a task name here and optionally set a time estimate in minutes. Press Enter or tap Add to include it in today's plan.",
          side: "top",
          align: "start",
        },
      },

      // ── Step 11: Add button ───────────────────────────────────────────────
      {
        element: "#tour-task-add-btn",
        popover: {
          title: "Add button",
          description:
            "Tap this to add the typed task to your list. It'll be tagged as 'self-added' so you can always tell where it came from.",
          side: "top",
          align: "center",
        },
      },

      // ── Step 12: Carryovers section ───────────────────────────────────────
      {
        element: "#tour-context-panels",
        popover: {
          title: "Yesterday's unfinished tasks",
          description:
            "Anything you didn't complete yesterday shows up here. Review the list — if something still needs to happen today, bring it in.",
          side: "top",
          align: "start",
        },
      },

      // ── Step 13: Carryover add button ────────────────────────────────────
      {
        element: "#tour-carryover-add-btn",
        popover: {
          title: "Carry it forward",
          description:
            "Tap Add to pull a carryover task into today's list. It'll be tagged as 'carryover' so it's distinct from freshly planned work.",
          side: "left",
          align: "center",
        },
      },

      // ── Step 14: Submit section ───────────────────────────────────────────
      {
        element: "#tour-plan-submit",
        popover: {
          title: "Submit your plan",
          description:
            "Once your list looks right, scroll here to commit your day. The submit button is disabled until you've added at least one task.",
          side: "top",
          align: "center",
        },
      },

      // ── Step 15: Submit button ────────────────────────────────────────────
      {
        element: "#tour-plan-submit-btn",
        popover: {
          title: "Submit Daily Plan",
          description:
            "Tap this to lock in your plan for the day. Your status badge will flip to Submitted and your plan is saved.",
          side: "top",
          align: "center",
        },
      },

      // ── Step 16: Open Daily Report button ────────────────────────────────
      {
        element: "#tour-plan-open-report-btn",
        popover: {
          title: "Open Daily Report",
          description:
            "After submitting, head to the Daily Report to reflect on your day — what you did, what challenged you, and how you grew.",
          side: "top",
          align: "center",
        },
      },
    ],
  });
}
