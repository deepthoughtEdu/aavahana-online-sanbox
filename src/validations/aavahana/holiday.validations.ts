// src/validations/aavahana/holiday.validations.ts
// Zod schemas for the org-wide holiday calendar.
// Error keys mirror the backend's [[error:...]] strings.

import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid-date");

const holidayType = z.enum(["public", "optional", "restricted"], {
  message: "invalid-holiday-type",
});

export const createHolidaySchema = z.object({
  date: dateOnly,
  name: z.string().trim().min(1, "name-required"),
  type: holidayType.optional(),
  description: z.string().optional(),
});

export const updateHolidaySchema = z.object({
  date: dateOnly.optional(),
  name: z.string().trim().min(1, "name-required").optional(),
  type: holidayType.optional(),
  description: z.string().nullable().optional(),
});

export type CreateHolidayFormValues = z.infer<typeof createHolidaySchema>;
export type UpdateHolidayFormValues = z.infer<typeof updateHolidaySchema>;
