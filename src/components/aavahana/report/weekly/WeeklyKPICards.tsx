"use client";

import { WeeklyKPIs } from "@/types";
import {
  CheckIcon,
  ClockIcon,
  AlertCircleIcon,
  LightbulbIcon,
  PlusIcon,
} from "@/components/shared/icons";

interface WeeklyKPICardsProps {
  kpis: WeeklyKPIs;
}

export function WeeklyKPICards({ kpis }: WeeklyKPICardsProps) {
  const cards = [
    {
      label: "Completed",
      value: kpis.completed,
      color: "bg-success/10 border-success/20",
      textColor: "text-success-content",
      icon: <CheckIcon size="lg" className="text-success" />,
    },
    {
      label: "Planned",
      value: kpis.planned,
      color: "bg-info/10 border-info/20",
      textColor: "text-info-content",
      icon: <ClockIcon size="lg" className="text-info" />,
    },
    {
      label: "Backlog",
      value: kpis.backlog,
      color: "bg-error/10 border-error/20",
      textColor: "text-error-content",
      icon: <AlertCircleIcon size="lg" className="text-error" />,
    },
    {
      label: "In-Progress",
      value: kpis.inProgress,
      color: "bg-warning/10 border-warning/20",
      textColor: "text-warning-content",
      icon: <PlusIcon size="lg" className="text-warning" />,
    },
    {
      label: "Frameworks Implemented",
      value: kpis.frameworksImplemented,
      color: "bg-accent/10 border-accent/20",
      textColor: "text-accent-content",
      icon: <PlusIcon size="lg" className="text-accent" />,
    },
    {
      label: "IP Contributions",
      value: kpis.ipContributions,
      color: "bg-primary/10 border-primary/20",
      textColor: "text-primary-content",
      icon: <LightbulbIcon size="lg" className="text-primary" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-lg p-4 border ${card.color}`}>
          <div className="flex items-start justify-between mb-2">
            <div className={`text-4xl font-bold ${card.textColor}`}>
              {card.value}
            </div>
            {card.icon}
          </div>
          <div className="text-sm font-medium dt-text-muted">
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}
