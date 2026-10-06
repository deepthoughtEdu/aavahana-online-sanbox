"use client";

import { useState } from "react";
import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { renderToStaticMarkup } from "react-dom/server";
import { Download } from "lucide-react";
import { useWeeklyReportAi } from "@/lib/hooks/aavahana/use-weekly-report-ai";
import { useApi } from "@/lib/hooks/shared/use-api";
import { ReportService } from "@/lib/services/aavahana/report.service";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/Section";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { AssetMarkdown } from "@/components/crm/assets/AssetMarkdown";
import { WeekDailiesReview } from "@/components/aavahana/report/WeekDailiesReview";
import { WeeklyReportQuestions } from "./_components/WeeklyReportQuestions";
import {
  SparklesIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/shared/icons";
import { formatDate } from "@/utils/shared/date.utils";
import { cn } from "@/utils";
import type { WeeklyReportAiSection } from "@/types/aavahana/weekly-report-ai.types";

// ── PDF export: render the report to formatted HTML and print it (Save as PDF).
//    Uses a hidden iframe so it survives popup blockers.

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function mdToHtml(md: string): string {
  return renderToStaticMarkup(<Markdown remarkPlugins={[remarkGfm]}>{md}</Markdown>);
}

const PRINT_CSS = `
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a; margin: 40px; line-height: 1.55; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .meta { color: #666; font-size: 13px; margin-bottom: 24px; }
  h2 { font-size: 16px; margin: 22px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  p { margin: 6px 0; }
  ul, ol { margin: 6px 0 6px 22px; }
  li { margin: 3px 0; }
  strong { font-weight: 600; }
  @media print { body { margin: 24px; } section { break-inside: avoid; } }
`;

function downloadReportPdf(title: string, meta: string, sections: WeeklyReportAiSection[]) {
  const body = sections
    .filter((s) => s.body.trim())
    .map((s) => `<section><h2>${escapeHtml(s.heading)}</h2>${mdToHtml(s.body)}</section>`)
    .join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(
    title,
  )}</title><style>${PRINT_CSS}</style></head><body><h1>${escapeHtml(
    title,
  )}</h1><div class="meta">${escapeHtml(meta)}</div>${body}</body></html>`;

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  iframe.srcdoc = html;
  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => iframe.remove(), 1000);
  };
  document.body.appendChild(iframe);
}

export default function WeeklyReportPage() {
  const {
    report,
    isLoading,
    weekStart,
    weekEnd,
    weekEnded,
    sections,
    hasSections,
    setSectionBody,
    byokConfigured,
    goPrev,
    goNext,
    canGoNext,
    generate,
    isGenerating,
    submit,
    isSubmitting,
  } = useWeeklyReportAi();

  // The source data: the week's submitted daily reports, shown for review above
  // the Generate button so the user sees what the report is built from.
  const { data: dailies, isLoading: dailiesLoading } = useApi({
    queryKey: ["week-dailies", weekStart],
    queryFn: () => ReportService.getWeekDailies(weekStart),
  });

  const [mode, setMode] = useState<"preview" | "edit">("preview");

  const status = report?.status ?? "draft";
  // Once submitted, the weekly report is frozen — read-only, no regenerate/submit.
  const locked = status === "submitted" || status === "locked";
  const effectiveMode: "preview" | "edit" = locked ? "preview" : mode;
  const weekRange = `${formatDate(weekStart, "MMM DD")} – ${formatDate(weekEnd, "MMM DD, YYYY")}`;
  const reportedDays = report ? report.weekdayCount - report.missingDays.length : 0;
  const allBodiesEmpty = sections.every((s) => !s.body.trim());

  const onDownload = () =>
    downloadReportPdf(
      `Weekly Report — ${weekRange}`,
      `${reportedDays} of ${report?.weekdayCount ?? 0} weekday reports submitted`,
      sections,
    );

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Weekly Report" subtitle={weekRange}>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            shape="circle"
            variant="soft"
            color="secondary"
            onClick={goPrev}
            iconBefore={<ChevronLeftIcon size="sm" />}
            tooltip={{ text: "Previous week", position: "bottom" }}
          />
          <Button
            size="sm"
            shape="circle"
            variant="soft"
            color="secondary"
            onClick={goNext}
            disabled={!canGoNext}
            iconBefore={<ChevronRightIcon size="sm" />}
            tooltip={{ text: "Next week", position: "bottom" }}
          />
          <Badge
            variant={status === "submitted" ? "success" : status === "locked" ? "neutral" : "warning"}
            size="sm"
            label={status}
          />
        </div>
      </PageHeader>

      <div className="space-y-4">
        {/* 1. The source data — always visible */}
        <WeekDailiesReview data={dailies} isLoading={dailiesLoading} />

        {/* Calibration + closure questions (FE-W1.2) */}
        <WeeklyReportQuestions weekStart={weekStart} />

        {/* 2 + 3. Generate → edit → submit */}
        {isLoading ? (
          <Section>
            <Section.Body>
              <p className="text-sm text-neutral py-6 text-center">Loading weekly report…</p>
            </Section.Body>
          </Section>
        ) : !byokConfigured ? (
          <Section>
            <Section.Body>
              <EmptyState
                icon={<SparklesIcon size="lg" />}
                title="Set up your AI key to generate"
                subtitle="The weekly report is drafted by your own AI provider (BYOK) from the daily reports above. Add your API key once to enable it."
                variant="info"
                size="md"
              >
                <Link href="/aavahana/settings/ai-coach" className="btn btn-primary btn-sm">
                  Set up AI key
                </Link>
              </EmptyState>
            </Section.Body>
          </Section>
        ) : (
          <>
            {/* Generate control */}
            <Section>
              <Section.Header
                icon={<CalendarIcon size="sm" />}
                title={locked ? "Weekly report submitted" : "Generate your weekly report"}
                subtitle={
                  locked
                    ? "This report has been submitted and can no longer be changed."
                    : "Synthesize the daily reports above into an editable summary"
                }
                size="sm"
              >
                {!locked && (
                  <Button
                    size="sm"
                    variant="soft"
                    color="primary"
                    loading={isGenerating}
                    disabled={!weekEnded || isGenerating || isSubmitting}
                    onClick={generate}
                    iconBefore={<SparklesIcon size="sm" />}
                  >
                    {hasSections ? "Regenerate" : "Generate weekly report"}
                  </Button>
                )}
              </Section.Header>
              <Section.Body>
                {report && (
                  <p className="text-sm text-neutral">
                    {reportedDays} of {report.weekdayCount} weekday report
                    {report.weekdayCount === 1 ? "" : "s"} submitted.
                    {report.missingDays.length > 0 && (
                      <> Missing: {report.missingDays.map((d) => formatDate(d, "ddd DD")).join(", ")}.</>
                    )}
                  </p>
                )}
                {!weekEnded && !locked && (
                  <p className="text-sm text-warning mt-1">
                    This week hasn&apos;t ended yet — use the back arrow to pick a completed week.
                  </p>
                )}
              </Section.Body>
            </Section>

            {/* Report */}
            {isGenerating ? (
              <Section>
                <Section.Body>
                  <p className="text-sm text-neutral py-6 text-center">
                    Reading your week and writing the report… this can take a few seconds.
                  </p>
                </Section.Body>
              </Section>
            ) : hasSections ? (
              <>
                {/* Toolbar: edit/preview toggle + download */}
                <div className="flex items-center justify-between gap-2">
                  {locked ? (
                    <span className="text-sm text-neutral">Submitted — read only</span>
                  ) : (
                    <div className="join">
                      <button
                        type="button"
                        className={cn("btn btn-sm join-item", mode === "preview" && "btn-active")}
                        onClick={() => setMode("preview")}
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        className={cn("btn btn-sm join-item", mode === "edit" && "btn-active")}
                        onClick={() => setMode("edit")}
                      >
                        Edit
                      </button>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="soft"
                    color="secondary"
                    onClick={onDownload}
                    disabled={allBodiesEmpty}
                    iconBefore={<Download size={16} />}
                  >
                    Download PDF
                  </Button>
                </div>

                {sections.map((s) => (
                  <Section key={s.key}>
                    <Section.Header title={s.heading} size="sm">
                      {!s.body.trim() && <Badge variant="warning" size="sm" label="not generated" />}
                    </Section.Header>
                    <Section.Body>
                      {effectiveMode === "preview" ? (
                        s.body.trim() ? (
                          <AssetMarkdown content={s.body} />
                        ) : (
                          <p className="text-sm text-neutral italic">
                            {locked
                              ? "This section was left empty."
                              : "The AI didn't generate this section. Switch to Edit to write it, or Regenerate."}
                          </p>
                        )
                      ) : (
                        <textarea
                          value={s.body}
                          onChange={(e) => setSectionBody(s.key, e.target.value)}
                          rows={6}
                          className="textarea textarea-bordered w-full text-sm leading-relaxed"
                          placeholder={
                            s.body.trim()
                              ? "Edit this section before submitting…"
                              : "The AI didn't generate this section — write it yourself, or use Regenerate."
                          }
                        />
                      )}
                    </Section.Body>
                  </Section>
                ))}

                {!locked && (
                  <div className="flex items-center justify-end">
                    <Button
                      size="sm"
                      color="primary"
                      loading={isSubmitting}
                      disabled={isSubmitting || isGenerating || allBodiesEmpty}
                      onClick={submit}
                    >
                      Submit report
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Section>
                <Section.Body>
                  <EmptyState
                    icon={<SparklesIcon size="lg" />}
                    title="No report generated yet"
                    subtitle="Click “Generate weekly report” to turn the daily reports above into a summary you can edit section by section."
                    variant="empty"
                    size="md"
                  />
                </Section.Body>
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
