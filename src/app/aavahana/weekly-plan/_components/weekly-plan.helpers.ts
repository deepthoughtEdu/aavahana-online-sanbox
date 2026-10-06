import {
  Trophy,
  Shield,
  Target,
} from 'lucide-react';
import {
  ListCheckIcon,
  FileTextIcon,
  BookIcon,
} from '@/components/shared/icons';
import { formatDate } from '@/utils/shared/date.utils';
import type { Deliverable, Result, ProjectCharter, Workflow, Risk, LearningItem } from '@/types/aavahana/weekly-plan.types';
import type { IconSize } from '@/utils/shared/design.utils';
import type { ComponentType } from 'react';

/** Format a date range as a compact human-readable string. */
export const formatDateRange = (startDate: string, endDate: string): string => {
  const startMonth = formatDate(startDate, "MMM");
  const endMonth = formatDate(endDate, "MMM");

  if (startMonth === endMonth) {
    return `${startMonth} ${formatDate(startDate, "D")}-${formatDate(endDate, "D")}, ${formatDate(endDate, "YYYY")}`;
  }
  return `${startMonth} ${formatDate(startDate, "D")} - ${endMonth} ${formatDate(endDate, "D")}, ${formatDate(endDate, "YYYY")}`;
};

export interface SectionDefinition {
  id: string;
  icon: ComponentType<{ className?: string; size?: IconSize }>;
  color: string;
  tabColor: string;
  label: string;
  question: string;
  teaser: string;
}

/** Build the ordered list of plan sections from current data. */
export function buildSections(
  deliverables: Deliverable[],
  results: Result[],
  projectCharters: ProjectCharter[],
  workflows: Workflow[],
  risks: Risk[],
  learning: LearningItem[],
): SectionDefinition[] {
  const getDeliverableTeaser = () => {
    const pending = deliverables.filter(d => d.status !== 'completed').length;
    const critical = deliverables.filter(d => d.priority === 'critical').length;
    if (critical > 0) return `${critical} critical`;
    if (pending > 0) return `${pending} to ship`;
    return 'All done \u2713';
  };

  const getResultsTeaser = () => `${results.length} metrics`;

  const getContextTeaser = () => {
    const active = projectCharters.filter(p => p.status === 'active');
    return `${active.length} active`;
  };

  const getRisksTeaser = () => {
    const high = risks.filter(r => r.probability === 'high' || r.impact === 'high').length;
    if (high > 0) return `${high} high`;
    return `${risks.length} tracked`;
  };

  const getLearningTeaser = () => `${learning.length} goals`;

  return [
    {
      id: 'deliverables',
      icon: ListCheckIcon,
      color: 'bg-primary/10 text-primary border-primary',
      tabColor: 'primary',
      label: 'Deliverables',
      question: 'What will exist at the end of this week that doesn\'t exist now?',
      teaser: getDeliverableTeaser(),
    },
    {
      id: 'results',
      icon: Trophy,
      color: 'bg-warning/10 text-warning border-warning',
      tabColor: 'warning',
      label: 'Success',
      question: 'How will you know you succeeded?',
      teaser: getResultsTeaser(),
    },
    {
      id: 'context',
      icon: Target,
      color: 'bg-accent/10 text-accent border-accent',
      tabColor: 'accent',
      label: 'The Why',
      question: 'What larger goal does this serve?',
      teaser: getContextTeaser(),
    },
    {
      id: 'workflows',
      icon: FileTextIcon,
      color: 'bg-base-300 text-neutral border-black/30',
      tabColor: 'neutral',
      label: 'Process',
      question: 'What systems will help you execute?',
      teaser: `${workflows.length} mapped`,
    },
    {
      id: 'risks',
      icon: Shield,
      color: 'bg-error/10 text-error border-error',
      tabColor: 'error',
      label: 'Risks',
      question: 'What could derail you? How will you respond?',
      teaser: getRisksTeaser(),
    },
    {
      id: 'learning',
      icon: BookIcon,
      color: 'bg-success/10 text-success border-success',
      tabColor: 'success',
      label: 'Growth',
      question: 'What will you learn? Who will you become?',
      teaser: getLearningTeaser(),
    },
  ];
}
