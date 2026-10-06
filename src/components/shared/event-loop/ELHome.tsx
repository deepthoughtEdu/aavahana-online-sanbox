/**
 * ELHome.tsx — Event Loop Status tab
 *
 * Norman redesign (visual hierarchy matches MicroMap):
 *   Mapping    — Action Queue promoted to top (highest-priority item first).
 *   Visibility — Navy section headers make each section instantly scannable.
 *   Consistency — Section headers use the same navy/white vocabulary as MicroMap.
 *   Feedback   — RAG signal shown as coloured pill, not buried in a table cell.
 */

import React from "react";
import { ActionQueue }          from "./_components/ActionQueue";
import { SprintHealthPanel }    from "./_components/SprintHealthPanel";
import { PersonalHealthStrip }  from "./_components/PersonalHealthStrip";
import type { EventLoopData }   from "@/types/shared/event-loop.types";

interface ELHomeProps {
  data:             EventLoopData;
  onQueueItemClick: (ticketId: string) => void;
}

export function ELHome({ data, onQueueItemClick }: ELHomeProps) {
  const { personalHealth, sprintHealth, actionQueue, sprintLabel } = data;

  return (
    <div>
      <ActionQueue items={actionQueue} onSelect={onQueueItemClick} />
      <div className="grid grid-cols-2 gap-4">
        <SprintHealthPanel
          sprintLabel={sprintLabel}
          dayBreakdown={sprintHealth.dayBreakdown}
          ownerBreakdown={sprintHealth.ownerBreakdown}
        />
        <PersonalHealthStrip {...personalHealth} />
      </div>
    </div>
  );
}
