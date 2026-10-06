"use client";

import { SectionA } from "@/components/aavahana/report/daily/v5/SectionA";
import { useSectionA } from "@/lib/hooks/aavahana/use-section-a";
import { formatDate, startOf } from "@/utils/shared/date.utils";

export default function TestSectionAPage() {
  const today = formatDate(startOf(new Date(), "day"), "yyyy-MM-dd");
  const sectionA = useSectionA(today);

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-4 text-lg font-bold">Section A Test</h1>
      <SectionA
        plannedItems={sectionA.plannedItems}
        unplannedWork={sectionA.unplannedWork}
        phase={sectionA.phase}
        gap={sectionA.gap}
        timeSummary={sectionA.timeSummary}
        isLoading={sectionA.isLoading}
        onCycleStatus={sectionA.cycleStatus}
        onAdjustTime={sectionA.adjustTime}
        onAddUnplanned={sectionA.addUnplannedItem}
        onRemoveUnplanned={sectionA.removeUnplannedItem}
        onAdjustUnplannedTime={sectionA.adjustUnplannedTime}
        onUpdateSourceTag={sectionA.updateUnplannedSourceTag}
        onProceedToSectionB={() => {
          // Simulate Section B returning unplanned items WITH time
          sectionA.receiveUnplannedWork([
            { description: "Helped Ravi debug CSS", sourceTag: "helping_others", minutesTaken: 90 },
            { description: "Found payment bug", sourceTag: "opportunity", minutesTaken: 30 },
          ]);
        }}
      />
    </div>
  );
}
