"use client";

import { Section } from "@/components/shared/Section";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { PlusIcon, ListCheckIcon } from "@/components/shared/icons";
import type { BasketItem } from "@/types/mimamsaka/plan-cascade.types";
import { cn } from "@/utils";
import { sizes } from "@/utils/shared/design.utils";

interface BasketPickerProps {
  weeklyItems: BasketItem[];
  eventLoopItems: BasketItem[];
  onPick: (item: BasketItem) => void;
}

function BasketItemRow({ item, onPick, isFirst }: { item: BasketItem; onPick: (item: BasketItem) => void; isFirst?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3",
        "border border-base-300 hover:border-primary/30",
        sizes.sm.padding,
        sizes.lg.rounded,
        "transition-all duration-200",
      )}
    >
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium", sizes.sm.text)}>{item.label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {item.quantity > 0 && (
            <span className="text-xs dt-text-muted">~{item.quantity} min</span>
          )}
          {item.programId && (
            <span className="text-xs dt-text-dim">{item.programId}</span>
          )}
        </div>
      </div>
      <Button
        id={isFirst ? "tour-basket-pick-btn" : undefined}
        size="sm"
        variant="soft"
        color="primary"
        onClick={() => onPick(item)}
        iconBefore={<PlusIcon size="sm" />}
      >
        Pick
      </Button>
    </div>
  );
}

export function BasketPicker({ weeklyItems, eventLoopItems, onPick }: BasketPickerProps) {
  const hasItems = weeklyItems.length > 0 || eventLoopItems.length > 0;

  if (!hasItems) return null;

  return (
    <Section>
      <Section.Header
        icon={<ListCheckIcon size="sm" />}
        title="Pick Into Today"
        size="sm"
      />
      <Section.Body>
        <div className="space-y-4">
          {weeklyItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider dt-text-dim">
                  From Weekly Plan
                </h4>
                <Badge variant="ghost" size="sm">
                  {weeklyItems.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {weeklyItems.map((item, idx) => (
                  <BasketItemRow key={item.id} item={item} onPick={onPick} isFirst={idx === 0} />
                ))}
              </div>
            </div>
          )}

          {eventLoopItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider dt-text-dim">
                  From Event Loop
                </h4>
                <Badge variant="ghost" size="sm">
                  {eventLoopItems.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {eventLoopItems.map((item) => (
                  <BasketItemRow key={item.id} item={item} onPick={onPick} />
                ))}
              </div>
            </div>
          )}
        </div>
      </Section.Body>
    </Section>
  );
}
