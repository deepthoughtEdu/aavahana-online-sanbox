"use client";

import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { Section } from "@/components/shared/Section";
import { UndoIcon, PlusIcon } from "@/components/shared/icons";
import type { DailyTask } from "@/types";
import { cn } from "@/utils";
import { sizes } from "@/utils/shared/design.utils";

interface ContextPanelsProps {
  yesterdayCarryovers: DailyTask[];
  onAddCarryover: (task: DailyTask) => void;
}

export function ContextPanels({ yesterdayCarryovers, onAddCarryover }: ContextPanelsProps) {
  if (yesterdayCarryovers.length === 0) return null;

  return (
    <Section>
      <Section.Header
        icon={<UndoIcon size="sm" />}
        title="Yesterday's Incomplete"
        size="sm"
      >
        <Badge variant="ghost" size="sm">{yesterdayCarryovers.length}</Badge>
      </Section.Header>
      <Section.Body>
        <div className="space-y-2">
          {yesterdayCarryovers.map((task, index) => (
            <div
              key={`carry-${index}`}
              className={cn(
                "flex items-center justify-between gap-3",
                "border border-base-300 hover:border-primary/30",
                sizes.sm.padding,
                sizes.lg.rounded,
                "transition-all duration-200",
              )}
            >
              <p className={cn("flex-1 min-w-0", sizes.sm.text)}>{task.text}</p>
              <Button
                id={index === 0 ? "tour-carryover-add-btn" : undefined}
                size="sm"
                variant="soft"
                color="primary"
                onClick={() => onAddCarryover(task)}
                iconBefore={<PlusIcon size="sm" />}
              >
                Add
              </Button>
            </div>
          ))}
        </div>
      </Section.Body>
    </Section>
  );
}
