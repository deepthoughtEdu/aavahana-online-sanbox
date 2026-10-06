import z from "zod";

// Constants for word limits
export const REFLECTION_MIN_WORDS = 10;
export const REFLECTION_MAX_WORDS = 500;

// Helper function to count words
const countWords = (text: string): number => {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
};

export const reflectionSchema = z.object({
  reflection: z
    .string()
    .min(1, "Reflection is required!")
    .trim()
    .refine(
      (text) => {
        const words = countWords(text);
        return words >= REFLECTION_MIN_WORDS;
      },
      {
        message: `Reflection must contain at least ${REFLECTION_MIN_WORDS} words.`,
      }
    )
    .refine(
      (text) => {
        const words = countWords(text);
        return words <= REFLECTION_MAX_WORDS;
      },
      {
        message: `Reflection cannot exceed ${REFLECTION_MAX_WORDS} words.`,
      }
    ),
});

export type ReflectionValidation = z.infer<typeof reflectionSchema>;
/**
 * ============================================
 * WEEKLY PLAN VALIDATIONS
 * ============================================
 */

export const weeklyPlanSchema = z.object({
  weeklyGoals: z
    .string()
    .min(10, "Weekly goals must be at least 10 characters")
    .max(5000, "Weekly goals cannot exceed 5000 characters"),
  transcript: z
    .string()
    .min(10, "Transcript must be at least 10 characters")
    .max(10000, "Transcript cannot exceed 10000 characters"),
  weekStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Week start must be in YYYY-MM-DD format")
    .optional(),
});

export const weeklyTaskSchema = z.object({
  day: z.enum(
    ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    { message: "Day is required" }
  ),
  taskTitle: z
    .string()
    .min(1, "Task title is required")
    .max(200, "Task title cannot exceed 200 characters"),
  priority: z.enum(["High", "Medium", "Low"]).optional(),
  estimateMins: z
    .number()
    .int()
    .positive("Estimate must be a positive number")
    .max(480, "Estimate cannot exceed 8 hours (480 minutes)")
    .optional(),
  doneDefinition: z
    .string()
    .max(500, "DONE definition cannot exceed 500 characters")
    .optional(),
  status: z.enum(["notStarted", "inProgress", "Completed"]).optional(),
  isManual: z.boolean().optional(),
});

export const weeklyPlanUpdateSchema = z.object({
  weekStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Week start must be in YYYY-MM-DD format")
    .optional(),
  updates: z
    .record(z.string(), z.any())
    .refine(
      (obj) => Object.keys(obj).length > 0,
      "At least one field must be updated"
    ),
});

export type WeeklyPlanFormData = z.infer<typeof weeklyPlanSchema>;
export type WeeklyTaskFormData = z.infer<typeof weeklyTaskSchema>;
export type WeeklyPlanUpdateFormData = z.infer<typeof weeklyPlanUpdateSchema>;
