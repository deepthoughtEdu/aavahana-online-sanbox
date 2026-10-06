"use client";

import { createTour } from "@/lib/managers/tour";

export function createDailyReportTour() {
  return createTour({
    storageKey: "tour:daily-report:v1",
    steps: [
      // ── Step 1: The overall structure ─────────────────────────────────────
      {
        element: "#tour-report-progress",
        popover: {
          title: "Your daily story — 3 acts",
          description:
            "Every daily reflection is split into three acts: Your Work, What Challenged You, and How You Grew. Each segment lights up as you complete it.",
          side: "bottom",
          align: "center",
        },
      },

      // ── Step 2: Current act badge ─────────────────────────────────────────
      {
        element: "#tour-report-phase-badge",
        popover: {
          title: "Act 1 — Your Work",
          description:
            "This badge shows which act you're in right now. The first act is about what you worked on today. It'll change to 'What challenged you' and then 'How you grew' as you move forward.",
          side: "bottom",
          align: "start",
        },
      },

      // ── Step 3: The conversation area ────────────────────────────────────
      {
        element: "#tour-report-conversation",
        popover: {
          title: "The conversation starts here",
          description:
            "The system greets you and walks you through the reflection as a conversation — one question at a time. You never see the whole form at once. Just read and respond.",
          side: "top",
          align: "center",
        },
      },

      // ── Step 4: Status cycle button ──────────────────────────────────────
      {
        element: "#tour-deliver-status",
        popover: {
          title: "Mark what got done",
          description:
            "Tap this button to cycle the task status — not done ·, done ✓, or partial ◐. Keep tapping to switch. You need at least one status set before you can move on.",
          side: "left",
          align: "center",
        },
      },

      // ── Step 5: Critical path star ───────────────────────────────────────
      {
        element: "#tour-deliver-critical-path",
        popover: {
          title: "Star your most important task",
          description:
            "Tap ★ on the one task that mattered most today. This becomes your critical-path item — it appears on your day card and shapes what Act 2 asks you about.",
          side: "right",
          align: "center",
        },
      },

      // ── Step 6: Time logging ─────────────────────────────────────────────
      {
        element: "#tour-deliver-time",
        popover: {
          title: "Log actual time",
          description:
            "Tap this to open the time adjuster. Use + and − to enter how long the task actually took. This drives your plan-vs-actual map at the end of Act 1.",
          side: "left",
          align: "center",
        },
      },

      // ── Step 7: Unplanned work ───────────────────────────────────────────
      {
        element: "#tour-deliver-unplanned",
        popover: {
          title: "Add anything that came up unplanned",
          description:
            "Tap this to log work that wasn't on your plan. Give it a label, tag it (interruption, escalation, etc.), and set the time. It shows up in your tension summary so nothing disappears.",
          side: "top",
          align: "center",
        },
      },

      // ── Step 8: See your map button ──────────────────────────────────────
      {
        element: "#tour-deliver-next",
        popover: {
          title: "\"See your map\" — unlocks after you mark a status",
          description:
            "Once at least one task has a status, this button pulses and becomes active. Tap it to see a visual breakdown of planned vs actual time, then hit Continue to move to Act 2.",
          side: "top",
          align: "center",
        },
      },

      // ── Step 9: Act 2 — constraint ──────────────────────────────────────
      {
        element: "#tour-report-conversation",
        popover: {
          title: "Act 2 — Pick your constraint",
          description:
            "Pill buttons appear asking what blocked you today. Tap one to choose, then a second row narrows it to the specific cause. If the day was smooth, a skip option appears at the top.",
          side: "top",
          align: "center",
        },
      },

      // ── Step 10: Navigation ──────────────────────────────────────────────
      {
        element: "#tour-report-conversation",
        popover: {
          title: "Then pick your navigation",
          description:
            "After the constraint, a new set of pills appears — how you responded. These are always scoped to your constraint so the options make sense. Tap the one that fits best.",
          side: "top",
          align: "center",
        },
      },

      // ── Step 11: Narrative input ─────────────────────────────────────────
      {
        element: "#tour-report-conversation",
        popover: {
          title: "Tell your story in your own words",
          description:
            "Two buttons appear — 'text' to type your narrative, 'voice' to paste a transcript. There's a 180-character minimum — enough to say something real. Hit Submit when done.",
          side: "top",
          align: "center",
        },
      },

      // ── Step 12: Act 3 intro ─────────────────────────────────────────────
      {
        element: "#tour-report-conversation",
        popover: {
          title: "Act 3 — How You Grew",
          description:
            "The final act is about growth. You'll pick a framework you practiced today (a skill or habit) and how many times, then say how you're feeling as you close out the day.",
          side: "top",
          align: "center",
        },
      },

      // ── Step 13: Submit ──────────────────────────────────────────────────
      {
        element: "#tour-report-conversation",
        popover: {
          title: "Two-tap submit to confirm",
          description:
            "At the end of Act 3 a 'Submit report ✓' button appears. The first tap turns it into 'Confirm? ✓' — tap again to send. This prevents accidental submissions.",
          side: "top",
          align: "center",
        },
      },

      // ── Step 14: Day card ────────────────────────────────────────────────
      {
        element: "#tour-day-card",
        popover: {
          title: "Your day card builds as you go",
          description:
            "This card fills in throughout the conversation — deliverables, constraint → navigation arc, framework, feeling, and a dot trail showing progress across all three acts. After submission it's your permanent record of the day.",
          side: "bottom",
          align: "center",
        },
      },
    ],
  });
}
