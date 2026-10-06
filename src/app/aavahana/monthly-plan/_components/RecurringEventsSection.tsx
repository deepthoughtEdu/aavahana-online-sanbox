'use client';

import { useState } from 'react';
import { Section } from '@/components/shared/Section';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/shared/Button';
import { ClockIcon, PlusIcon, CloseIcon } from '@/components/shared/icons';
import type { RecurringEvent, RecurringEventType } from '@/types/aavahana/monthly-plan.types';
import type { ColorVariant } from '@/utils/shared/design.utils';

const DAY_NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const EVENT_TYPES: RecurringEventType[] = ['meeting', 'review', 'learning', 'wellness', 'standup', 'other'];

interface RecurringEventsSectionProps {
  events: RecurringEvent[];
  disabled: boolean;
  weeklyHours: number;
  weeksInMonth: number;
  availableHoursAfterRecurring: number;
  onAdd: (event: Omit<RecurringEvent, 'id' | 'isActive'>) => void;
  onUpdate: (eventId: string, updates: Partial<RecurringEvent>) => void;
  onRemove: (eventId: string) => void;
}

function formatDays(days: number[]): string {
  const sorted = [...days].sort();
  if (sorted.length === 5 && sorted[0] === 1 && sorted[4] === 5) return 'Mon\u2013Fri';
  if (sorted.length === 7) return 'Every day';
  return sorted.map(d => DAY_NAMES[d]).join(', ');
}

function formatDuration(start: string, end: string): string {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

const typeBadgeVariant: Record<RecurringEventType, ColorVariant> = {
  meeting: 'info',
  review: 'warning',
  learning: 'success',
  wellness: 'success',
  standup: 'ghost',
  other: 'ghost',
};

export function RecurringEventsSection({
  events,
  disabled,
  weeklyHours,
  weeksInMonth,
  availableHoursAfterRecurring,
  onAdd,
  onUpdate,
  onRemove,
}: RecurringEventsSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [type, setType] = useState<RecurringEventType>('meeting');

  const resetForm = () => {
    setTitle('');
    setSelectedDays([]);
    setStartTime('09:00');
    setEndTime('10:00');
    setType('meeting');
    setShowForm(false);
    setEditId(null);
  };

  const handleSubmit = () => {
    if (!title.trim() || selectedDays.length === 0) return;
    if (editId) {
      onUpdate(editId, { title: title.trim(), daysOfWeek: selectedDays, startTime, endTime, type });
    } else {
      onAdd({ title: title.trim(), daysOfWeek: selectedDays, startTime, endTime, type });
    }
    resetForm();
  };

  const handleEdit = (event: RecurringEvent) => {
    setTitle(event.title);
    setSelectedDays(event.daysOfWeek);
    setStartTime(event.startTime);
    setEndTime(event.endTime);
    setType(event.type);
    setEditId(event.id);
    setShowForm(true);
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const monthlyTotal = Math.round(weeklyHours * weeksInMonth * 10) / 10;
  const activeEvents = events.filter(e => e.isActive);

  return (
    <Section>
      <Section.Header
        icon={<ClockIcon size="md" />}
        title="Recurring Events"
        subtitle={`${activeEvents.length} event${activeEvents.length !== 1 ? 's' : ''} \u00b7 ${weeklyHours}h/week`}
        size="sm"
      />
      <Section.Body>
        {activeEvents.length === 0 && !showForm && (
          <p className="text-sm text-base-content/50">
            No recurring events. Add reviews, L&D blocks, standups, or other weekly commitments.
          </p>
        )}

        <div className="space-y-2">
          {activeEvents.map(event => (
            <div key={event.id} className="flex items-center justify-between rounded-lg bg-base-200 px-3 py-2">
              <div>
                <span className="font-medium text-sm">{event.title}</span>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-base-content/60">
                  <span>{formatDays(event.daysOfWeek)}</span>
                  <span>&middot;</span>
                  <span>{event.startTime}\u2013{event.endTime}</span>
                  <span>&middot;</span>
                  <span>{formatDuration(event.startTime, event.endTime)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={typeBadgeVariant[event.type]} label={event.type} size="sm" />
                {!disabled && (
                  <>
                    <Button variant="ghost" size="xs" onClick={() => handleEdit(event)}>Edit</Button>
                    <Button variant="ghost" size="xs" onClick={() => onRemove(event.id)}>
                      <CloseIcon size="sm" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {showForm && !disabled && (
          <div className="mt-3 rounded-lg border border-base-300 p-3 space-y-3">
            <input
              type="text"
              className="input input-bordered input-sm w-full"
              placeholder="Event title"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />

            <div>
              <label className="text-xs text-base-content/60 mb-1 block">Days</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map(day => (
                  <button
                    key={day}
                    className={`btn btn-xs ${selectedDays.includes(day) ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => toggleDay(day)}
                    type="button"
                  >
                    {DAY_NAMES[day]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <div>
                <label className="text-xs text-base-content/60 mb-1 block">Start</label>
                <input type="time" className="input input-bordered input-sm" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-base-content/60 mb-1 block">End</label>
                <input type="time" className="input input-bordered input-sm" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-base-content/60 mb-1 block">Type</label>
                <select className="select select-bordered select-sm" value={type} onChange={e => setType(e.target.value as RecurringEventType)}>
                  {EVENT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={resetForm}>Cancel</Button>
              <Button color="primary" size="sm" onClick={handleSubmit} disabled={!title.trim() || selectedDays.length === 0}>
                {editId ? 'Update' : 'Add'}
              </Button>
            </div>
          </div>
        )}

        {!showForm && !disabled && (
          <Button variant="ghost" size="sm" className="mt-2" iconBefore={<PlusIcon size="sm" />} onClick={() => setShowForm(true)}>
            Add recurring event
          </Button>
        )}

        <div className="mt-3 pt-3 border-t border-base-300 text-xs text-base-content/60 space-y-1">
          <p>Weekly time blocked: {weeklyHours}h &middot; Monthly total: ~{monthlyTotal}h ({weeksInMonth} weeks)</p>
          <p>Available after recurring: ~{availableHoursAfterRecurring}h</p>
        </div>
      </Section.Body>
    </Section>
  );
}
