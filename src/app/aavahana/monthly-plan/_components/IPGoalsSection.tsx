'use client';

import { useState } from 'react';
import { Section } from '@/components/shared/Section';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/shared/Button';
import { LightbulbIcon, PlusIcon } from '@/components/shared/icons';
import type { MonthlyIPGoal, IPMaturity, IpItemOption } from '@/types/aavahana/monthly-plan.types';

interface IPGoalsSectionProps {
  goals: MonthlyIPGoal[];
  disabled: boolean;
  /** IP registry items available to pick. Empty until the query resolves. */
  ipItems: IpItemOption[];
  onAdd: (goal: Omit<MonthlyIPGoal, 'id'>) => void;
  onRemove: (goalId: string) => void;
  onUpdate: (goalId: string, updates: Partial<MonthlyIPGoal>) => void;
}

interface AddFormState {
  ipItemId: string;
  targetCommits: string;
}

const emptyForm: AddFormState = { ipItemId: '', targetCommits: '' };

export function IPGoalsSection({ goals, disabled, ipItems, onAdd, onRemove, onUpdate }: IPGoalsSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<AddFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Already-picked items are removed from the list rather than allowed twice —
  // two goals on one item would double-count the same commits.
  const takenIds = new Set(goals.map(g => String(g.ipItemId ?? '')));
  const available = ipItems.filter(i => !takenIds.has(String(i.id)));

  const handleAdd = () => {
    // The goal must point at a real IpItem: maturity is derived from that
    // item's verified commit count, so a free-text goal can only report "none".
    const picked = ipItems.find(i => String(i.id) === form.ipItemId);
    if (!picked) return;
    onAdd({
      ipItemId: picked.id,
      title: picked.title,
      targetCommits: parseInt(form.targetCommits) || 1,
      programId: picked.programId != null ? String(picked.programId) : null,
      zone: picked.zone,
    });
    setForm(emptyForm);
    setShowAddForm(false);
  };

  return (
    <Section>
      <Section.Header icon={<LightbulbIcon size="md" />} title="IP Goals" />
      <Section.Body>
        {goals.length === 0 && !showAddForm && (
          <p className="text-sm text-base-content/60">No IP goals set for this month.</p>
        )}

        {goals.length > 0 && (
          <div className="space-y-2 mb-4">
            {goals.map((goal) => (
              <div key={goal.id} className="flex items-center justify-between bg-base-200 rounded-btn px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{goal.title}</p>
                  <p className="text-xs text-base-content/60">
                    {editingId === goal.id ? (
                      <span className="inline-flex items-center gap-1">
                        Target:
                        <input
                          type="number"
                          className="input input-bordered input-xs w-14"
                          defaultValue={goal.targetCommits}
                          onBlur={(e) => {
                            onUpdate(goal.id, { targetCommits: parseInt(e.target.value) || goal.targetCommits });
                            setEditingId(null);
                          }}
                          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                          autoFocus
                        />
                        commits
                      </span>
                    ) : (
                      <>
                        Target: {goal.targetCommits} commit{goal.targetCommits > 1 ? 's' : ''}
                      </>
                    )}
                  </p>

                  {/*
                    Spec Axis 2. Current maturity is derived from verified commit
                    counts server-side (nascent 1-2, developing 3-5, mature 6-10,
                    established 11+), so it is shown, never edited. Only the
                    target is an input.
                  */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-xs text-base-content/60">
                      Now:{' '}
                      <span className="font-medium capitalize">
                        {goal.currentMaturity && goal.currentMaturity !== 'none'
                          ? goal.currentMaturity
                          : 'no verified commits'}
                      </span>
                      {typeof goal.commitCount === 'number' && goal.commitCount > 0 &&
                        ` (${goal.commitCount})`}
                    </span>

                    {!disabled && (
                      <label className="flex items-center gap-1.5">
                        <span className="text-xs text-base-content/60">Target</span>
                        <select
                          className="select select-bordered select-xs w-32"
                          value={goal.targetMaturity ?? ''}
                          aria-label={`Target maturity for ${goal.title}`}
                          onChange={(e) =>
                            onUpdate(goal.id, {
                              targetMaturity: (e.target.value || null) as IPMaturity | null,
                            })
                          }
                        >
                          <option value="">—</option>
                          <option value="nascent">Nascent</option>
                          <option value="developing">Developing</option>
                          <option value="mature">Mature</option>
                          <option value="established">Established</option>
                        </select>
                      </label>
                    )}

                    {goal.isAdvancement && (
                      <Badge variant="success" label="advancing" size="sm" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={goal.zone === 'myzone' ? 'info' : 'success'} label={goal.zone === 'myzone' ? 'MyZone' : 'Program'} size="sm" />
                  {!disabled && (
                    <>
                      <Button size="xs" variant="ghost" onClick={() => setEditingId(goal.id)}>Edit</Button>
                      <Button size="xs" variant="ghost" color="error" onClick={() => onRemove(goal.id)}>Remove</Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!disabled && (
          showAddForm ? (
            <div className="bg-base-200 rounded-btn p-4 space-y-3">
              {/* Registry-bound, not free text: the goal has to name a real IP
                  item or the server cannot compute its maturity. */}
              <select
                className="select select-bordered select-sm w-full"
                value={form.ipItemId}
                aria-label="IP item"
                onChange={(e) => setForm(prev => ({ ...prev, ipItemId: e.target.value }))}
              >
                <option value="">Select an IP item…</option>
                {available.map(item => (
                  <option key={String(item.id)} value={String(item.id)}>
                    {item.title} ({item.zone === 'myzone' ? 'MyZone' : 'Program'})
                  </option>
                ))}
              </select>
              {available.length === 0 && (
                <p className="text-xs text-base-content/60">
                  {ipItems.length === 0
                    ? 'No IP items in the registry yet. Create one under IP first.'
                    : 'Every IP item already has a goal this month.'}
                </p>
              )}
              <input
                type="number"
                className="input input-bordered input-sm w-28"
                placeholder="Commits"
                aria-label="Target commits"
                value={form.targetCommits}
                onChange={(e) => setForm(prev => ({ ...prev, targetCommits: e.target.value }))}
              />
              <div className="flex gap-2">
                <Button size="xs" color="primary" disabled={!form.ipItemId} onClick={handleAdd}>Add</Button>
                <Button size="xs" variant="ghost" onClick={() => { setShowAddForm(false); setForm(emptyForm); }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="soft" color="primary" iconBefore={<PlusIcon size="sm" />} onClick={() => setShowAddForm(true)}>
              Add IP goal
            </Button>
          )
        )}
      </Section.Body>
    </Section>
  );
}
