'use client';

/**
 * HighPriorityEventNudge
 *
 * Reusable nudge component that encourages users to protect their non-negotiable
 * growth events (L&D sessions, strategic reviews, 1:1s, wellness blocks) by
 * adding them to the timetable before the week fills up.
 *
 * Used in:
 *   - /weekly-plan/timetable  (prominent top section)
 *   - /weekly-plan/input      (post-plan submission)
 *   - /weekly-plan/report     (reflection + next-week prep)
 *   - /plan/weekly            (plan overview)
 *   - /plan/daily             (daily planning)
 *
 * Design intent: the top 1% protect their calendar before reactive work colonises it.
 */

import React, { useState, type Dispatch, type SetStateAction } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils';
import { Button } from '@/components/shared/Button';
import { WeeklyPlanService } from '@/lib/services/aavahana/weekly-plan.service';
import { isError } from '@/lib/api/client';
import { formatDate, addTime } from '@/utils/shared/date.utils';
import type { HighPriorityEvent, HighPriorityCategory } from '@/types/aavahana/weekly-plan.types';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

interface FormState {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  category: HighPriorityCategory;
}

export interface HighPriorityEventNudgeProps {
  /** Which screen is embedding this component — sent to backend for analytics */
  sourceScreen: string;
  /** Called after event is successfully saved */
  onEventAdded?: (event: HighPriorityEvent) => void;
  /** Compact strip variant (for inline use). Default: false (card variant) */
  compact?: boolean;
  /** Override placeholder text / nudge headline */
  headline?: string;
  /** Override supporting copy */
  subtext?: string;
  className?: string;
}

// ------------------------------------------------------------------
// Category config
// ------------------------------------------------------------------

const CATEGORY_CONFIG: Record<
  HighPriorityCategory,
  { label: string; emoji: string; inputPlaceholder: string }
> = {
  learning: {
    label: 'Learning & Development',
    emoji: '📚',
    inputPlaceholder: 'e.g. System design deep-dive, AIP Lab Module 3…',
  },
  review: {
    label: 'Review / Feedback',
    emoji: '🔍',
    inputPlaceholder: 'e.g. Product demo with PM, code review session…',
  },
  wellness: {
    label: 'Wellness / Recharge',
    emoji: '🌿',
    inputPlaceholder: 'e.g. Midday walk, mindfulness break…',
  },
  strategic: {
    label: 'Strategic Thinking',
    emoji: '🧭',
    inputPlaceholder: 'e.g. Roadmap planning, OKR reflection…',
  },
  other: {
    label: 'Other high-priority',
    emoji: '⭐',
    inputPlaceholder: 'e.g. Mentor call, team offsite…',
  },
};

const NUDGE_VARIANTS = [
  {
    headline: 'Your calendar is your strategy.',
    subtext: 'Block what matters before the urgent crowds it out.',
  },
  {
    headline: 'Protect your growth slots — now.',
    subtext:
      'Every unblocked hour is an open invitation for someone else\'s priority.',
  },
  {
    headline: 'High performers schedule their growth first.',
    subtext: 'Add a non-negotiable before you plan the rest of your week.',
  },
  {
    headline: 'A meeting you skip vs. one you never planned.',
    subtext: 'The best L&D sessions are the ones that survive the week.',
  },
];

// Pick a stable random variant seeded to today's date
function getTodayVariant() {
  const today = new Date();
  return NUDGE_VARIANTS[today.getDate() % NUDGE_VARIANTS.length];
}

// ------------------------------------------------------------------
// Default form values
// ------------------------------------------------------------------

function getTomorrowDate(): string {
  return formatDate(addTime(new Date(), 1, "day"), "date");
}

const DEFAULT_FORM: FormState = {
  title: '',
  date: getTomorrowDate(),
  startTime: '09:00',
  endTime: '10:00',
  category: 'learning',
};

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------

export function HighPriorityEventNudge({
  sourceScreen,
  onEventAdded,
  compact = false,
  headline,
  subtext,
  className,
}: HighPriorityEventNudgeProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const variant = getTodayVariant();
  const nudgeHeadline = headline ?? variant.headline;
  const nudgeSubtext = subtext ?? variant.subtext;
  const catConfig = CATEGORY_CONFIG[form.category as HighPriorityCategory];

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const result = await WeeklyPlanService.createCalendarEvent({
      title: form.title.trim(),
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      type: 'high-priority',
      isHighPriority: true,
      category: form.category,
      sourceScreen,
    } as Parameters<typeof WeeklyPlanService.createCalendarEvent>[0]);

    setSaving(false);

    if (!isError(result)) {
      setSaved(true);
      onEventAdded?.(result as unknown as HighPriorityEvent);
      setTimeout(() => {
        setSaved(false);
        setOpen(false);
        setForm({ ...DEFAULT_FORM, date: getTomorrowDate() });
      }, 1800);
    }
  };

  // ----------------------------------------------------------------
  // Compact strip variant
  // ----------------------------------------------------------------
  if (compact) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <motion.button
          onClick={() => setOpen((v: boolean) => !v)}
          whileTap={{ scale: 0.99 }}
          className={cn(
            'flex items-center gap-3 w-full rounded-xl px-4 py-3 text-left',
            'border border-warning/30 bg-warning/5 hover:bg-warning/10 transition-colors',
            'cursor-pointer'
          )}
        >
          <span className="text-xl select-none">⚡</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-black leading-tight">
              Got a high-priority event this week?
            </p>
            <p className="text-xs text-neutral mt-0.5 truncate">
              Tap to add it to your timetable before the week fills up.
            </p>
          </div>
          <span className="text-warning text-lg select-none">{open ? '↑' : '+'}</span>
        </motion.button>
        <AnimatePresence>
          {open && <EventForm form={form} setForm={setForm} saving={saving} saved={saved} onSave={handleSave} onCancel={() => setOpen(false)} catConfig={catConfig} />}
        </AnimatePresence>
      </div>
    );
  }

  // ----------------------------------------------------------------
  // Card variant (default)
  // ----------------------------------------------------------------
  return (
    <div className={cn('rounded-2xl overflow-hidden', className)}>
      {/* Nudge card */}
      <motion.div
        layout
        className={cn(
          'relative overflow-hidden rounded-2xl',
          'border border-[var(--dt-amberBorder)] bg-[var(--dt-amberDim)]',
          'p-6'
        )}
      >
        {/* Decorative background glyph */}
        <div className="pointer-events-none absolute -right-4 -top-4 text-[8rem] opacity-[0.06] select-none leading-none">
          📅
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Icon pill */}
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-base-100 border border-[var(--dt-amberBorder)] flex items-center justify-center text-3xl shadow-sm">
            ⭐
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-black leading-snug">
              {nudgeHeadline}
            </p>
            <p className="text-sm text-neutral mt-1 leading-relaxed">
              {nudgeSubtext}
            </p>
          </div>

          {/* CTA */}
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              color="warning"
              size="sm"
              onClick={() => setOpen((v: boolean) => !v)}
              className="whitespace-nowrap shadow-md"
            >
              {open ? 'Close' : '+ Add to calendar'}
            </Button>
          </motion.div>
        </div>

        {/* Expandable form */}
        <AnimatePresence>
          {open && (
            <EventForm
              form={form}
              setForm={setForm}
              saving={saving}
              saved={saved}
              onSave={handleSave}
              onCancel={() => setOpen(false)}
              catConfig={catConfig}
              elevated
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ------------------------------------------------------------------
// Shared inline form
// ------------------------------------------------------------------

interface EventFormProps {
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
  saving: boolean;
  saved: boolean;
  onSave: () => void;
  onCancel: () => void;
  catConfig: (typeof CATEGORY_CONFIG)[HighPriorityCategory];
  elevated?: boolean;
}

function EventForm({ form, setForm, saving, saved, onSave, onCancel, catConfig, elevated }: EventFormProps) {
  const update = (patch: Partial<FormState>) => setForm((f: FormState) => ({ ...f, ...patch }));

  return (
    <motion.div
      key="form"
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.22, ease: 'easeInOut' }}
      className={cn(
        'overflow-hidden mt-5',
        elevated && 'pt-5 border-t border-[var(--dt-amberBorder)]'
      )}
    >
      {saved ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-2 py-4 text-center"
        >
          <span className="text-4xl">✅</span>
          <p className="font-semibold text-success">Blocked! Your time is protected.</p>
          <p className="text-sm text-neutral">It&apos;s on your timetable. Don&apos;t let anything push it out.</p>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CATEGORY_CONFIG) as HighPriorityCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => update({ category: cat })}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                  form.category === cat
                    ? 'bg-warning text-warning-content border-warning shadow-sm'
                    : 'bg-base-100 border-base-300 text-neutral hover:border-warning/50'
                )}
              >
                {CATEGORY_CONFIG[cat].emoji} {CATEGORY_CONFIG[cat].label}
              </button>
            ))}
          </div>

          {/* Title */}
          <input
            type="text"
            className="input input-sm w-full"
            placeholder={catConfig.inputPlaceholder}
            value={form.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ title: e.target.value })}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && onSave()}
            autoFocus
          />

          {/* Date + time row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral font-medium">Date</label>
              <input
                type="date"
                className="input input-sm"
                value={form.date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ date: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral font-medium">Start</label>
              <input
                type="time"
                className="input input-sm"
                value={form.startTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ startTime: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral font-medium">End</label>
              <input
                type="time"
                className="input input-sm"
                value={form.endTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ endTime: e.target.value })}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button color="warning" size="sm" onClick={onSave} disabled={!form.title.trim() || saving}>
              {saving ? 'Adding…' : '⭐ Block this time'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
