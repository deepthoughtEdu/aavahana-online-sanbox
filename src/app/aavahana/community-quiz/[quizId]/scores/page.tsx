"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useCommunityQuizDetail, useCommunityQuizScores, useCommunityQuizAnalytics } from "@/lib/hooks/aavahana/use-community-quiz";
import { DataTable, type DataTableColumn } from "@/components/shared/ui/DataTable";
import { ListCheckIcon } from "@/components/shared/icons";
import type { QuizScore } from "@/types/aavahana/community-quiz.types";

type SortKey = "eid" | "score" | "correctCount";
type SortDir = "asc" | "desc";

const BAIT_LABELS: Record<string, string> = {
  VIRTUE_BAIT: "Virtue Bait",
  VICE_BAIT: "Vice Bait",
  OVERGENERALIZATION: "Overgen.",
  EMOTIONAL_APPEAL: "Emotional",
  STRAW_MAN: "Straw Man",
  FALSE_PRECISION: "False Prec.",
  ASSUMPTION_INJECTION: "Assumption",
};

export default function CommunityQuizScoresPage() {
  const params = useParams<{ quizId: string }>();
  const quizId = Number(params.quizId);
  const { quiz, isLoading: quizLoading } = useCommunityQuizDetail(quizId);
  const { scores, isLoading: scoresLoading } = useCommunityQuizScores(quizId);
  const { analytics } = useCommunityQuizAnalytics(quizId);

  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const allBaitTypes = useMemo(() => {
    const types = new Set<string>();
    scores.forEach((s) => {
      if (s.baitAnalysis) {
        Object.keys(s.baitAnalysis).forEach((k) => types.add(k));
      }
    });
    return Array.from(types);
  }, [scores]);

  const sorted = useMemo(() => {
    return [...scores].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [scores, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "eid" ? "asc" : "desc");
    }
  };

  const distribution = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0]; // 0-20, 21-40, 41-60, 61-80, 81-100
    scores.forEach((s) => {
      const pct = s.score * 100;
      const idx = Math.min(Math.floor(pct / 20), 4);
      buckets[idx]++;
    });
    return buckets;
  }, [scores]);

  const columns = useMemo<DataTableColumn<QuizScore>[]>(() => {
    const sortIcon = (col: SortKey) =>
      sortKey !== col ? (
        <span className="opacity-30 ml-1">↕</span>
      ) : (
        <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
      );
    const sortableHeader = (label: string, col: SortKey) => (
      <span className="cursor-pointer select-none" onClick={() => handleSort(col)}>
        {label}
        {sortIcon(col)}
      </span>
    );
    return [
      {
        key: "eid",
        title: sortableHeader("EID", "eid"),
        render: (_: unknown, s: QuizScore) => <span className="font-mono text-xs">{s.eid}</span>,
      },
      {
        key: "score",
        title: sortableHeader("Score", "score"),
        render: (_: unknown, s: QuizScore) => (
          <span
            className={`badge badge-sm ${
              s.score >= 0.8 ? "badge-success" : s.score >= 0.5 ? "badge-warning" : "badge-error"
            }`}
          >
            {(s.score * 100).toFixed(0)}%
          </span>
        ),
      },
      {
        key: "correctCount",
        title: sortableHeader("Correct", "correctCount"),
        render: (_: unknown, s: QuizScore) => s.correctCount,
      },
      {
        key: "totalMcqs",
        label: "Total",
        render: (_: unknown, s: QuizScore) => s.totalMcqs,
      },
      ...allBaitTypes.map(
        (bt): DataTableColumn<QuizScore> => ({
          key: bt,
          label: BAIT_LABELS[bt] ?? bt.replace(/_/g, " "),
          align: "center",
          render: (_: unknown, s: QuizScore) =>
            s.baitAnalysis?.[bt] ? (
              <span className="badge badge-xs badge-error">{s.baitAnalysis[bt]}</span>
            ) : (
              <span className="text-xs dt-text-dim">—</span>
            ),
        })
      ),
    ];
    // handleSort only calls stable state setters; sort state drives the rebuild.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortKey, sortDir, allBaitTypes]);

  if (quizLoading || scoresLoading) {
    return <div className="p-10 text-center dt-text-dim">Loading scores…</div>;
  }

  if (!quiz) {
    return <div className="p-10 text-center text-error">Quiz not found.</div>;
  }

  return (
    <div className="space-y-6 pb-8">
      <h1 className="text-xl font-semibold">{quiz.title} — Score Sheet</h1>

      {scores.length === 0 ? (
        <p className="text-sm dt-text-dim">No scores yet. Quiz must be in &quot;scored&quot; state.</p>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="stat bg-base-200 rounded-xl p-3">
              <div className="stat-title text-xs">Participants</div>
              <div className="stat-value text-lg">{scores.length}</div>
            </div>
            <div className="stat bg-base-200 rounded-xl p-3">
              <div className="stat-title text-xs">Avg Score</div>
              <div className="stat-value text-lg">
                {analytics ? `${(analytics.averageScore * 100).toFixed(0)}%` : "—"}
              </div>
            </div>
            <div className="stat bg-base-200 rounded-xl p-3">
              <div className="stat-title text-xs">Perfect Scores</div>
              <div className="stat-value text-lg">
                {scores.filter((s) => s.score === 1).length}
              </div>
            </div>
            <div className="stat bg-base-200 rounded-xl p-3">
              <div className="stat-title text-xs">Total MCQs</div>
              <div className="stat-value text-lg">{scores[0]?.totalMcqs ?? 0}</div>
            </div>
          </div>

          {/* Score distribution bar */}
          <div className="p-4 rounded-xl border border-base-300 space-y-2">
            <h3 className="text-sm font-medium">Score Distribution</h3>
            <div className="flex items-end gap-1 h-16">
              {distribution.map((count, idx) => {
                const max = Math.max(...distribution, 1);
                const height = (count / max) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] dt-text-dim">{count}</span>
                    <div
                      className="w-full bg-primary/70 rounded-t"
                      style={{ height: `${height}%`, minHeight: count > 0 ? "4px" : "0" }}
                    />
                    <span className="text-[10px] dt-text-dim">{idx * 20}–{(idx + 1) * 20}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main scores table — remount on sort change so paging resets. */}
          <DataTable<QuizScore>
            key={`${sortKey}-${sortDir}`}
            title="Score Sheet"
            icon={<ListCheckIcon size="md" />}
            queryFn={async () => sorted}
            columns={columns}
            defaultPageSize={25}
            enableRefresh={false}
            autoHeight
            scroll={{ x: 720 }}
            emptyState={{ title: "No scores", subtitle: "No scores available." }}
          />

          {/* Bait susceptibility summary */}
          {analytics && Object.keys(analytics.baitSusceptibility).length > 0 && (
            <div className="p-4 rounded-xl border border-base-300 space-y-3">
              <h3 className="text-sm font-medium">Bait Susceptibility Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {Object.entries(analytics.baitSusceptibility).map(([type, data]) => (
                  <div key={type} className="flex items-center justify-between p-2 rounded-lg bg-base-200">
                    <span className="text-xs">{BAIT_LABELS[type] ?? type.replace(/_/g, " ")}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs dt-text-dim">{data.participantsAffected}/{scores.length}</span>
                      <div className="w-16 h-2 bg-base-300 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-error/70 rounded-full"
                          style={{ width: `${data.susceptibilityRate * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{(data.susceptibilityRate * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
