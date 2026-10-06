// components/daily-report/NudgeAlert.tsx
"use client";

import { SparklesIcon, LightbulbIcon } from "@/components/shared/icons";
import { cn } from "@/utils";
import { borderRadius, spacing, gaps } from "@/utils/shared/design.utils";

interface NudgeAlertProps {
  messages: string[];
}

export function NudgeAlert({ messages }: NudgeAlertProps) {
  if (!messages || messages.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "mb-6 bg-gradient-to-br from-info/5 via-primary/3 to-info/5",
        "border border-info/30",
        borderRadius.xl,
        spacing.lg,
        "shadow-sm"
      )}
    >
      {/* Header */}
      <div className={cn("flex items-start", gaps.md, "mb-4")}>
        <div
          className={cn(
            "p-2",
            "bg-gradient-to-br from-info/20 to-primary/20",
            "rounded-lg flex-shrink-0"
          )}
        >
          <SparklesIcon size="md" className="text-info" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-base-content">
            AI Suggestions
          </h3>
          <p className="text-xs text-info/70 mt-0.5">
            A few more details would make your reflection even better
          </p>
        </div>
      </div>

      {/* Messages */}
      <ul className="space-y-2.5">
        {messages.map((message, index) => (
          <li
            key={index}
            className={cn(
              "flex items-start",
              gaps.sm,
              "p-3 bg-base-100/60 backdrop-blur-sm",
              "border border-info/20",
              borderRadius.lg,
              "hover:bg-base-100/80 transition-colors"
            )}
          >
            <LightbulbIcon
              size="sm"
              className="flex-shrink-0 mt-0.5 text-info"
            />
            <span className="text-sm text-base-content leading-relaxed">
              {message}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
