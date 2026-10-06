// src/validations/aavahana/leave.validations.ts
// Zod schemas for the Aavahana → Leaves Tracker module.
// Error keys mirror the backend's [[error:...]] strings so messages stay aligned.

import { z } from "zod";

const isoDate = z.string().regex(
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/,
  "invalid-date"
);

const workingHoursSchema = z.object({
  from: z.string().regex(/^\d{2}:\d{2}$/, "working-hours-from-and-to-required"),
  to:   z.string().regex(/^\d{2}:\d{2}$/, "working-hours-from-and-to-required"),
});

const calculatedSchema = z.object({
  type: z.enum(["day", "hour"]).optional(),
  duration: z.number().optional(),
  finalLeaves: z.number().min(0, "calculated-must-be-object"),
  startRaw: z.union([z.number(), z.string()]).optional(),
  endRaw: z.union([z.number(), z.string()]).optional(),
  workingDays: z.number().optional(),
  sundays: z.number().optional(),
  holidays: z.number().optional(),
  calendarDays: z.number().optional(),
});

const allowedStatusSchema = z.enum([
  "approved",
  "rejected",
  "modified",
  "cancelled",
], { message: "invalid-status" });

export const applyLeaveSchema = z
  .object({
    type: z.string().min(1, "type-required"),
    startDate: isoDate,
    endDate: isoDate,
    days: z.number().int().min(1).default(1),
    reason: z.string().min(1, "reason-required"),
    // Reporting manager is no longer surfaced in the UI; the backend infers
    // it from the caller's onboarding when the client doesn't send one.
    requestedTo: z.string().optional(),
    supervisorId: z.string().optional(),
    managers: z.array(z.string()).optional(),
    calculated: calculatedSchema,
    workingHours: workingHoursSchema,
    teamName: z.string().optional(),
    description: z.string().optional(),
    deliverables: z.string().optional(),
    assignee: z.string().optional(),
    isUrgent: z.boolean().optional(),
    urgentReason: z.string().optional(),
    noSupervisorReason: z.string().optional(),
  })
  .refine(
    (val) => new Date(val.startDate).getTime() <= new Date(val.endDate).getTime(),
    { message: "start-date-after-end-date", path: ["endDate"] }
  );

export type ApplyLeaveInput = z.infer<typeof applyLeaveSchema>;

export const decideLeaveSchema = z.object({
  status: allowedStatusSchema,
  note: z.string().optional(),
  calculated: calculatedSchema.optional(),
});

export type DecideLeaveInput = z.infer<typeof decideLeaveSchema>;

export const modifyLeaveSchema = z
  .object({
    status: allowedStatusSchema,
    calculated: calculatedSchema,
    note: z.string().optional(),
    // Approver's adjusted window. Both or neither — see ModifyLeavePayload.
    startDate: isoDate.optional(),
    endDate: isoDate.optional(),
  })
  .refine(
    (val) => (val.startDate == null) === (val.endDate == null),
    { message: "start-and-end-date-required", path: ["endDate"] }
  )
  .refine(
    (val) =>
      val.startDate == null ||
      val.endDate == null ||
      new Date(val.startDate).getTime() <= new Date(val.endDate).getTime(),
    { message: "start-date-after-end-date", path: ["endDate"] }
  );

export type ModifyLeaveInput = z.infer<typeof modifyLeaveSchema>;
