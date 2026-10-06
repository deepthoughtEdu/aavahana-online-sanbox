// components/daily-report/PostSubmissionView.tsx
"use client";

import { useState } from "react";
import { CheckCircle2, Target, TrendingUp, Brain } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Section } from "@/components/shared/Section";
import { Badge } from "@/components/shared/Badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn, formatDate, getTaskStatusMeta } from "@/utils";
import {
  borderRadius,
  gaps,
  bgColors,
  borderColors,
} from "@/utils/shared/design.utils";
import {
  ReportPlanItem,
  GetReportResponse,
  Framework,
  RubricScore,
  DailyReflectionEvaluated,
  ActivityTimestamps,
} from "@/types/aavahana/report.types";
import { EditIcon, LightbulbIcon, LogoutIcon } from "@/components/shared/icons";
import { IconBox } from "@/components/shared/IconBox";

interface PostSubmissionViewProps {
  planTasks: ReportPlanItem[];
  reportData: GetReportResponse | undefined;
  onUpdateReflection: (key: string, value: string) => Promise<void>;
}

export function PostSubmissionView({
  planTasks,
  reportData,
  onUpdateReflection,
}: PostSubmissionViewProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const dailyReflection: DailyReflectionEvaluated | undefined =
    reportData?.evaluated?.dailyReflection;
  const frameworks: Framework[] = reportData?.frameworks || [];
  const rubricScore: RubricScore | undefined =
    reportData?.evaluated?.rubricScore;
  const suggestions: string[] =
    reportData?.evaluated?.suggestions?.map((s) =>
      typeof s === "string" ? s : s.text
    ) || [];

  const logInLogout: ActivityTimestamps = {
    loginAt: reportData?.loginAt,
    logoutAt: reportData?.logoutAt,
  };

  const getReflectionText = (key: string): string => {
    if (!dailyReflection) return "";
    const data = dailyReflection[key as keyof DailyReflectionEvaluated];
    if (!data) return "";
    if (typeof data === "object" && "response" in data) {
      return String(data.response);
    }
    if (typeof data === "string") return data;
    return "";
  };

  return (
    <div className="space-y-6">
      {/* Main Grid: 40/60 split */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 items-start">
        {/* LEFT COLUMN - 40% */}
        <div className="space-y-6">
          {/* Tasks with Status */}
          <Section
            className={cn(
              "bg-base-100 border border-base-300",
              borderRadius.xl
            )}
          >
            <Section.Header
              icon={<CheckCircle2 size={18} />}
              title="Task Status"
              subtitle="Today's plan execution"
              size="sm"
            />

            <Section.Body className="px-2.5 py-2.5">
              {planTasks.length === 0 ? (
                <EmptyState
                  title="No tasks"
                  subtitle="No plan submitted"
                  variant="empty"
                  size="sm"
                />
              ) : (
                <div className={cn("flex flex-col", gaps.sm)}>
                  {planTasks.map((task) => {
                    const { label, badgeVariant, isCompleted } =
                      getTaskStatusMeta(task.status);

                    return (
                      <div key={task.text} className="flex items-center gap-2">
                        <div
                          className={cn(
                            "mt-0.5",
                            isCompleted
                              ? "text-success"
                              : "dt-text-dim"
                          )}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </div>

                        <span
                          className={cn(
                            "text-sm flex-1",
                            isCompleted && "line-through dt-text-dim"
                          )}
                        >
                          {task.text}
                        </span>

                        <Badge label={label} variant={badgeVariant} size="sm" />
                      </div>
                    );
                  })}
                </div>
              )}
            </Section.Body>
          </Section>

          {/* Frameworks */}
          {frameworks.length > 0 && (
            <Section>
              <Section.Header
                icon={<LightbulbIcon size="sm" />}
                title="Frameworks Applied"
                subtitle="Methodologies you used"
                size="sm"
              >
                <Badge
                  label={frameworks.length.toString()}
                  variant="primary"
                  size="sm"
                />
              </Section.Header>

              <Section.Body className="px-2.5 py-2.5">
                <div className={cn("flex flex-wrap", gaps.sm)}>
                  {frameworks.map((fw: Framework, i: number) => (
                    <Badge key={i} label={fw.text} size="sm" />
                  ))}
                </div>
              </Section.Body>
            </Section>
          )}

          {/* Suggestions (Bottom Left) */}
          {suggestions.length > 0 && (
            <Section>
              <Section.Header
                icon={<Target size={18} />}
                title="Suggestions for Tomorrow"
                subtitle="Areas to focus on"
                size="sm"
              />

              <Section.Body className="px-2.5 py-2.5">
                <div className={cn("flex flex-col", gaps.sm)}>
                  {suggestions.map((suggestion: string, i: number) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-start gap-3 p-3 bg-info/10 border-l-4 border-info",
                        borderRadius.lg
                      )}
                    >
                      <span className="text-info font-bold text-sm mt-0.5">
                        {i + 1}.
                      </span>
                      <p className="text-sm text-base-content/80">
                        {suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              </Section.Body>
            </Section>
          )}

          {/* Attendance */}
          {logInLogout && (
            <Section>
              <Section.Header
                icon={<LogoutIcon size="sm" />}
                title="Attendance"
                subtitle="Login and logout time"
                size="sm"
              />

              <Section.Body className="px-2.5 py-2.5">
                <div className="grid grid-cols-2 gap-3">
                  {/* Login Card */}
                  <div
                    className={cn(
                      "flex flex-col gap-2 p-4 rounded-lg",
                      bgColors.success
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-success uppercase">
                        Login
                      </span>
                    </div>
                    <p className="text-sm font-medium text-base-content">
                      {formatDate(logInLogout.loginAt, "time")}
                    </p>
                    <p className="text-xs dt-text-muted">
                      {formatDate(logInLogout.loginAt, "date")}
                    </p>
                  </div>

                  {/* Logout Card */}
                  <div
                    className={cn(
                      "flex flex-col gap-2 p-4 rounded-lg",
                      bgColors.warning
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-error uppercase tracking-wide">
                        Logout
                      </span>
                    </div>
                    <p className="text-sm font-medium text-base-content">
                      {logInLogout.logoutAt
                        ? formatDate(logInLogout.logoutAt, "time")
                        : "Not logged out"}
                    </p>
                    {logInLogout.logoutAt && (
                      <p className="text-xs dt-text-muted">
                        {formatDate(logInLogout.logoutAt, "date")}
                      </p>
                    )}
                  </div>
                </div>
              </Section.Body>
            </Section>
          )}
        </div>

        {/* RIGHT COLUMN - 60% */}
        <div className="space-y-6">
          {/* Reflections */}
          <Section>
            <Section.Header
              icon={<Brain size={18} />}
              title="Daily Reflection"
              subtitle="Your thoughts and insights"
              size="sm"
            />

            <Section.Body className="px-2.5 py-2.5">
              <div className={cn("flex flex-col", gaps.md)}>
                {dailyReflection &&
                  Object.entries(dailyReflection).map(([key, data]) => {
                    const question = data?.question || key;
                    const reflectionText = getReflectionText(key);

                    return (
                      <div
                        key={key}
                        className="pb-4 border-b border-base-300 last:border-0 last:pb-0"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-sm text-base-content">
                            {question}
                          </h4>
                          {editingKey !== key && (
                            <Button
                              size="xs"
                              shape="square"
                              variant="ghost"
                              color="accent"
                              onClick={() => {
                                setEditingKey(key);
                                setEditValue(reflectionText);
                              }}
                              iconBefore={<EditIcon size="sm" />}
                            />
                          )}
                        </div>

                        {editingKey === key ? (
                          <div className={cn("flex flex-col", gaps.sm)}>
                            <textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className={cn(
                                "textarea w-full min-h-[50px]",
                                borderColors.accent,
                                `focus:${borderColors.primary}`,
                                borderRadius.md
                              )}
                              placeholder={`Share your ${question.toLowerCase()}...`}
                            />
                            <div className={cn("flex justify-end", gaps.sm)}>
                              <Button
                                size="sm"
                                color="primary"
                                onClick={() => {
                                  onUpdateReflection(key, editValue);
                                  setEditingKey(null);
                                }}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="soft"
                                color="secondary"
                                onClick={() => setEditingKey(null)}
                              >
                                Close
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p
                            className={cn(
                              "text-sm whitespace-pre-wrap leading-relaxed",
                              reflectionText
                                ? "text-base-content/80"
                                : "dt-text-dim italic"
                            )}
                          >
                            {reflectionText || "No entry yet"}
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </Section.Body>
          </Section>

          {/* Rubric Score */}
          {rubricScore && Object.keys(rubricScore).length > 0 && (
            <Section>
              <Section.Header
                icon={<TrendingUp size={18} />}
                title="Quality Score"
                subtitle="Reflection assessment"
                size="sm"
              >
                <Badge
                  label={`${rubricScore.total || 0}/20`}
                  variant={
                    rubricScore.total >= 16
                      ? "success"
                      : rubricScore.total >= 12
                      ? "primary"
                      : "warning"
                  }
                  size="sm"
                />
              </Section.Header>

              <Section.Body className="px-2.5 py-2.5">
                <div className="grid gap-4 grid-cols-4">
                  {(
                    Object.entries(rubricScore) as [keyof RubricScore, number][]
                  )
                    .filter(([key]) => key !== "total")
                    .map(([key, value]) => (
                      <IconBox
                        icon={
                          <>
                            <div className="text-2xl font-bold text-primary">
                              {value}
                            </div>
                            <div className="text-xs dt-text-muted capitalize mt-1">
                              {key}
                            </div>
                          </>
                        }
                        key={key}
                        className={cn(
                          "flex flex-col items-center justify-center bg-base-50 p-4",
                          borderRadius.lg,
                          bgColors.primary
                        )}
                      ></IconBox>
                    ))}
                </div>
              </Section.Body>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
