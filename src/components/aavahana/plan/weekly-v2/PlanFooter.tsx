"use client";

import { Button } from "@/components/shared/Button";
import { CheckCircleIcon } from "@/components/shared/icons";

interface Props {
  chipCount: number;
  totalEstimateMins: number;
  dependencyTitle: string | null;
  canSubmit: boolean;
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
}

export function PlanFooter({
  chipCount,
  totalEstimateMins,
  dependencyTitle,
  canSubmit,
  isSubmitting,
  onSubmit,
}: Props) {
  const totalHrs =
    totalEstimateMins > 0 ? (totalEstimateMins / 60).toFixed(1) : null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-base-300 z-30">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
            <span className="font-semibold text-black">
              {chipCount}{" "}
              <span className="font-normal text-neutral">
                {chipCount === 1 ? "item" : "items"}
              </span>
            </span>
            {totalHrs && (
              <span className="text-neutral">~{totalHrs}h planned</span>
            )}
            {dependencyTitle && (
              <span className="text-neutral truncate hidden md:inline">
                dep:&nbsp;
                <span className="text-black font-medium">{dependencyTitle}</span>
              </span>
            )}
          </div>
        </div>
        <Button
          color="primary"
          size="md"
          loading={isSubmitting}
          disabled={!canSubmit}
          onClick={onSubmit}
          iconAfter={!isSubmitting ? <CheckCircleIcon size="sm" /> : undefined}
        >
          {isSubmitting ? "Filing…" : "File the week"}
        </Button>
      </div>
    </div>
  );
}
