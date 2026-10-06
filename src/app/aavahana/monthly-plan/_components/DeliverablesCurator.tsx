'use client';

import { useState } from 'react';
import { Section } from '@/components/shared/Section';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/shared/Button';
import { ListCheckIcon, PlusIcon, ClockIcon } from '@/components/shared/icons';
import type {
  MonthlyPlanDeliverable,
  MonthlyTargetWeek,
  MonthlyPriority,
} from '@/types/aavahana/monthly-plan.types';
import type { MonthlyBasketItem } from '@/types';

interface DeliverablesCuratorProps {
  basketItems: MonthlyBasketItem[];
  carryovers: MonthlyPlanDeliverable[];
  accepted: MonthlyPlanDeliverable[];
  disabled: boolean;
  onAcceptBasketItem: (item: MonthlyBasketItem) => void;
  onAcceptCarryover: (item: MonthlyPlanDeliverable) => void;
  onDefer: (itemId: string) => void;
  onDrop: (itemId: string) => void;
  onAdd: (item: Omit<MonthlyPlanDeliverable, 'id' | 'status' | 'isCarryover' | 'originalDeadline' | 'deferredTo'>) => void;
  onUpdateEstimate: (itemId: string, hours: number) => void;
  onUpdateDeliverable: (itemId: string, updates: Partial<MonthlyPlanDeliverable>) => void;
}

const PRIORITY_VARIANT: Record<string, 'error' | 'warning' | 'info' | 'ghost'> = {
  critical: 'error',
  high: 'warning',
  medium: 'info',
  low: 'ghost',
};

interface AddFormState {
  title: string;
  programId: string;
  programName: string;
  estimatedHours: string;
  deadline: string;
}

const emptyForm: AddFormState = { title: '', programId: '', programName: '', estimatedHours: '', deadline: '' };

export function DeliverablesCurator({
  basketItems,
  carryovers,
  accepted,
  disabled,
  onAcceptBasketItem,
  onAcceptCarryover,
  onDefer,
  onDrop,
  onAdd,
  onUpdateEstimate,
  onUpdateDeliverable,
}: DeliverablesCuratorProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<AddFormState>(emptyForm);
  const [editingHours, setEditingHours] = useState<string | null>(null);

  const handleAdd = () => {
    if (!form.title.trim()) return;
    onAdd({
      title: form.title.trim(),
      programId: form.programId || '1',
      programName: form.programName || 'Default',
      source: 'self_created',
      sourceRefId: null,
      estimatedHours: parseFloat(form.estimatedHours) || 0,
      deadline: form.deadline || null,
      gridCell: null,
      qaCriteria: null,
    });
    setForm(emptyForm);
    setShowAddForm(false);
  };

  // Filter out items already accepted into the plan
  const acceptedIds = new Set(accepted.map(d => d.id));
  const pendingBasket = basketItems.filter(item => !acceptedIds.has(item.id));
  const pendingCarryovers = carryovers.filter(c => !acceptedIds.has(c.id) && c.status !== 'dropped');

  return (
    <Section>
      <Section.Header icon={<ListCheckIcon size="md" />} title="Deliverables" />
      <Section.Body>
        {/* From Micromap */}
        {pendingBasket.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-2">
              From Micromap · {pendingBasket.length} item{pendingBasket.length > 1 ? 's' : ''}
            </p>
            <div className="space-y-2">
              {pendingBasket.map((item) => (
                <div key={item.id} className="bg-base-200 rounded-btn p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-base-content/60 mt-1">
                        {item.estimatedHours}h est · {item.programName}
                        {item.deadline && ` · Due: ${new Date(item.deadline).toLocaleDateString()}`}
                      </p>
                      {item.outputSpec && (
                        <p className="text-xs text-base-content/40 mt-1">QA: {item.outputSpec}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={PRIORITY_VARIANT[item.priority] ?? 'ghost'} label={item.priority} size="sm" />
                    </div>
                  </div>
                  {!disabled && (
                    <div className="flex items-center gap-2 mt-2">
                      <Button size="xs" color="success" variant="soft" onClick={() => onAcceptBasketItem(item)}>Accept</Button>
                      <Button size="xs" color="warning" variant="soft" onClick={() => onDefer(item.id)}>Defer</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Carryovers */}
        {pendingCarryovers.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-2">
              Carryovers from previous month · {pendingCarryovers.length} item{pendingCarryovers.length > 1 ? 's' : ''}
            </p>
            <div className="space-y-2">
              {pendingCarryovers.map((item) => (
                <div key={item.id} className="bg-warning/5 border border-warning/20 rounded-btn p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-warning text-xs">&#8635;</span>
                        <p className="text-sm font-medium">{item.title}</p>
                      </div>
                      <p className="text-xs text-base-content/60 mt-1">
                        {item.estimatedHours}h est · {item.programName}
                        {item.originalDeadline && ` · Was due: ${new Date(item.originalDeadline).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  {!disabled && (
                    <div className="flex items-center gap-2 mt-2">
                      <Button size="xs" color="success" variant="soft" onClick={() => onAcceptCarryover(item)}>Accept</Button>
                      <Button size="xs" color="error" variant="soft" onClick={() => onDrop(item.id)}>Drop</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accepted */}
        {accepted.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-2">
              Accepted · {accepted.filter(d => d.status === 'accepted').length} item{accepted.filter(d => d.status === 'accepted').length > 1 ? 's' : ''}
            </p>
            <div className="space-y-2">
              {accepted.filter(d => d.status === 'accepted').map((item) => (
                <div key={item.id} className="bg-success/5 border border-success/20 rounded-btn p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-base-content/60 mt-1">
                        <span className="inline-flex items-center gap-1">
                          <ClockIcon size="xs" />
                          {editingHours === item.id ? (
                            <input
                              type="number"
                              className="input input-bordered input-xs w-16"
                              defaultValue={item.estimatedHours}
                              onBlur={(e) => {
                                onUpdateEstimate(item.id, parseFloat(e.target.value) || item.estimatedHours);
                                setEditingHours(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                              }}
                              autoFocus
                            />
                          ) : (
                            <button
                              className="underline decoration-dotted cursor-pointer"
                              onClick={() => !disabled && setEditingHours(item.id)}
                            >
                              {item.estimatedHours}h
                            </button>
                          )}
                        </span>
                        {' · '}{item.programName}
                        {item.deadline && ` · Due: ${new Date(item.deadline).toLocaleDateString()}`}
                        {item.isCarryover && ' · Carryover'}
                      </p>
                    </div>
                    <Badge
                      variant={item.source === 'self_created' ? 'info' : item.isCarryover ? 'warning' : 'success'}
                      label={item.source === 'self_created' ? 'self' : item.isCarryover ? 'carryover' : 'micromap'}
                      size="sm"
                    />
                  </div>
                  {!disabled && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {/*
                        Spec Axis 1. Target week is the monthly -> weekly cascade
                        key: a deliverable tagged W2 shows up in the second week's
                        basket. Rough allocation only; the weekly plan turns it
                        into an actual timetable slot.
                      */}
                      <label className="flex items-center gap-1.5">
                        <span className="text-xs text-base-content/60">Week</span>
                        <select
                          className="select select-bordered select-xs w-20"
                          value={item.targetWeek ?? ''}
                          aria-label={`Target week for ${item.title}`}
                          onChange={(e) =>
                            onUpdateDeliverable(item.id, {
                              targetWeek: (e.target.value || null) as MonthlyTargetWeek | null,
                            })
                          }
                        >
                          <option value="">—</option>
                          <option value="W1">W1</option>
                          <option value="W2">W2</option>
                          <option value="W3">W3</option>
                          <option value="W4">W4</option>
                        </select>
                      </label>

                      <label className="flex items-center gap-1.5">
                        <span className="text-xs text-base-content/60">Priority</span>
                        <select
                          className="select select-bordered select-xs w-24"
                          value={item.priority ?? ''}
                          aria-label={`Priority for ${item.title}`}
                          onChange={(e) =>
                            onUpdateDeliverable(item.id, {
                              priority: (e.target.value || null) as MonthlyPriority | null,
                            })
                          }
                        >
                          <option value="">—</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </label>

                      <Button size="xs" color="warning" variant="ghost" onClick={() => onDefer(item.id)}>Defer</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deferred */}
        {accepted.filter(d => d.status === 'deferred').length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-medium text-base-content/40 uppercase tracking-wide mb-2">
              Deferred · {accepted.filter(d => d.status === 'deferred').length} item{accepted.filter(d => d.status === 'deferred').length > 1 ? 's' : ''}
            </p>
            <div className="space-y-2">
              {accepted.filter(d => d.status === 'deferred').map((item) => (
                <div key={item.id} className="bg-base-200 rounded-btn p-3 opacity-60">
                  <p className="text-sm">{item.title}</p>
                  <p className="text-xs text-base-content/40">
                    Deferred to {item.deferredTo} · {item.estimatedHours}h
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add form */}
        {!disabled && (
          <div className="mt-4">
            {showAddForm ? (
              <div className="bg-base-200 rounded-btn p-4 space-y-3">
                <input
                  type="text"
                  className="input input-bordered input-sm w-full"
                  placeholder="Deliverable title"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input input-bordered input-sm flex-1"
                    placeholder="Program name"
                    value={form.programName}
                    onChange={(e) => setForm(prev => ({ ...prev, programName: e.target.value }))}
                  />
                  <input
                    type="number"
                    className="input input-bordered input-sm w-20"
                    placeholder="Hours"
                    value={form.estimatedHours}
                    onChange={(e) => setForm(prev => ({ ...prev, estimatedHours: e.target.value }))}
                  />
                  <input
                    type="date"
                    className="input input-bordered input-sm"
                    value={form.deadline}
                    onChange={(e) => setForm(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="xs" color="primary" onClick={handleAdd}>Add</Button>
                  <Button size="xs" variant="ghost" onClick={() => { setShowAddForm(false); setForm(emptyForm); }}>Cancel</Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="soft" color="primary" iconBefore={<PlusIcon size="sm" />} onClick={() => setShowAddForm(true)}>
                Add deliverable
              </Button>
            )}
          </div>
        )}
      </Section.Body>
    </Section>
  );
}
