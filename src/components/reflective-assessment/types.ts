import type { ComponentType, ReactNode } from "react";

export interface AssessmentMeta {
  id: number;
  name: string;
  subtitle: string;
  landingLine: string;
  shift: string;
}

export interface AssessmentResult {
  activityId: number;
  choices: Record<string, unknown>;
  revealSeen: boolean;
}

export interface AssessmentSummary {
  headline: string;
  value: string;
  score?: number;
  sub?: string;
  color: string;
  pairs?: { label: string; value: number; color: string }[];
}

export interface ActivityRegistration {
  meta: AssessmentMeta;
  component: ComponentType<{
    onComplete: (result: AssessmentResult) => void;
    /** Previously-saved answer. When present, the activity renders locked (read-only) — it cannot be re-answered. */
    savedResult?: AssessmentResult;
  }>;
  extractSummary: (result: AssessmentResult) => AssessmentSummary;
}

export interface AssessmentPersistence {
  activities: { activityId: number; choices: unknown; explanation?: string | null }[];
  isLoading: boolean;
  submitActivity: (payload: {
    activityId: number;
    choices: Record<string, unknown>;
    score: Record<string, unknown>;
    explanation?: string;
  }) => Promise<unknown>;
}

export interface CompletionConfig {
  title: ReactNode;
  subtitle: ReactNode;
  footnote?: string;
  reportLabel?: string;
  revisitLabel?: string;
  banner?: ReactNode;
}
