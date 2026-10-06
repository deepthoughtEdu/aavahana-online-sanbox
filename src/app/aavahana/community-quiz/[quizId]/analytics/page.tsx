"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useCommunityQuizDetail, useCommunityQuizAnalytics, useCommunityQuizScores } from "@/lib/hooks/aavahana/use-community-quiz";

const BAIT_LABELS: Record<string, string> = {
  VIRTUE_BAIT: "Virtue Bait",
  VICE_BAIT: "Vice Bait",
  OVERGENERALIZATION: "Overgeneralization",
  EMOTIONAL_APPEAL: "Emotional Appeal",
  STRAW_MAN: "Straw Man",
  FALSE_PRECISION: "False Precision",
  ASSUMPTION_INJECTION: "Assumption Injection",
};

const BAIT_DESCRIPTIONS: Record<string, string> = {
  VIRTUE_BAIT: "Option sounds morally noble but misrepresents the speaker's actual point",
  VICE_BAIT: "Option attributes cynical/negative intent the speaker didn't express",
  OVERGENERALIZATION: "Takes a specific claim and stretches it to a universal",
  EMOTIONAL_APPEAL: "Replaces the speaker's logic with emotional framing",
  STRAW_MAN: "Distorts the argument into something easier to agree/disagree with",
  FALSE_PRECISION: "Adds spurious numerical/technical detail not in the original",
  ASSUMPTION_INJECTION: "Smuggles in an unstated premise the speaker never endorsed",
};

export default function CommunityQuizAnalyticsPage() {
  const params = useParams<{ quizId: string }>();
  const quizId = Number(params.quizId);
  const { quiz, isLoading: quizLoading } = useCommunityQuizDetail(quizId);
  const { analytics, isLoading: analyticsLoading } = useCommunityQuizAnalytics(quizId);
  const { scores } = useCommunityQuizScores(quizId);

  const topVulnerabilities = useMemo(() => {
    if (!analytics) return [];
    return Object.entries(analytics.baitSusceptibility)
      .sort(([, a], [, b]) => b.susceptibilityRate - a.susceptibilityRate);
  }, [analytics]);

  const scorePercentiles = useMemo(() => {
    if (scores.length === 0) return { p25: 0, p50: 0, p75: 0 };
    const sorted = [...scores].sort((a, b) => a.score - b.score);
    const p = (pct: number) => sorted[Math.floor(sorted.length * pct)]?.score ?? 0;
    return { p25: p(0.25), p50: p(0.5), p75: p(0.75) };
  }, [scores]);

  if (quizLoading || analyticsLoading) {
    return <div className="p-10 text-center dt-text-dim">Loading analytics…</div>;
  }

  if (!quiz || !analytics) {
    return <div className="p-10 text-center text-error">Quiz not found or not yet scored.</div>;
  }

  return (
    <div className="p-[24px_28px] space-y-6">
      <h1 className="text-xl font-semibold">{quiz.title} — Conceptual Clarity Analytics</h1>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3 rounded-xl bg-base-200 text-center">
          <div className="text-xs dt-text-dim">Participants</div>
          <div className="text-lg font-bold">{analytics.totalParticipants}</div>
        </div>
        <div className="p-3 rounded-xl bg-base-200 text-center">
          <div className="text-xs dt-text-dim">Avg Score</div>
          <div className="text-lg font-bold">{(analytics.averageScore * 100).toFixed(0)}%</div>
        </div>
        <div className="p-3 rounded-xl bg-base-200 text-center">
          <div className="text-xs dt-text-dim">P25</div>
          <div className="text-lg font-bold">{(scorePercentiles.p25 * 100).toFixed(0)}%</div>
        </div>
        <div className="p-3 rounded-xl bg-base-200 text-center">
          <div className="text-xs dt-text-dim">Median</div>
          <div className="text-lg font-bold">{(scorePercentiles.p50 * 100).toFixed(0)}%</div>
        </div>
        <div className="p-3 rounded-xl bg-base-200 text-center">
          <div className="text-xs dt-text-dim">P75</div>
          <div className="text-lg font-bold">{(scorePercentiles.p75 * 100).toFixed(0)}%</div>
        </div>
      </div>

      {/* Vulnerability ranking */}
      {topVulnerabilities.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-medium">Bait Vulnerability Ranking</h2>
          <p className="text-xs dt-text-dim">
            Ordered by susceptibility rate — higher means more participants fell for this trap type.
          </p>
          <div className="space-y-2">
            {topVulnerabilities.map(([type, data], idx) => (
              <div key={type} className="p-3 rounded-xl border border-base-300 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary">#{idx + 1}</span>
                    <span className="text-sm font-medium">
                      {BAIT_LABELS[type] ?? type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <span className={`badge badge-sm ${
                    data.susceptibilityRate >= 0.5 ? "badge-error" : data.susceptibilityRate >= 0.25 ? "badge-warning" : "badge-success"
                  }`}>
                    {(data.susceptibilityRate * 100).toFixed(0)}% susceptible
                  </span>
                </div>
                <div className="w-full h-2 bg-base-300 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      data.susceptibilityRate >= 0.5 ? "bg-error" : data.susceptibilityRate >= 0.25 ? "bg-warning" : "bg-success"
                    }`}
                    style={{ width: `${data.susceptibilityRate * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs dt-text-dim">
                  <span>{data.participantsAffected} of {analytics.totalParticipants} affected</span>
                  <span>{data.totalHits} total hits</span>
                </div>
                {BAIT_DESCRIPTIONS[type] && (
                  <p className="text-xs dt-text-dim italic mt-1">{BAIT_DESCRIPTIONS[type]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-base-300 text-center">
          <p className="text-sm dt-text-dim">No bait susceptibility data — all participants answered correctly.</p>
        </div>
      )}

      {/* Interpretation */}
      {topVulnerabilities.length > 0 && (
        <div className="p-4 rounded-xl bg-base-200 space-y-2">
          <h3 className="text-sm font-medium">What This Means</h3>
          <p className="text-xs dt-text-dim leading-relaxed">
            High susceptibility to a bait type indicates a systematic misunderstanding pattern in the group.
            {topVulnerabilities[0] && topVulnerabilities[0][1].susceptibilityRate >= 0.4 && (
              <> The most common trap (<strong>{BAIT_LABELS[topVulnerabilities[0][0]] ?? topVulnerabilities[0][0]}</strong>)
              affected {(topVulnerabilities[0][1].susceptibilityRate * 100).toFixed(0)}% of participants —
              consider revisiting this concept with the group.</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
