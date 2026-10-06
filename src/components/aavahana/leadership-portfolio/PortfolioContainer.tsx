"use client";

import { EmptyState } from "@/components/shared/EmptyState";
import { LayersIcon } from "@/components/shared/icons";
import type { LeadershipPortfolio, LeadershipPortfolioSection, PortfolioSectionType } from "@/types";

/**
 * A portfolio is a career artifact, not a dashboard.
 *
 * Built to the conclusion recorded in PDGMSDocs/ToDo/leadership-portfolio-experiment3.md,
 * which the live page never adopted. Experiments 1 and 2 were rejected there for
 * sharing one flaw: "card -> title -> paragraph -> data widgets -> repeat. That
 * is a dashboard pattern." So:
 *
 *   - No cards. Sections are separated by whitespace and a hairline rule.
 *   - Typography is the hierarchy. The narrative IS the section, at reading size.
 *   - One or two numbers, large. Not a grid of stat boxes, not progress bars.
 *   - First person. This is the document you present about your own month.
 *
 * What experiment 3 did not solve, because its mock data was fully populated:
 * most real months are partly unevidenced. The backend already distinguishes the
 * two cases — it sets `missingReason` only when it could not measure something —
 * so "nothing happened" reads as a finding and "not measured" reads as a gap,
 * and neither one renders as a grid of nulls.
 */

/** Past -> present -> future. The order is the argument, so it is fixed here, not by the API. */
const SECTION_ORDER: PortfolioSectionType[] = [
  "executive_summary",
  "contribution_highlights",
  "capability_growth",
  "kpi_impact",
  "constraint_patterns",
  "career_trajectory",
];

/** First person, per experiment 3. "KPI Impact" is a report heading, not a portfolio one. */
const SECTION_TITLE: Record<PortfolioSectionType, string> = {
  executive_summary: "Where I Stand",
  contribution_highlights: "What I Delivered",
  capability_growth: "How I'm Growing",
  kpi_impact: "What Moved",
  constraint_patterns: "What Got In The Way",
  career_trajectory: "Where I'm Headed",
};

type Figure = { label: string; value: string; sub?: string };

/**
 * Per-section whitelist, at most two figures each. Anything not named here never
 * reaches the page — the old `Object.entries(dataPoints)` dump printed
 * `missingReason`, `weekId` and every null as though they were findings.
 */
const FIGURES: Record<PortfolioSectionType, (d: Record<string, unknown>) => Figure[]> = {
  executive_summary: (d) =>
    [
      num(d.compositeScore, "Composite score", "out of 100"),
      text(prettyPace(d.paceStatus), "Pace"),
    ].filter(present),

  contribution_highlights: (d) =>
    [
      num(d.ipCommitCount, "Original work", "verified contributions"),
      num(nested(d.ideas, "total"), "Ideas", ideaSub(d.ideas)),
    ].filter(present),

  capability_growth: (d) =>
    [
      text(percent(d.deliveryRate), "Delivery"),
      num(d.ipScore, "Knowledge work"),
    ].filter(present),

  kpi_impact: (d) =>
    [num(d.verifiedCount, "KPIs met", kpiSub(d.totalKpiCommits))].filter(present),

  constraint_patterns: (d) =>
    [num(d.resolved, "Constraints resolved", constraintSub(d.totalConstraints))].filter(present),

  career_trajectory: (d) =>
    [
      text(d.nextMilestoneLevel ?? d.projectedNextLevel, "Next milestone"),
      text(d.projectedDate, "Projected"),
    ].filter(present),
};

export function PortfolioContainer({
  portfolio,
  subjectName,
  subjectRole,
}: {
  portfolio: LeadershipPortfolio | null;
  /** Whose month this is. Falls back to the uid when a manager opens someone else's. */
  subjectName?: string;
  subjectRole?: string;
}) {
  if (!portfolio || portfolio.sections.length === 0) {
    return (
      <EmptyState
        icon={<LayersIcon size="lg" />}
        title="No portfolio for this month"
        subtitle="Generate it once the month has evidence — plans, reports, KPI commitments and career snapshots."
      />
    );
  }

  const byId = new Map(portfolio.sections.map((s) => [s.id, s]));
  const sections = SECTION_ORDER.map((id) => byId.get(id)).filter(
    Boolean,
  ) as LeadershipPortfolioSection[];
  const measured = sections.filter(isMeasured).length;

  return (
    // A measure, not a page wrapper: no mx-auto and no padding, so the shell keeps
    // owning width and gutters. Prose past ~75 characters stops being readable.
    <article className="max-w-3xl">
      <Hero
        subjectName={subjectName}
        subjectRole={subjectRole}
        uid={portfolio.uid}
        monthId={portfolio.monthId}
        sections={sections}
        measured={measured}
      />

      {sections.map((section) => (
        <Slide key={section.id} section={section} />
      ))}

      {portfolio.generatedAt && (
        <p className="pt-8 text-xs text-base-content/40">
          Compiled{" "}
          {new Date(portfolio.generatedAt).toLocaleDateString(undefined, {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}
    </article>
  );
}

function Hero({
  subjectName,
  subjectRole,
  uid,
  monthId,
  sections,
  measured,
}: {
  subjectName?: string;
  subjectRole?: string;
  uid: string;
  monthId?: string;
  sections: LeadershipPortfolioSection[];
  measured: number;
}) {
  const summary = sections.find((s) => s.id === "executive_summary");
  const level = asString(summary?.dataPoints.currentLevel);

  return (
    <section className="border-b border-base-300 py-10 sm:py-14">
      <p className="text-2xl font-bold text-base-content sm:text-3xl">
        {subjectName || `UID ${uid}`}
      </p>
      {(subjectRole || level) && (
        <p className="mt-1 text-sm text-base-content/50">
          {[subjectRole, level].filter(Boolean).join(" · ")}
        </p>
      )}

      <p className="mt-6 text-sm uppercase tracking-widest text-base-content/40">
        {monthLabel(monthId)}
      </p>

      {/* The verdict. Only claims a shape for the month when enough of it was
          measured to say one honestly; otherwise it names the gap instead. */}
      <p className="mt-4 text-xl font-semibold text-base-content sm:text-2xl">
        {verdict(measured, sections.length)}
      </p>
      <p className="mt-1 text-base text-base-content/70 sm:text-lg">
        {measured} of {sections.length} sections carry evidence.
        {measured < sections.length && " The rest need data this month didn't record."}
      </p>
    </section>
  );
}

function Slide({ section }: { section: LeadershipPortfolioSection }) {
  const measured = isMeasured(section);
  const title = SECTION_TITLE[section.id] ?? section.title;

  if (!measured) {
    // Kept in place so the arc stays whole, but quiet: a title and one honest
    // sentence naming what would fill it. No numbers, no empty grid.
    return (
      <section className="border-b border-base-300 py-8">
        <p className="text-lg font-semibold uppercase tracking-wide text-base-content/30">
          {title}
        </p>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-base-content/45">
          {asString(section.dataPoints.missingReason) ||
            section.narrative ||
            "Nothing has been recorded for this section yet."}
        </p>
      </section>
    );
  }

  const figures = FIGURES[section.id]?.(section.dataPoints) ?? [];
  const latest = asString(section.dataPoints.latestCommit);

  return (
    <section className="border-b border-base-300 py-10 sm:py-14">
      <p className="text-lg font-semibold uppercase tracking-wide text-base-content/50">
        {title}
      </p>

      <p className="mt-4 max-w-2xl text-base leading-relaxed text-base-content/80 sm:text-lg">
        {section.narrative || "No narrative was recorded for this evidence."}
      </p>

      {latest && (
        <p className="mt-4 max-w-2xl border-l-2 border-base-300 pl-4 text-base italic leading-relaxed text-base-content/60">
          {latest}
        </p>
      )}

      {figures.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-x-16 gap-y-8 sm:gap-x-20">
          {figures.map((f) => (
            <div key={f.label}>
              <p className="text-4xl font-bold tabular-nums text-base-content sm:text-5xl">
                {f.value}
              </p>
              <p className="mt-1 text-xs text-base-content/50">{f.label}</p>
              {f.sub && <p className="text-xs text-base-content/40">{f.sub}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Evidence rules ───────────────────────────────────────────────────────────

/**
 * Measured unless the backend said it could not compute the section.
 * A true zero ("no KPI commitments this month") still counts — that is a finding
 * about the month, not a hole in the record.
 */
function isMeasured(section: LeadershipPortfolioSection): boolean {
  return !asString(section.dataPoints.missingReason);
}

/** Never assert a shape for a month that was mostly unmeasured. */
function verdict(measured: number, total: number): string {
  if (measured === total) return "A full month on the record.";
  if (measured === 0) return "This month has no evidence yet.";
  if (measured >= total / 2) return "A partial record.";
  return "Most of this month went unmeasured.";
}

// ── Formatters ───────────────────────────────────────────────────────────────

function present(f: Figure | null): f is Figure {
  return f !== null;
}

function num(value: unknown, label: string, sub?: string): Figure | null {
  const n = Number(value);
  return value != null && Number.isFinite(n) ? { label, value: String(n), sub } : null;
}

function text(value: unknown, label: string, sub?: string): Figure | null {
  const s = asString(value);
  return s ? { label, value: s, sub } : null;
}

function asString(value: unknown): string {
  if (value == null || typeof value === "object") return "";
  return String(value).trim();
}

function nested(value: unknown, key: string): unknown {
  return value && typeof value === "object" ? (value as Record<string, unknown>)[key] : null;
}

/** Stored 0–1; a portfolio reads in whole percent. */
function percent(value: unknown): string {
  const n = Number(value);
  return value != null && Number.isFinite(n) ? `${Math.round(n * 100)}%` : "";
}

function ideaSub(ideas: unknown): string | undefined {
  const implemented = Number(nested(ideas, "implemented"));
  return Number.isFinite(implemented) ? `${implemented} implemented` : undefined;
}

function kpiSub(total: unknown): string | undefined {
  const n = Number(total);
  return Number.isFinite(n) ? `out of ${n} committed` : undefined;
}

function constraintSub(total: unknown): string | undefined {
  const n = Number(total);
  return Number.isFinite(n) ? `out of ${n} raised` : undefined;
}

/** `on_track` is a database value, not something a person should read. */
function prettyPace(value: unknown): string {
  const s = asString(value);
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}

function monthLabel(monthId?: string): string {
  if (!monthId) return "";
  const [year, month] = monthId.split("-").map(Number);
  if (!year || !month) return monthId;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
