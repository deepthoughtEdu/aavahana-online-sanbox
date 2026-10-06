"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Section } from "@/components/shared/Section";
import { EmptyState } from "@/components/shared/EmptyState";
import { useReflectionDataset } from "@/lib/hooks/hcd/use-recognition";
import { toJsonl, type ReviewRow } from "@/lib/services/hcd/tacit-clean";

// Local calendar day, YYYY-MM-DD.
function dateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const CLEANING_STEPS = [
  "Whitespace, quotes and dashes are normalised.",
  "Emails, phone numbers, URLs and @handles are redacted to placeholders.",
  "Filler openers and closers (“in this reflection…”, “thanks”) are stripped.",
  "Fragments under four words and repeated lines are dropped.",
  "Entries left too short, too repetitive or too low in vocabulary variety are excluded, never rewritten.",
  "Each kept reflection is paired with a fixed prompt — no model is used to generate or paraphrase.",
];

function downloadJsonl(rows: ReviewRow[]) {
  const blob = new Blob([toJsonl(rows)], {
    type: "application/x-ndjson;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hcd-tacit-knowledge-${dateKey(new Date())}.jsonl`;
  a.click();
  URL.revokeObjectURL(url);
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center px-3">
      <div className="text-2xl font-bold tabular-nums leading-none">{value}</div>
      <div className="text-[0.65rem] dt-text-dim uppercase tracking-wide mt-1.5">
        {label}
      </div>
    </div>
  );
}

export function TacitKnowledgeView() {
  const { data, isLoading, error } = useReflectionDataset();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(toJsonl(data.rows));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const sample = data?.rows.find((r) => r.record)?.record ?? null;

  return (
    <Section>
      <Section.Header
        title="Tacit knowledge dataset"
        subtitle="Reflections captured at the end of each assessment, cleaned into training examples for a private model. Managers and admins only."
      >
        {data && data.stats.included > 0 && (
          <>
            <button
              onClick={() => downloadJsonl(data.rows)}
              className="btn btn-primary btn-sm gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              Download JSONL
            </button>
            <button onClick={handleCopy} className="btn btn-ghost btn-sm">
              {copied ? "Copied" : "Copy"}
            </button>
          </>
        )}
      </Section.Header>
      <Section.Body>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-sm" />
          </div>
        ) : error ? (
          <EmptyState
            size="sm"
            variant="error"
            title="Couldn't load the dataset"
            subtitle="You may not have access, or there's no data yet."
          />
        ) : !data?.rows.length ? (
          <EmptyState
            size="sm"
            title="No reflections yet"
            subtitle="Reflections appear here once people finish an assessment."
          />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-y-4">
              <Stat label="Reflections" value={data.stats.total} />
              <Stat label="In dataset" value={data.stats.included} />
              <Stat label="Excluded" value={data.stats.excluded} />
              <Stat label="Redacted" value={data.stats.withRedactions} />
            </div>

            <div className="flex flex-wrap gap-2">
              {data.stats.byFramework.map((f) => (
                <span
                  key={f.frameworkKey}
                  className="badge badge-outline badge-sm gap-1"
                >
                  {f.frameworkName}
                  <span className="dt-text-dim">
                    {f.included}
                    {f.excluded > 0 ? ` (+${f.excluded} out)` : ""}
                  </span>
                </span>
              ))}
            </div>

            <div className="rounded-lg border border-base-300 bg-base-200 p-4">
              <p className="text-xs font-medium dt-text-dim uppercase tracking-wide mb-2">
                How the data is cleaned
              </p>
              <ul className="text-xs dt-text-dim space-y-1 list-disc pl-4">
                {CLEANING_STEPS.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>

            {sample && (
              <div>
                <p className="text-xs font-medium dt-text-dim uppercase tracking-wide mb-2">
                  Record shape
                </p>
                <div className="overflow-x-auto rounded-lg border border-base-300 bg-base-100">
                  <pre className="text-xs font-mono p-4 whitespace-pre-wrap break-words">
                    {JSON.stringify(sample, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Reflection</th>
                    <th>Framework</th>
                    <th>Captured</th>
                    <th>Raw</th>
                    <th>Cleaned</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.raw.id} className="align-top">
                      <td className="font-medium text-black whitespace-nowrap">
                        #{row.raw.id}
                      </td>
                      <td className="whitespace-nowrap">
                        {row.raw.frameworkName}
                      </td>
                      <td className="whitespace-nowrap dt-text-dim">
                        {dateKey(new Date(row.raw.submittedAt))}
                      </td>
                      <td>
                        <div className="w-80">
                          <p className="text-xs dt-text-dim line-clamp-3">
                            {row.raw.rawText}
                          </p>
                        </div>
                      </td>
                      <td>
                        {row.record ? (
                          <div className="w-80">
                            <p className="text-xs line-clamp-3">
                              {row.record.completion}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs dt-text-dim">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap">
                        {row.status === "included" ? (
                          <span className="badge badge-success badge-sm">
                            In dataset
                          </span>
                        ) : (
                          <span className="badge badge-ghost badge-sm">
                            Excluded
                          </span>
                        )}
                        <p
                          className={`text-xs mt-1 ${
                            row.status === "included"
                              ? "dt-text-dim"
                              : "text-error"
                          }`}
                        >
                          {row.note}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Section.Body>
    </Section>
  );
}
