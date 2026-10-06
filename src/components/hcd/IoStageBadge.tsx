import { Badge } from "@/components/shared/Badge";
import { STAGE_BADGE, type IoStage } from "@/components/hcd/lifecycle";

// Single source of stage vocabulary + colour (HG1). Every IO stage renders here.
export function IoStageBadge({ stage }: { stage: IoStage | string }) {
  const s =
    STAGE_BADGE[stage as IoStage] ?? { label: stage, variant: "neutral" as const };
  return (
    <Badge variant={s.variant} icon={null} size="sm">
      {s.label}
    </Badge>
  );
}
