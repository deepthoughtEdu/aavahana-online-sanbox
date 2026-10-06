/**
 * ELSignal.tsx — Event Loop Tab 3: Signal
 *
 * Read-only understanding surface. No actions anywhere.
 * Norman principle — Constraints: the absence of buttons is deliberate.
 */

import React from "react";
import { DaySignalRows }    from "./_components/DaySignalRows";
import { OwnerHealthTable } from "./_components/OwnerHealthTable";
import type { EventLoopData } from "@/types/shared/event-loop.types";

interface ELSignalProps {
  sprintLabel:    string;
  currentDay:     string;
  dayBreakdown:   EventLoopData["sprintHealth"]["dayBreakdown"];
  ownerBreakdown: EventLoopData["sprintHealth"]["ownerBreakdown"];
}

export function ELSignal({ sprintLabel, currentDay, dayBreakdown, ownerBreakdown }: ELSignalProps) {
  return (
    <div className="max-w-[680px]">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="text-[9px] font-bold tracking-[0.16em] uppercase text-neutral">
            Signal
          </div>
          <div className="text-xs text-neutral mt-0.5">
            Read only · Understand here, act in Tickets tab
          </div>
        </div>
        <span className="text-[9px] font-bold tracking-[0.1em] uppercase text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded">
          {sprintLabel} · {currentDay}
        </span>
      </div>

      <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden mb-5">
        <div className="px-4 py-2.5 border-b border-base-300 text-[9px] font-bold tracking-[0.14em] uppercase text-neutral">
          Day Breakdown
        </div>
        <DaySignalRows dayBreakdown={dayBreakdown} currentDay={currentDay} />
      </div>

      <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-base-300 text-[9px] font-bold tracking-[0.14em] uppercase text-neutral">
          Owner Health
        </div>
        <OwnerHealthTable ownerBreakdown={ownerBreakdown} />
      </div>
    </div>
  );
}
