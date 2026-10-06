'use client';

import { motion } from 'framer-motion';
import { ClockIcon, ChartLineIcon } from '@/components/shared/icons';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/utils';
import type { TimesheetEntry, FilterPeriod } from './analytics.utils';

interface TimesheetSummaryCardsProps {
  timeAllocationTotal: number;
  entries: TimesheetEntry[];
  filterPeriod: FilterPeriod;
}

function getFilteredCount(entries: TimesheetEntry[], period: FilterPeriod): number {
  const today = new Date();
  return entries.filter((entry) => {
    const d = new Date(entry.date);
    if (period === 'week') {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      return d >= weekStart;
    }
    if (period === 'month') {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return d >= monthStart;
    }
    return true;
  }).length;
}

export function TimesheetSummaryCards({
  timeAllocationTotal,
  entries,
  filterPeriod,
}: TimesheetSummaryCardsProps) {
  const entryCount = getFilteredCount(entries, filterPeriod);
  const dailyAvg = timeAllocationTotal > 0 ? (timeAllocationTotal / 7).toFixed(1) : '0.0';

  const cards = [
    {
      icon: <ClockIcon size="sm" className="text-primary" />,
      bg: 'bg-primary/10',
      value: `${timeAllocationTotal}h`,
      label: 'Total Hours',
      delay: 0.05,
    },
    {
      icon: <TrendingUp className="w-4 h-4 text-success" />,
      bg: 'bg-success/10',
      value: String(entryCount),
      label: 'Entries',
      delay: 0.1,
    },
    {
      icon: <ChartLineIcon size="sm" className="text-warning" />,
      bg: 'bg-warning/10',
      value: `${dailyAvg}h`,
      label: 'Daily Avg',
      delay: 0.15,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      {cards.map(({ icon, bg, value, label, delay }) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay }}
          className={cn('bg-base-100 rounded border border-base-300 px-3 py-2')}
        >
          <div className="flex items-center gap-2">
            <div className={cn('w-7 h-7 rounded-full flex items-center justify-center', bg)}>
              {icon}
            </div>
            <div>
              <p className="text-base font-bold leading-tight">{value}</p>
              <p className="text-xs dt-text-muted leading-none">{label}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
