// components/daily-report/PastDateLockScreen.tsx
"use client";

import { Button } from "@/components/shared/Button";
import { Section } from "@/components/shared/Section";
import { IconBox } from "@/components/shared/IconBox";
import { LockIcon, CalendarIcon, InfoIcon } from "@/components/shared/icons";
import { cn } from "@/utils";
import {
  sizes,
  borderColors,
  textColors,
  bgColors,
} from "@/utils/shared/design.utils";
import { formatDate } from "@/utils/shared/date.utils";

interface PastDateLockScreenProps {
  date: string;
  onGoToToday?: () => void;
}

export function PastDateLockScreen({
  date,
  onGoToToday,
}: PastDateLockScreenProps) {
  const formattedDate = formatDate(date, "MMMM DD, YYYY");

  return (
    <div className="flex items-center justify-center h-[70vh]">
      <Section
        className={cn(
          "max-w-lg w-full mx-auto bg-base-100 border",
          borderColors.ghost,
          sizes.xl.rounded
        )}
      >
        <Section.Header
          icon={
            <LockIcon size="md" className="text-warning" color="secondary" />
          }
          title="Submission Window Closed"
          subtitle={`Report for ${formattedDate}`}
          size="md"
        />

        <Section.Body className="text-center space-y-6">
          {/* Lock Icon Visual using IconBox */}
          <div className="flex justify-center">
            <IconBox
              icon={<LockIcon size="lg" />}
              color="primary"
              size="lg"
              shape="rounded"
            />
          </div>

          {/* Main Message */}
          <div className="space-y-3">
            <p className={cn(sizes.md.text, textColors.primary)}>
              The daily report for{" "}
              <span className="font-semibold">{formattedDate}</span> can no
              longer be submitted.
            </p>

            <p className={cn(sizes.sm.text, textColors.secondary)}>
              Reports must be submitted on the same day. This helps maintain
              daily reflection habits and prevents retrospective bias.
            </p>
          </div>

          {/* Action Button */}

          <Button
            color="primary"
            size="md"
            onClick={onGoToToday}
            iconBefore={<CalendarIcon size="sm" />}
          >
            Go to Today&apos;s Report
          </Button>

          {/* Info Box */}
          <div
            className={cn(
              "p-4 border border-info/30 text-left",
              bgColors.info,
              sizes.lg.rounded
            )}
          >
            <div className="flex items-start gap-3">
              <InfoIcon size="sm" className="text-info flex-shrink-0" />
              <p className={cn(sizes.xs.text, textColors.secondary)}>
                <span className="font-semibold text-base-content">Tip:</span>{" "}
                Set a daily reminder to submit your report before the day ends!
              </p>
            </div>
          </div>
        </Section.Body>
      </Section>
    </div>
  );
}
