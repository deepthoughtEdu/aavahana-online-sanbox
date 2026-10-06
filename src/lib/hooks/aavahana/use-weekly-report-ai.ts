"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { ReportService } from "@/lib/services/aavahana/report.service";
import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { useByokKeys } from "@/lib/hooks/admin";
import {
  byokConfigAtom,
  byokConfiguredAtom,
  normalizeByokModel,
} from "@/lib/store/shared/byok.store";
import { toast } from "@/utils";
import { showInsightToast } from "@/lib/aavahana/insight-toast";
import { isServerByokKeyUsableForAavahanaAi } from "@/utils/aavahana/byok-key.utils";
import type {
  WeeklyReportAi,
  WeeklyReportAiSection,
} from "@/types/aavahana/weekly-report-ai.types";

// ── Week math (UTC, Monday-based) ──
//
// ⚠️ LEFT ALL-UTC ON PURPOSE, AND IT NOW DRIFTS FROM THE BACKEND BY UP TO A DAY.
//
// Every function below is UTC and consistent with the others, which is what made the old
// comment ("must match the backend window") true. It is no longer true: as of 2026-08-29 the
// backend snaps a week to the ORG's Monday (OrgTime.weekBounds), and IST Monday 00:00 is
// Sunday 18:30 UTC. So at the boundary this hook can offer a different week than the backend
// would compute.
//
// It is NOT half-fixed here. Making `todayIso` local while `utcMondayIso` and `addDaysIso`
// stay UTC would be worse than either — an inconsistent set can call an unfinished week
// finished and offer a report for a week that has not ended. Converting the whole module to
// the org's week is its own change, with its own check against what the backend returns.

function utcMondayIso(d: Date): string {
  const dow = d.getUTCDay(); // 0=Sun..6=Sat
  const back = (dow === 0 ? -6 : 1) - dow;
  const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + back));
  return m.toISOString().slice(0, 10);
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** A Monday-week is ended once its exclusive end (Monday + 7) is on/before today. */
function isWeekEnded(weekStartIso: string): boolean {
  return addDaysIso(weekStartIso, 7) <= todayIso();
}

/** The most recently completed week — this week's Monday minus 7 days. */
function previousWeekMonday(): string {
  return addDaysIso(utcMondayIso(new Date()), -7);
}

// ── Section extraction (tolerates older backend builds that return a single
//    markdown `narrative` instead of structured `sections`) ──

const CANONICAL_SECTIONS: { key: string; heading: string }[] = [
  { key: "summary", heading: "Summary" },
  { key: "whatGotDone", heading: "What got done" },
  { key: "constraints", heading: "Constraints & how you navigated them" },
  { key: "frameworks", heading: "Frameworks & capabilities applied" },
  { key: "timeSpent", heading: "Where your time went" },
  { key: "carryForward", heading: "Carry into next week" },
];

function keyForHeading(heading: string, index: number): string {
  const h = heading.trim().toLowerCase();
  const match = CANONICAL_SECTIONS.find((c) => c.heading.toLowerCase() === h);
  if (match) return match.key;
  const slug = h.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || `section-${index}`;
}

/** Split a markdown report on its `## ` headings into editable sections. */
function parseNarrative(md: string): WeeklyReportAiSection[] {
  if (!md || !md.trim()) return [];
  return md
    .split(/^##\s+/m)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((part, i) => {
      const nl = part.indexOf("\n");
      const heading = (nl === -1 ? part : part.slice(0, nl)).trim();
      const body = (nl === -1 ? "" : part.slice(nl + 1)).trim();
      return { key: keyForHeading(heading, i), heading, body };
    });
}

/** Prefer structured `sections`; fall back to parsing a markdown `narrative`. */
function extractSections(
  data: { sections?: WeeklyReportAiSection[]; narrative?: string | null } | null | undefined,
): WeeklyReportAiSection[] {
  if (!data) return [];
  if (Array.isArray(data.sections) && data.sections.length > 0) return data.sections;
  if (typeof data.narrative === "string") return parseNarrative(data.narrative);
  return [];
}

/** Flatten sections back to markdown so an older narrative-based backend can store the edits. */
function flattenSections(sections: WeeklyReportAiSection[]): string {
  return sections
    .filter((s) => s.body && s.body.trim())
    .map((s) => `## ${s.heading}\n\n${s.body.trim()}`)
    .join("\n\n");
}

/**
 * Drives the AI weekly report screen. Only ENDED weeks can be viewed/generated;
 * the default is the most recently completed week, and "next" never reaches the
 * in-progress current week.
 */
export function useWeeklyReportAi() {
  const queryClient = useQueryClient();
  const byok = useAtomValue(byokConfigAtom);
  const browserByokConfigured = useAtomValue(byokConfiguredAtom);
  const { data: storedKeys } = useByokKeys();
  const serverByokConfigured = (storedKeys ?? []).some(isServerByokKeyUsableForAavahanaAi);
  const byokConfigured = browserByokConfigured || serverByokConfigured;

  const [weekStart, setWeekStart] = useState<string>(previousWeekMonday);
  const [sections, setSections] = useState<WeeklyReportAiSection[]>([]);
  const [dirty, setDirty] = useState(false);

  const { data: report = null, isLoading } = useApi({
    queryKey: ["weekly-report-ai", weekStart],
    queryFn: () => ReportService.getWeeklyReportAi(weekStart),
  });

  // Seed the editable sections from the server while the user hasn't edited.
  // Tolerates an older backend that returns a markdown `narrative` instead of
  // structured `sections`.
  useEffect(() => {
    if (!dirty) setSections(extractSections(report));
  }, [report, dirty]);

  // Reset edit state when the selected week changes.
  useEffect(() => {
    setDirty(false);
  }, [weekStart]);

  const generateMutation = useApiMutation({
    mutationFn: () => {
      const payload = {
        weekStart,
        ...(browserByokConfigured
          ? {
              apiKey: byok.apiKey,
              provider: byok.provider,
              model: normalizeByokModel(byok.model),
            }
          : {}),
      };
      return ReportService.generateWeeklyReportAi(payload);
    },
    onSuccess: (data) => {
      const next = extractSections(data);
      setSections(next);
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["weekly-report-ai", weekStart] });
      if (next.some((s) => s.body && s.body.trim())) toast.success("Weekly report generated");
      else toast.error("The AI returned an empty report — try regenerating.");
    },
    onError: (e) => toast.error(e.message || "Failed to generate weekly report"),
  });

  const submitMutation = useApiMutation({
    mutationFn: () =>
      ReportService.submitWeeklyReportAi({ weekStart, sections, narrative: flattenSections(sections) }),
    onSuccess: (result) => {
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["weekly-report-ai", weekStart] });
      toast.success("Weekly report submitted");
      // Variable reward (F2): surface the rotating insight the submit returned.
      showInsightToast(result?.insight);
    },
    onError: (e) => toast.error(e.message || "Failed to submit weekly report"),
  });

  const weekEnded = report?.weekEnded ?? isWeekEnded(weekStart);
  const canGoNext = isWeekEnded(addDaysIso(weekStart, 7));
  const safeSections = Array.isArray(sections) ? sections : [];

  return {
    report: report as WeeklyReportAi | null,
    isLoading,
    weekStart,
    weekEnd: addDaysIso(weekStart, 6),
    weekEnded,
    sections: safeSections,
    hasSections: safeSections.length > 0,
    setSectionBody: (key: string, body: string) => {
      setDirty(true);
      setSections((prev) =>
        (Array.isArray(prev) ? prev : []).map((s) => (s.key === key ? { ...s, body } : s)),
      );
    },
    byokConfigured,
    goPrev: () => setWeekStart((w) => addDaysIso(w, -7)),
    goNext: () => setWeekStart((w) => (isWeekEnded(addDaysIso(w, 7)) ? addDaysIso(w, 7) : w)),
    canGoNext,
    generate: async () => {
      try {
        await generateMutation.mutateAsync(undefined);
      } catch {
        /* onError surfaces the toast */
      }
    },
    isGenerating: generateMutation.isPending,
    submit: async () => {
      try {
        await submitMutation.mutateAsync(undefined);
      } catch {
        /* onError surfaces the toast */
      }
    },
    isSubmitting: submitMutation.isPending,
  };
}
