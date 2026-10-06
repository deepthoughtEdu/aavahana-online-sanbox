"use client";

import { useState } from "react";
import { useApi } from "@/lib/hooks/shared/use-api";
import { CascadeService } from "@/lib/services/aavahana/cascade.service";
import { isError } from "@/lib/api/client";
import { todayISO, formatDate, addTime } from "@/utils/shared/date.utils";
import type { BasketItem } from "@/types/mimamsaka/plan-cascade.types";

interface PlanNegotiationModalProps {
  isOpen:          boolean;
  onClose:         () => void;
  estimatedMins?:  number;
  currentAllocPct: number;
  projectedAllocPct: number;
}

export function PlanNegotiationModal({
  isOpen,
  onClose,
  estimatedMins,
  currentAllocPct,
  projectedAllocPct,
}: PlanNegotiationModalProps) {
  const today    = todayISO();
  const tomorrow = formatDate(addTime(today, 1, "day"), "YYYY-MM-DD");

  const [deferredIds, setDeferredIds] = useState<Set<string>>(new Set());
  const [deferring,   setDeferring]   = useState<string | null>(null);

  const { data: basket, isLoading } = useApi({
    queryKey: ["daily-basket-modal", today],
    queryFn:  () => CascadeService.getDailyBasket(today),
    enabled:  isOpen,
  });

  const pickedItems: BasketItem[] = basket?.picked ?? [];

  const handleDefer = async (item: BasketItem) => {
    setDeferring(item.id);
    const result = await CascadeService.updateBasketItem(item.id, {
      status:     "deferred",
      deferredTo: tomorrow,
    });
    if (!isError(result)) {
      setDeferredIds((prev) => new Set([...prev, item.id]));
    }
    setDeferring(null);
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg">
        {/* Header */}
        <div className="mb-4">
          <h3 className="font-extrabold text-base text-base-content">Plan Impact</h3>
          {estimatedMins != null && estimatedMins > 0 && (
            <p className="text-sm text-base-content/70 mt-1">
              ⏱ Est. ~{estimatedMins}min for this ticket · Your day: {currentAllocPct}% → {projectedAllocPct}%
            </p>
          )}
          <p className="text-xs text-neutral mt-2">
            Your plan is now over capacity. Defer lower-priority tasks to protect tomorrow&apos;s rhythm — or close and continue as-is.
          </p>
        </div>

        {/* Task list */}
        {isLoading ? (
          <div className="py-6 text-center text-sm text-neutral">Loading today&apos;s plan…</div>
        ) : pickedItems.length === 0 ? (
          <div className="py-6 text-center text-sm text-neutral">No tasks in today&apos;s plan to defer.</div>
        ) : (
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto mb-4">
            {pickedItems.map((item) => {
              const isDeferred  = deferredIds.has(item.id);
              const isDeferring = deferring === item.id;
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg border ${
                    isDeferred
                      ? "border-success/30 bg-success/5"
                      : "border-base-300 bg-base-100"
                  }`}
                >
                  <span className={`text-sm flex-1 min-w-0 truncate ${isDeferred ? "text-success line-through" : "text-base-content"}`}>
                    {item.label}
                  </span>
                  {isDeferred ? (
                    <span className="text-xs text-success font-semibold shrink-0">Deferred</span>
                  ) : (
                    <button
                      onClick={() => handleDefer(item)}
                      disabled={isDeferring}
                      className="btn btn-sm btn-ghost text-warning shrink-0"
                    >
                      {isDeferring ? "…" : "Defer"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="modal-action mt-0">
          <button className="btn btn-sm btn-ghost" onClick={onClose}>
            Continue as-is
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
