/**
 * HVT Validations — Zod schemas for experiment & idea payloads
 */

import { z } from "zod";

// ─── Shared field schemas ────────────────────────────────────────────────────────

const variantSchema = z.object({
  label: z.string().min(1, "Variant label is required").max(100),
  description: z.string().min(1, "Variant description is required").max(500),
});

const resultSchema = z.object({
  variantAOutcome: z.string().min(1, "Variant A outcome is required"),
  variantBOutcome: z.string().min(1, "Variant B outcome is required"),
  winner: z.enum(["A", "B", "inconclusive", "cancelled"]),
  delta: z.string().min(1, "Delta measurement is required"),
  significance: z.string().min(1, "Significance statement is required"),
});

// ─── Create Experiment (L3) ──────────────────────────────────────────────────────

export const createExperimentSchema = z.object({
  programId: z.string().min(1, "Program is required"),
  sprintId: z.string().optional(),
  title: z.string().min(1, "Title is required").max(150),
  hypothesis: z
    .string()
    .min(10, "Hypothesis must be at least 10 characters")
    .max(1000),
  successCase: z
    .string()
    .min(5, "Success case is required")
    .max(500),
  northStarRef: z.string().optional(),
  variantA: variantSchema,
  variantB: variantSchema,
  cellRef: z.string().optional(),
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateExperimentFormData = z.infer<typeof createExperimentSchema>;

// ─── Update Experiment (L3) ──────────────────────────────────────────────────────

export const updateExperimentSchema = z.object({
  title: z.string().min(1).max(150).optional(),
  hypothesis: z.string().min(10).max(1000).optional(),
  successCase: z.string().min(5).max(500).optional(),
  northStarRef: z.string().optional(),
  variantA: variantSchema.optional(),
  variantB: variantSchema.optional(),
  cellRef: z.string().optional(),
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sprintId: z.string().optional(),
});

export type UpdateExperimentFormData = z.infer<typeof updateExperimentSchema>;

// ─── Conclude Experiment (L3) ────────────────────────────────────────────────────

export const concludeExperimentSchema = z.object({
  experimentId: z.string().min(1),
  result: resultSchema,
  learning: z
    .string()
    .min(10, "Learning must be at least 10 characters — document what you discovered")
    .max(2000),
});

export type ConcludeExperimentFormData = z.infer<typeof concludeExperimentSchema>;

// ─── Cancel Experiment (L3) ──────────────────────────────────────────────────────

export const cancelExperimentSchema = z.object({
  experimentId: z.string().min(1),
  reason: z
    .string()
    .min(5, "Cancellation reason is required")
    .max(500),
});

export type CancelExperimentFormData = z.infer<typeof cancelExperimentSchema>;

// ─── Submit Idea (L1/L2) ─────────────────────────────────────────────────────────

export const submitIdeaSchema = z.object({
  programId: z.string().min(1, "Program is required"),
  title: z.string().min(1, "Title is required").max(150),
  hypothesis: z
    .string()
    .min(10, "Hypothesis must be at least 10 characters")
    .max(1000),
  suggestedVariantA: z.string().max(500).optional(),
  suggestedVariantB: z.string().max(500).optional(),
  rationale: z
    .string()
    .min(10, "Rationale must be at least 10 characters")
    .max(1000),
  cellRef: z.string().optional(),
});

export type SubmitIdeaFormData = z.infer<typeof submitIdeaSchema>;

// ─── Review Idea (L3) ────────────────────────────────────────────────────────────

export const reviewIdeaSchema = z.object({
  ideaId: z.string().min(1),
  action: z.enum(["accept", "reject"]),
  reviewNote: z.string().max(500).optional(),
});

export type ReviewIdeaFormData = z.infer<typeof reviewIdeaSchema>;

// ─── Link to IP (L3) ────────────────────────────────────────────────────────────

export const linkToIpSchema = z.object({
  experimentId: z.string().min(1),
  ipItemId: z.string().min(1, "IP item is required"),
});

export type LinkToIpFormData = z.infer<typeof linkToIpSchema>;
