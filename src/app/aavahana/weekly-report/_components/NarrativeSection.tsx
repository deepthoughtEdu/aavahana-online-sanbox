import { Badge } from '@/components/shared/Badge';

interface NarrativeSectionProps {
  narrative: string;
}

export function NarrativeSection({ narrative }: NarrativeSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-base-content">AI Narrative</span>
        <Badge variant="primary" size="sm" icon={null} label="synthesized" />
      </div>
      <p className="text-sm leading-relaxed text-neutral">{narrative}</p>
    </div>
  );
}
