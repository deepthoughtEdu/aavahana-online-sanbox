// components/daily-report/FrameworksSection.tsx
"use client";

import {
  SparklesIcon,
  LightbulbIcon,
  EditIcon,
  PlusIcon,
} from "@/components/shared/icons";
import { Section } from "@/components/shared/Section";
import { Badge } from "@/components/shared/Badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/shared/Button";
import { cn } from "@/utils";
import { borderRadius, gaps } from "@/utils/shared/design.utils";
import { logger } from "@/lib/managers/logger";

interface FrameworksSectionProps {
  frameworks: string[];
  activeFrameworks: string[];
  onFrameworkSelect: (framework: string) => void;
}

export function FrameworksSection({
  frameworks,
  activeFrameworks,
  onFrameworkSelect,
}: FrameworksSectionProps) {
  const activeList = frameworks.filter((fw) => activeFrameworks.includes(fw));
  logger.log("active list", activeList);
  const inactiveList = frameworks.filter(
    (fw) => !activeFrameworks.includes(fw)
  );

  return (
    <Section className={cn("bg-base-100", borderRadius.xl)}>
      <Section.Header
        icon={<LightbulbIcon size="sm" />}
        title="Frameworks"
        subtitle="Share your frameworks that you used"
        size="sm"
      >
        {activeList.length > 0 && (
          <Badge
            label={activeList.length.toString()}
            icon={<SparklesIcon size="xs" />}
            variant="primary"
            size="lg"
          />
        )}
      </Section.Header>

      <Section.Body className="px-2.5 py-2.5" noPadding={{ x: true, y: true }}>
        {/* Active Frameworks */}
        {activeList.length > 0 && (
          <div className={cn("flex flex-wrap", gaps.sm)}>
            {activeList.map((fw) => (
              <Button
                className="text-xs"
                key={fw}
                onClick={() => onFrameworkSelect(fw)}
                variant="soft"
                color="primary"
                iconAfter={<EditIcon size="sm" />}
              >
                {fw}
              </Button>
            ))}
          </div>
        )}

        {/* Divider */}
        {activeList.length > 0 && inactiveList.length > 0 && (
          <div className="border-t border-base-200 my-4" />
        )}

        {/* Available Frameworks */}
        {inactiveList.length > 0 && (
          <div className={cn("flex flex-wrap", gaps.sm)}>
            {inactiveList.map((fw) => (
              <Button
                className="text-xs"
                key={fw}
                onClick={() => onFrameworkSelect(fw)}
                variant="soft"
                color="secondary"
                iconBefore={<PlusIcon size="sm" />}
              >
                {fw}
              </Button>
            ))}
          </div>
        )}

        {/* Empty State */}
        {activeList.length === 0 && inactiveList.length === 0 && (
          <EmptyState
            title="No frameworks found"
            subtitle={null}
            icon={<LightbulbIcon size="md" />}
            variant="empty"
            size="sm"
          />
        )}
      </Section.Body>
    </Section>
  );
}
