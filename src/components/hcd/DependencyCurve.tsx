"use client";

import { useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/Section";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { DownloadIcon, ChartLineIcon } from "@/components/shared/icons";
import { notify } from "@/utils/shared/toast.utils";
import { useDependencyCurve } from "@/lib/hooks/hcd/use-dependency-curve";
import {
  DependencyCurveService,
  type DependencyCurveMonth,
} from "@/lib/services/hcd/dependency-curve.service";

const RANGES = [
  { label: "6 mo", months: 6 },
  { label: "12 mo", months: 12 },
  { label: "24 mo", months: 24 },
] as const;

// "2026-01" -> "Jan 26" for a legible axis without inventing a day.
function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const idx = Number(m) - 1;
  const name = names[idx] ?? m;
  return `${name} ${y.slice(2)}`;
}

interface CurveTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DependencyCurveMonth }>;
}

function CurveTooltip({ active, payload }: CurveTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-md border border-base-300 bg-white px-3 py-2 text-sm shadow-sm">
      <p className="font-medium text-black">{monthLabel(row.month)}</p>
      <p className="text-neutral">{row.pct}% independent</p>
      <p className="text-neutral">
        {row.independent} of {row.total} originated
      </p>
    </div>
  );
}

export function DependencyCurve() {
  const [months, setMonths] = useState<number>(12);
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
  const captureRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, isError, error } = useDependencyCurve(months);

  const rows = data?.months ?? [];
  const hasActivity = rows.some((m) => m.total > 0);

  async function exportCsv() {
    setExporting("csv");
    try {
      await DependencyCurveService.downloadCsv(months);
      notify.success("CSV downloaded");
    } catch (e) {
      notify.error("CSV export failed");
      console.error("[hcd] dependency-curve csv", e);
    } finally {
      setExporting(null);
    }
  }

  // PDF = the surface as an image (chart + summary), for the investor slide.
  async function exportPdf() {
    const node = captureRef.current;
    if (!node) return;
    setExporting("pdf");
    try {
      const { domToBlob } = await import("modern-screenshot");
      const blob = await domToBlob(node, { scale: 2.5, type: "image/png", backgroundColor: "#ffffff" });
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(blob);
      });
      const { jsPDF } = await import("jspdf");
      const w = node.offsetWidth;
      const h = node.offsetHeight;
      const doc = new jsPDF({
        unit: "px",
        format: [w, h],
        orientation: w >= h ? "landscape" : "portrait",
        hotfixes: ["px_scaling"],
      });
      doc.addImage(dataUrl, "PNG", 0, 0, w, h);
      doc.save("dependency-curve.pdf");
      notify.success("PDF downloaded");
    } catch (e) {
      notify.error("PDF export failed");
      console.error("[hcd] dependency-curve pdf", e);
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        label="Growth Execution"
        title="Dependency curve"
        subtitle="Share of Improvement Objects client employees originated independently, per month. Zero-activity months read 0%."
      >
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            color="neutral"
            iconBefore={<DownloadIcon />}
            loading={exporting === "csv"}
            disabled={!!exporting || !hasActivity}
            onClick={exportCsv}
          >
            CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            color="neutral"
            iconBefore={<DownloadIcon />}
            loading={exporting === "pdf"}
            disabled={!!exporting || !hasActivity}
            onClick={exportPdf}
          >
            PDF
          </Button>
        </div>
      </PageHeader>

      <div className="flex items-center gap-2">
        {RANGES.map((r) => (
          <Button
            key={r.months}
            size="xs"
            variant={months === r.months ? undefined : "ghost"}
            color={months === r.months ? "primary" : "neutral"}
            onClick={() => setMonths(r.months)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      <div ref={captureRef}>
        <Section>
          <Section.Header
            icon={<ChartLineIcon />}
            title="Independent origination"
            subtitle={
              data
                ? `${data.summary.latestPct}% latest · ${data.summary.independent} of ${data.summary.total} over the window`
                : "Loading"
            }
          />
          <Section.Body>
            {isLoading ? (
              <div className="flex h-72 items-center justify-center text-neutral">Loading curve…</div>
            ) : isError ? (
              <EmptyState
                variant="error"
                title="Could not load the curve"
                subtitle={error instanceof Error ? error.message : "Try again."}
              />
            ) : !hasActivity ? (
              <EmptyState
                variant="empty"
                icon={<ChartLineIcon />}
                title="No lifecycle activity yet"
                subtitle="Every month in this window read 0%. No Improvement Objects were originated. The curve populates as employees file and advance their own IOs."
              />
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid stroke="var(--dt-border)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickFormatter={monthLabel}
                    stroke="var(--dt-textDim)"
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(v: number) => `${v}%`}
                    stroke="var(--dt-textDim)"
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    width={44}
                  />
                  <Tooltip content={<CurveTooltip />} />
                  <Line
                    type="linear"
                    dataKey="pct"
                    stroke="var(--dt-teal)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--dt-teal)" }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Section.Body>
        </Section>
      </div>
    </div>
  );
}
