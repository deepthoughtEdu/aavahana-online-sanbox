"use client";

import { useEffect, useMemo, useState } from "react";
import moment from "moment";
import type { DateRange } from "react-day-picker";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { LeaveCalendar } from "./LeaveCalendar";
import { CalculationDisplay } from "./CalculationDisplay";
import { UserInfo } from "./UserInfo";
import {
  buildCalculation,
  formatLeaveDate,
  formatLeaveDays,
  leaveDayKey,
  toLeaveDayParam,
} from "@/utils/aavahana/leave.utils";
import { useLeaveMutations } from "@/lib/hooks/aavahana/use-leaves";
import { useHolidays } from "@/lib/hooks/aavahana/use-holidays";
import { useAlert, type AlertOptions } from "@/lib/hooks/shared/use-alert";
import {
  LEAVE_STATUS_COLORS,
  LEAVE_STATUS_LABELS,
} from "@/lib/constants/leave.constants";
import {
  decideLeaveSchema,
  modifyLeaveSchema,
} from "@/validations/aavahana/leave.validations";
import { toast } from "@/utils";
import type {
  LeaveApprovalRow,
  LeaveCalculation,
  LeaveStatus,
} from "@/types/aavahana/leave.types";

type Decision = Exclude<LeaveStatus, "pending">;

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  leave: LeaveApprovalRow | null;
}

// Use the shared fractional calculator from ./leave-calc when the approver
// adjusts the date range. The original leave's workingHours object carries
// the leave-window times; fall back to defaults if it's missing. Org-wide
// holidays are passed through so the approver's preview matches what the
// backend will store on save.
function recompute(
  range: DateRange | undefined,
  workingHours?: { from?: string; to?: string } | null,
  holidayDates?: Set<string>
): LeaveCalculation | null {
  return buildCalculation({
    range,
    leaveFromTime: workingHours?.from || "11:00",
    leaveToTime: workingHours?.to || "21:00",
    holidayDates,
  });
}

export function EditModal({ isOpen, onClose, leave }: EditModalProps) {
  const [note, setNote] = useState("");
  // `undefined` means "the approver has not touched the dates". That absence IS
  // the signal for approve-as-requested, so intent is read from what they did
  // rather than declared separately — the old decision dropdown and "adjust
  // dates" checkbox could disagree, and two of their four combinations
  // silently did nothing.
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);

  const { decide, modify, isDeciding, isModifying } = useLeaveMutations();
  const { confirm } = useAlert();

  // The modal stays mounted between rows, so without this the previous leave's
  // draft range and note would bleed into the next one opened.
  useEffect(() => {
    setNote("");
    setDraftRange(undefined);
    setShowCalendar(false);
  }, [leave?.id]);

  // Holidays are scoped per-year on the backend; the EditModal's range starts
  // out at the leave's own start year, so seed from there.
  // Read locally, not in UTC — see the matching note in ApplyModal.
  const editYear = moment(draftRange?.from ?? leave?.startDate ?? new Date()).year();
  // useApi auto-unwraps `{ items, total, page, perPage }` to the items array,
  // so `holidaysData` is HolidayRecord[] (not the envelope).
  const { data: holidaysData } = useHolidays(editYear);
  const holidayDates = useMemo(() => {
    const items = Array.isArray(holidaysData) ? holidaysData : [];
    return new Set(items.map((h) => moment(h.date).format("YYYY-MM-DD")));
  }, [holidaysData]);

  // Calendar days, not instants — see toLeaveDayParam.
  const startIso = toLeaveDayParam(draftRange?.from);
  const endIso = toLeaveDayParam(draftRange?.to ?? draftRange?.from);

  // Has the approver actually moved the window? Compared as org-zone calendar
  // days so re-picking the same dates is correctly read as "no change".
  const isChanged = Boolean(
    leave &&
      startIso &&
      endIso &&
      (startIso !== leaveDayKey(leave.startDate) ||
        endIso !== leaveDayKey(leave.endDate)),
  );

  const newCalculated = useMemo(
    () => (isChanged ? recompute(draftRange, leave?.workingHours, holidayDates) : null),
    [isChanged, draftRange, leave?.workingHours, holidayDates],
  );

  if (!leave) return null;

  const busy = isDeciding || isModifying;
  const applicant =
    leave.user?.fullname || leave.user?.username || "This teammate";
  const requestedWindow = `${formatLeaveDate(leave.startDate)} → ${formatLeaveDate(leave.endDate)}`;

  /** Approve as requested, or approve the approver's adjusted window. */
  const handleApprove = async () => {
    if (isChanged) {
      if (!newCalculated || !startIso || !endIso) {
        toast.error("Please pick valid start and end dates");
        return;
      }
      // The calendar already blocks days outside the request, so this only
      // catches a stale draft. The backend enforces it for real.
      const requestedStart = leaveDayKey(leave.startDate);
      const requestedEnd = leaveDayKey(leave.endDate);
      if (
        (requestedStart && startIso < requestedStart) ||
        (requestedEnd && endIso > requestedEnd)
      ) {
        toast.error("You can shorten the requested dates, not extend them");
        return;
      }
      const payload = {
        status: "modified" as const,
        calculated: newCalculated,
        note: note.trim() || undefined,
        startDate: startIso,
        endDate: endIso,
      };
      const parsed = modifyLeaveSchema.safeParse(payload);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message || "Validation failed");
        return;
      }

      // Spell the change out. This is the decision most worth double-checking,
      // because the applicant asked for one window and is getting another.
      const answer = await confirm({
        type: "confirm",
        title: "Approve with changed dates?",
        message:
          `${applicant} asked for ${requestedWindow} (${formatLeaveDays(leave)}d). ` +
          `You are approving ${formatLeaveDate(startIso)} → ${formatLeaveDate(endIso)} ` +
          `(${formatLeaveDays({ calculated: newCalculated })}d). They will be notified.`,
        confirmText: "Yes, approve with changes",
        cancelText: "Go back",
      });
      if (!answer.isConfirmed) return;

      try {
        await modify({ id: leave.id, payload });
        onClose();
      } catch {
        /* surfaced */
      }
      return;
    }

    await submitDecision("approved", {
      type: "confirm",
      title: "Approve this leave?",
      message: `${applicant} will be approved for ${requestedWindow} (${formatLeaveDays(leave)}d). They will be notified.`,
      confirmText: "Yes, approve",
      cancelText: "Go back",
    });
  };

  const submitDecision = async (status: Decision, options: AlertOptions) => {
    const payload = { status, note: note.trim() || undefined };
    const parsed = decideLeaveSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Validation failed");
      return;
    }

    // Every decision is one-way from this screen, so each one confirms first.
    // The bulk queue already worked this way; this brings the single-row path
    // in line with it.
    const answer = await confirm(options);
    if (!answer.isConfirmed) return;

    try {
      await decide({ id: leave.id, payload });
      onClose();
    } catch {
      /* surfaced */
    }
  };

  // One primary action whose label states exactly what will happen. Reject sits
  // beside it; cancelling the leave outright is rare, so it stays a quiet
  // tertiary on the far side rather than a peer of the two real decisions.
  const footer = (
    <div className="flex items-center justify-between gap-2">
      <Button
        size="sm"
        variant="ghost"
        color="secondary"
        onClick={() =>
          submitDecision("cancelled", {
            type: "warning",
            title: "Cancel this leave?",
            message: `${applicant}'s leave for ${requestedWindow} will be cancelled. This cannot be undone from here.`,
            confirmText: "Yes, cancel it",
            cancelText: "Keep leave",
          })
        }
        disabled={busy}
      >
        Cancel this leave
      </Button>
      <div className="flex items-center gap-2">
        <Button variant="ghost" color="secondary" onClick={onClose} disabled={busy}>
          Close
        </Button>
        <Button
          color="error"
          variant="soft"
          onClick={() =>
            submitDecision("rejected", {
              type: "warning",
              title: "Reject this leave?",
              message: `${applicant}'s request for ${requestedWindow} will be rejected. They will be notified.${note.trim() ? "" : " Consider leaving a note first."}`,
              confirmText: "Yes, reject",
              cancelText: "Go back",
            })
          }
          loading={busy}
        >
          Reject
        </Button>
        <Button color="primary" onClick={handleApprove} loading={busy}>
          {isChanged ? "Approve with changes" : "Approve"}
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      size="xl"
      isOpen={isOpen}
      onClose={onClose}
      title="Review leave request"
      subtitle={`From ${formatLeaveDate(leave.startDate)} to ${formatLeaveDate(leave.endDate)}`}
      footer={footer}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <UserInfo
            uid={leave.appliedByUid}
            title="Requested by"
            name={leave.user?.fullname || leave.user?.username}
            picture={leave.user?.picture ?? null}
          />
          {leave.requestedTo && (
            <UserInfo
              uid={leave.requestedTo}
              title="Requested to"
              name={leave.requestedToUser?.fullname || leave.requestedToUser?.username}
              picture={leave.requestedToUser?.picture ?? null}
            />
          )}

          <div className="bg-base-200 rounded-lg">
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-base-content/60">Status</span>
                <Badge
                  label={LEAVE_STATUS_LABELS[leave.status]}
                  variant={LEAVE_STATUS_COLORS[leave.status]}
                  size="sm"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-base-content/60">Reason</span>
                <span className="text-xs font-medium">{leave.reason}</span>
              </div>
              {leave.teamName && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-base-content/60">Team</span>
                  <span className="text-xs font-medium">{leave.teamName}</span>
                </div>
              )}
            </div>
          </div>

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-xs font-medium">Note (optional)</span>
            </label>
            <textarea
              rows={3}
              className="textarea textarea-sm w-full bg-base-100 border border-base-300/70 focus:outline-none focus:border-primary/50"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                isChanged
                  ? "Tell them why you changed the dates"
                  : "Add a note for the applicant"
              }
            />
          </div>
        </div>

        <div className="lg:col-span-1 space-y-3">
          {/* The dates ARE the control. Touching them is what turns this into a
              modification, so there is nothing to declare up front and no way
              for two controls to contradict each other. */}
          <div className="p-3 bg-base-200/40 rounded-lg space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-base-content/60">Requested</span>
              <span
                className={
                  isChanged
                    ? "text-sm line-through text-base-content/50"
                    : "text-sm font-semibold"
                }
              >
                {formatLeaveDate(leave.startDate)} → {formatLeaveDate(leave.endDate)}
                <span className="ml-1 text-xs text-base-content/60">
                  ({formatLeaveDays(leave)}d)
                </span>
              </span>
            </div>

            {isChanged && (
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs text-primary font-medium">Approving</span>
                <span className="text-sm font-semibold text-primary">
                  {formatLeaveDate(startIso)} → {formatLeaveDate(endIso)}
                  <span className="ml-1 text-xs">
                    ({formatLeaveDays({ calculated: newCalculated })}d)
                  </span>
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Button
                size="xs"
                variant={showCalendar ? undefined : "soft"}
                color="primary"
                onClick={() => setShowCalendar((v) => !v)}
                disabled={busy}
              >
                {showCalendar ? "Done" : "Change dates"}
              </Button>
              {isChanged && (
                <Button
                  size="xs"
                  variant="ghost"
                  color="secondary"
                  onClick={() => setDraftRange(undefined)}
                  disabled={busy}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {showCalendar && (
            <div className="overflow-hidden">
              <div className="flex justify-center">
                {/* Bounded to what was applied for. An approver may shorten a
                    request or reject it outright, never extend it — granting
                    days nobody asked for is a different decision, and the
                    applicant never consented to it. Days outside the window
                    are not selectable at all, and the backend re-checks. */}
                <LeaveCalendar
                  value={draftRange ?? { from: new Date(leave.startDate), to: new Date(leave.endDate) }}
                  onChange={setDraftRange}
                  minDate={new Date(leave.startDate)}
                  maxDate={new Date(leave.endDate)}
                  holidayDates={holidayDates}
                />
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <CalculationDisplay
            startDate={isChanged ? startIso : leave.startDate}
            endDate={isChanged ? endIso : leave.endDate}
            calculated={isChanged ? newCalculated : (leave.calculated ?? null)}
          />
        </div>
      </div>
    </Modal>
  );
}
