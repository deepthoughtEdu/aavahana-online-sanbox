'use client';

import { useState } from 'react';
import { CloseIcon } from '@/components/shared/icons';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { DAYS } from './timetable.constants';
import type { CalendarEvent } from '@/types/aavahana/weekly-plan.types';

interface NewEventState {
  title: string;
  type: CalendarEvent['type'];
  startTime: string;
  endTime: string;
}

interface AddEventFormProps {
  selectedDay: number | null;
  onAdd: (event: NewEventState, day: number) => void;
  onClose: () => void;
}

export function AddEventForm({ selectedDay, onAdd, onClose }: AddEventFormProps) {
  const [newEvent, setNewEvent] = useState<NewEventState>({
    title: '',
    type: 'work',
    startTime: '09:00',
    endTime: '10:00',
  });

  const handleAdd = () => {
    if (!newEvent.title.trim() || selectedDay === null) return;
    onAdd(newEvent, selectedDay);
    setNewEvent({ title: '', type: 'work', startTime: '09:00', endTime: '10:00' });
  };

  return (
    <div className="mt-4 p-4 bg-base-200 rounded-lg border border-base-300">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium">Add Event</h4>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <CloseIcon size="sm" />
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          type="text"
          placeholder="Event title"
          className="input input-sm"
          value={newEvent.title}
          onChange={(e) => setNewEvent((p) => ({ ...p, title: e.target.value }))}
        />
        <select
          className="select select-sm"
          value={newEvent.type}
          onChange={(e) =>
            setNewEvent((p) => ({ ...p, type: e.target.value as CalendarEvent['type'] }))
          }
        >
          <option value="work">Work</option>
          <option value="meeting">Meeting</option>
          <option value="review">Review</option>
          <option value="deadline">Deadline</option>
          <option value="high-priority">⭐ High Priority</option>
        </select>
        <input
          type="time"
          className="input input-sm"
          value={newEvent.startTime}
          onChange={(e) => setNewEvent((p) => ({ ...p, startTime: e.target.value }))}
        />
        <input
          type="time"
          className="input input-sm"
          value={newEvent.endTime}
          onChange={(e) => setNewEvent((p) => ({ ...p, endTime: e.target.value }))}
        />
      </div>
      <div className="flex items-center gap-2 mt-3">
        <Button color="primary" size="sm" onClick={handleAdd}>
          Add Event
        </Button>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        {selectedDay !== null && (
          <Badge variant="ghost" size="sm">
            {DAYS[selectedDay]}
          </Badge>
        )}
      </div>
    </div>
  );
}
