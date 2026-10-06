'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TimesheetTable } from './TimesheetTable';
import { computeTimeAllocation } from './analytics.utils';
import type { TimesheetEntry, FilterPeriod } from './analytics.utils';
import type { WeekInfo } from '@/types/aavahana/weekly-plan.types';

interface TimesheetTabProps {
  entries: TimesheetEntry[];
  currentWeek: WeekInfo | null;
  filterPeriod: FilterPeriod;
  onPeriodChange: (p: FilterPeriod) => void;
}

const PERIODS: { key: FilterPeriod; label: string }[] = [
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'custom', label: 'All' },
];

export function TimesheetTab({
  entries,
  currentWeek,
  filterPeriod,
  onPeriodChange,
}: TimesheetTabProps) {
  const filtered = useMemo(
    () => computeTimeAllocation(entries, filterPeriod),
    [entries, filterPeriod]
  );

  // Filter entries to match period
  const filteredEntries = useMemo(() => {
    const now = new Date();
    return entries.filter((entry) => {
      const d = new Date(entry.date);
      if (filterPeriod === 'week') {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return d >= weekStart;
      }
      if (filterPeriod === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return d >= monthStart;
      }
      return true;
    });
  }, [entries, filterPeriod]);

  const totalHours = filtered.total;

  return (
    <motion.div
      key="timesheet"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col gap-3"
    >
      {/* Filter pills + total */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onPeriodChange(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterPeriod === key
                  ? 'bg-primary text-primary-content'
                  : 'bg-base-200 dt-text-muted hover:bg-base-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-xs dt-text-dim font-medium">
          {filteredEntries.length} entries · {totalHours}h total
        </span>
      </div>

      {/* Simple day-grouped list */}
      <TimesheetTable entries={filteredEntries} currentWeek={currentWeek} />
    </motion.div>
  );
}
