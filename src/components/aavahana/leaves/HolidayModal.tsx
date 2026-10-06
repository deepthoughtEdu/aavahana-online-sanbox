"use client";

import { useEffect, useState } from "react";
import moment from "moment";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/shared/Button";
import { CalendarIcon, TrashIcon } from "@/components/shared/icons";
import { useHolidayMutations } from "@/lib/hooks/aavahana/use-holidays";
import {
  createHolidaySchema,
  updateHolidaySchema,
} from "@/validations/aavahana/holiday.validations";
import { toast } from "@/utils";
import type {
  HolidayRecord,
  HolidayType,
} from "@/types/aavahana/holiday.types";

const HOLIDAY_TYPES: { value: HolidayType; label: string }[] = [
  { value: "public",     label: "Public" },
  { value: "optional",   label: "Optional" },
  { value: "restricted", label: "Restricted" },
];

interface HolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** When set, the modal opens in edit mode; otherwise it creates a new holiday. */
  holiday: HolidayRecord | null;
  /** Read-only: members can view but not edit. Footer collapses to a Close button. */
  canEdit: boolean;
}

interface FormState {
  date: string;
  name: string;
  type: HolidayType;
  description: string;
}

const empty: FormState = {
  date: moment().format("YYYY-MM-DD"),
  name: "",
  type: "public",
  description: "",
};

function fromHoliday(h: HolidayRecord): FormState {
  return {
    date: moment(h.date).format("YYYY-MM-DD"),
    name: h.name,
    type: h.type,
    description: h.description || "",
  };
}

export function HolidayModal({ isOpen, onClose, holiday, canEdit }: HolidayModalProps) {
  const isEdit = !!holiday;
  const [form, setForm] = useState<FormState>(empty);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { create, update, remove, isCreating, isUpdating, isRemoving } =
    useHolidayMutations();

  // Reset state when the modal opens with a (different) holiday or in create mode.
  useEffect(() => {
    if (!isOpen) return;
    setForm(holiday ? fromHoliday(holiday) : empty);
    setConfirmDelete(false);
  }, [isOpen, holiday]);

  const busy = isCreating || isUpdating || isRemoving;

  const submit = async () => {
    if (isEdit) {
      const parsed = updateHolidaySchema.safeParse({
        date: form.date,
        name: form.name.trim(),
        type: form.type,
        description: form.description.trim() || null,
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message || "Invalid input");
        return;
      }
      await update({ id: holiday!.id, payload: parsed.data });
    } else {
      const parsed = createHolidaySchema.safeParse({
        date: form.date,
        name: form.name.trim(),
        type: form.type,
        description: form.description.trim() || undefined,
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message || "Invalid input");
        return;
      }
      await create(parsed.data);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!holiday) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await remove(holiday.id);
    onClose();
  };

  const title = canEdit
    ? isEdit ? "Edit Holiday" : "Add Holiday"
    : "Holiday";

  return (
    <Modal
      size="md"
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={
        canEdit
          ? "Holidays are applied org-wide and excluded from leave day counts."
          : "Read-only view. Contact your manager to make changes."
      }
      icon={<CalendarIcon />}
      footer={
        <div className="flex items-center justify-between gap-2">
          <div>
            {canEdit && isEdit && (
              <Button
                size="sm"
                color={confirmDelete ? "error" : "secondary"}
                variant={confirmDelete ? undefined : "ghost"}
                iconBefore={<TrashIcon size="sm" />}
                onClick={handleDelete}
                loading={isRemoving}
                disabled={busy}
              >
                {confirmDelete ? "Confirm delete" : "Delete"}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" color="secondary" variant="ghost" onClick={onClose} disabled={busy}>
              {canEdit ? "Cancel" : "Close"}
            </Button>
            {canEdit && (
              <Button
                size="sm"
                color="primary"
                onClick={submit}
                loading={isCreating || isUpdating}
                disabled={busy}
              >
                {isEdit ? "Save changes" : "Add holiday"}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="form-control">
          <div className="label"><span className="label-text">Date</span></div>
          <input
            type="date"
            className="input input-bordered w-full"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            disabled={!canEdit || busy}
          />
        </label>

        <label className="form-control">
          <div className="label"><span className="label-text">Type</span></div>
          <select
            className="select select-bordered w-full"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as HolidayType })}
            disabled={!canEdit || busy}
          >
            {HOLIDAY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>

        <label className="form-control sm:col-span-2">
          <div className="label"><span className="label-text">Name</span></div>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="e.g. Independence Day"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            disabled={!canEdit || busy}
            maxLength={120}
          />
        </label>

        <label className="form-control sm:col-span-2">
          <div className="label"><span className="label-text">Description (optional)</span></div>
          <textarea
            className="textarea textarea-bordered w-full"
            rows={3}
            placeholder="Notes shown when team members see this holiday."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            disabled={!canEdit || busy}
            maxLength={500}
          />
        </label>
      </div>
    </Modal>
  );
}
