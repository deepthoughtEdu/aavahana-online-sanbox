'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClockIcon } from '@/components/shared/icons';
import { Button } from '@/components/shared/Button';
import type { CalendarEvent } from '@/types/aavahana/weekly-plan.types';

interface MeetingSkipCardProps {
  meetings: CalendarEvent[];
  onSkip: (id: string) => void;
}

export function MeetingSkipCard({ meetings, onSkip }: MeetingSkipCardProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = meetings.filter((m) => !dismissed.has(m.id));
  if (visible.length === 0) return null;

  const meeting = visible[0];

  const handleSkip = () => {
    onSkip(meeting.id);
    setDismissed((s) => new Set(s).add(meeting.id));
  };

  const handleKeep = () => {
    setDismissed((s) => new Set(s).add(meeting.id));
  };

  return (
    <AnimatePresence>
      <motion.div
        key={meeting.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="mx-4 sm:mx-6 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 flex items-start gap-3"
      >
        {/* Icon */}
        <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
          <ClockIcon size="sm" className="text-accent" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-accent">
            A meeting you could skip
          </p>
          <p className="text-sm font-medium truncate mt-0.5">{meeting.title}</p>
          <p className="text-xs text-neutral mt-0.5">
            {meeting.startTime}–{meeting.endTime} · Skipping reclaims{' '}
            <span className="font-semibold text-accent">
              {Math.round(
                ((parseInt(meeting.endTime) || 0) - (parseInt(meeting.startTime) || 0)) * 60
              ) || 60} min
            </span>{' '}
            for deep work
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <Button
            color="primary"
            size="sm"
            onClick={handleSkip}
            className="bg-accent hover:bg-accent border-accent/40 text-white text-xs"
          >
            Skip it
          </Button>
          <Button variant="ghost" size="sm" onClick={handleKeep} className="text-xs">
            Keep
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
