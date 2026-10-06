"use client";

import { useState } from "react";
import { Button } from "@/components/shared/Button";
import {
  LightbulbIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon,
  ArrowRightIcon,
} from "@/components/shared/icons";
import { cn } from "@/utils";
import type { WeeklyV2LastWeekItem } from "@/types/aavahana/weekly-plan-v2.types";

interface Props {
  recurringBlocker: string | null;
  lastWeekItems: WeeklyV2LastWeekItem[];
  reflection: string;
  setReflection: (text: string) => void;
}

const MAX_REFLECTION_CHARS = 240;

export function BlockerBanner({
  recurringBlocker,
  lastWeekItems,
  reflection,
  setReflection,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!recurringBlocker && lastWeekItems.length === 0) return null;

  const deliveredCount = lastWeekItems.filter(
    (i) => i.status === "delivered"
  ).length;
  const carriedCount = lastWeekItems.length - deliveredCount;

  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-warning/10 transition-colors"
        aria-expanded={expanded}
      >
        <span className="text-warning shrink-0">
          <LightbulbIcon size="sm" />
        </span>
        <p className="flex-1 text-sm text-black leading-snug">
          {recurringBlocker ?? "Last week's recap is ready."}
        </p>
        <span className="text-xs text-neutral hidden sm:inline">
          {expanded ? "Hide" : "Reflect on this"}
        </span>
        <span className="text-neutral">
          {expanded ? (
            <ChevronUpIcon size="sm" />
          ) : (
            <ChevronDownIcon size="sm" />
          )}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-warning/20 space-y-4">
          {lastWeekItems.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral mb-2">
                Last week · {deliveredCount} done · {carriedCount} carried
              </p>
              <ul className="space-y-1">
                {lastWeekItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span
                      className={cn(
                        "inline-flex items-center justify-center w-4 h-4 rounded-full shrink-0",
                        item.status === "delivered"
                          ? "bg-success/15 text-success"
                          : "bg-warning/15 text-warning"
                      )}
                    >
                      {item.status === "delivered" ? (
                        <CheckIcon size="xs" />
                      ) : (
                        <ArrowRightIcon size="xs" />
                      )}
                    </span>
                    <span
                      className={cn(
                        "leading-snug",
                        item.status === "delivered"
                          ? "text-neutral line-through"
                          : "text-black"
                      )}
                    >
                      {item.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <label
              htmlFor="weekly-v2-reflection"
              className="block text-sm font-medium text-black mb-1"
            >
              What did last week teach you that should change how you plan this one?
            </label>
            <p className="text-xs text-neutral mb-2">
              Optional · {reflection.length} / {MAX_REFLECTION_CHARS}
            </p>
            <textarea
              id="weekly-v2-reflection"
              value={reflection}
              onChange={(e) =>
                setReflection(e.target.value.slice(0, MAX_REFLECTION_CHARS))
              }
              placeholder="A specific pattern — names, beats, numbers."
              className="textarea textarea-bordered w-full text-sm"
              rows={2}
            />
          </div>

          <div className="flex justify-end">
            <Button
              color="neutral"
              variant="ghost"
              size="xs"
              onClick={() => setExpanded(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
