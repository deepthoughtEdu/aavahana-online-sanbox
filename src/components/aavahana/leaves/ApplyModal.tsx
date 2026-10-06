"use client";

import { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { useAtomValue } from "jotai";
import type { DateRange } from "react-day-picker";
import { userAtom } from "@/lib/store/auth";
import { useApi } from "@/lib/hooks/shared/use-api";
import { useEmployeeMe } from "@/lib/hooks/aavahana/use-profile";
import { PlanService } from "@/lib/services";
import { LeaveService } from "@/lib/services/aavahana/leave.service";
import { todayISO } from "@/utils/shared/date.utils";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/shared/Button";
import { AvatarImage } from "@/components/shared/AvatarImage";
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
} from "@/components/shared/icons";
import { cn } from "@/utils";
import { LeaveCalendar } from "./LeaveCalendar";
import { CalculationDisplay } from "./CalculationDisplay";
import { TimePicker } from "./TimePicker";
import { UserInfo } from "./UserInfo";
import {
  buildCalculation,
  formatLeaveDate,
  formatLeaveDays,
  normalizeWorkDay,
  toLeaveDayParam,
} from "@/utils/aavahana/leave.utils";
import { useLeaveMutations, useMyLeaveBalance } from "@/lib/hooks/aavahana/use-leaves";
import { useHolidays } from "@/lib/hooks/aavahana/use-holidays";
import {
  DEFAULT_REASON_FOR_TYPE,
  LEAVE_REASONS,
  LEAVE_TYPES,
  LEAVE_TYPE_LABELS,
  DEFAULT_WORKING_HOURS,
  MAX_BACKDATE_DAYS,
} from "@/lib/constants/leave.constants";
import { applyLeaveSchema } from "@/validations/aavahana/leave.validations";
import { toast } from "@/utils";
import type {
  LeaveBalanceResponse,
  LeaveRecord,
  LeaveType,
} from "@/types/aavahana/leave.types";

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormState {
  /**
   * A leave-type key from the org's Leave Policy. Typed loosely because the
   * policy is data, not a compile-time union — an admin can add or rename a
   * type without a code change. Falls back to the legacy constants only when
   * no policy has been configured for the year.
   */
  type: LeaveType | string;
  range: DateRange | undefined;
  reason: string;
  reasonOther: string;
  description: string;
  deliverables: string;
  assignee: string;
  workingHoursFrom: string;
  workingHoursTo: string;
  isUrgent: boolean;
  urgentReason: string;
  noSupervisorReason: string;
}

const initialState: FormState = {
  type: "casual",
  range: undefined,
  reason: LEAVE_REASONS[0],
  reasonOther: "",
  description: "",
  deliverables: "",
  assignee: "",
  workingHoursFrom: DEFAULT_WORKING_HOURS.from,
  workingHoursTo: DEFAULT_WORKING_HOURS.to,
  isUrgent: false,
  urgentReason: "",
  noSupervisorReason: "",
};

type LeaveDuration = "full" | "half" | "custom";

export function ApplyModal({ isOpen, onClose }: ApplyModalProps) {
  const [form, setForm] = useState<FormState>(initialState);
  // The org's Leave Policy is the source of truth for what can be applied for,
  // and the same call carries what the caller has left of each type.
  const { data: balanceData } = useMyLeaveBalance();
  const balances = useMemo(
    () => (balanceData as LeaveBalanceResponse | undefined)?.balances ?? [],
    [balanceData]
  );
  // The allowance is spent per calendar month and never carries forward, so
  // this — not the year's figure — is what decides whether the leave being
  // applied for right now gets paid.
  const monthly = (balanceData as LeaveBalanceResponse | undefined)?.monthly;
  const monthlyLeft = monthly?.remaining ?? 0;
  const typeOptions = useMemo(
    () =>
      balances.length
        ? balances.map((b) => ({ value: b.type, label: b.label }))
        : // No policy configured for the year — fall back to the legacy list so
          // the form still works rather than offering nothing at all.
          LEAVE_TYPES.map((t) => ({ value: t as string, label: LEAVE_TYPE_LABELS[t] })),
    [balances]
  );
  // What the selected type actually spends. Non-medical types collapse onto the
  // casual allowance server-side, so the number shown has to be that bucket's.
  const selectedBalance = useMemo(() => {
    const picked = balances.find((b) => b.type === form.type);
    if (!picked) return null;
    const charged = picked.chargesTo
      ? balances.find((b) => b.type === picked.chargesTo) ?? picked
      : picked;
    return { picked, charged };
  }, [balances, form.type]);
  // Set on a successful POST — swaps the modal body to the confirmation view
  // with the reviewer list pulled from the server's response.
  const [submittedLeave, setSubmittedLeave] = useState<LeaveRecord | null>(null);
  const { apply, isApplying } = useLeaveMutations();
  const user = useAtomValue(userAtom);

  // Profile-driven work day — falls back to DEFAULT_WORK_DAY inside
  // buildCalculation when the user hasn't set their working hours yet.
  const { data: me } = useEmployeeMe();
  // The API has returned two shapes for this field over time — the leave
  // profile's { from, to } and the invite form's free text ("3pm-7pm IST") —
  // so resolve it once here rather than trusting the declared type.
  const profileWorkDay = normalizeWorkDay(
    (me as { workingHours?: unknown } | undefined)?.workingHours
  );

  // Holiday-aware calc — fetch holidays for the year the applicant is picking
  // dates in so the preview matches the authoritative backend computation.
  // Year of the day the applicant picked, read locally. `getUTCFullYear()` on a
  // local-midnight Date rolls back a year for a 1 Jan leave in any UTC+ zone,
  // which fetched the wrong year's holidays.
  const calcYear = moment(form.range?.from ?? new Date()).year();
  const { data: holidaysData } = useHolidays(calcYear);
  const holidayDates = useMemo(() => {
    const items = Array.isArray(holidaysData) ? holidaysData : [];
    return new Set(items.map((h) => moment(h.date).format("YYYY-MM-DD")));
  }, [holidaysData]);

  // Handoff deliverables (the 3 optional fields) — collapsed by default so the
  // primary form stays compact. User opens it only when they need to record
  // handoff context.
  const [handoffOpen, setHandoffOpen] = useState(false);

  // Leave timings toggle: Full = entire work day, Half = first half,
  // Custom = manual pickers. Non-custom keeps the from/to fields in sync with
  // the chosen preset.
  const [leaveDuration, setLeaveDuration] = useState<LeaveDuration>("full");

  // Track manual overrides so our "smart defaults" never fight the user.
  // Once they explicitly pick a reason or edit deliverables, we stop syncing.
  const [reasonTouched, setReasonTouched] = useState(false);
  const [deliverablesTouched, setDeliverablesTouched] = useState(false);

  // Today's plan — used to pre-fill the deliverables field so the user can edit
  // rather than start from blank.
  const { data: todayPlanData } = useApi({
    queryFn: () => PlanService.getDailyPlan(todayISO()),
    queryKey: ["aavahana", "leaves", "apply", "daily-plan", todayISO()],
    enabled: isOpen,
  });
  const todayPlanTasks = useMemo(() => {
    const raw = todayPlanData as unknown;
    if (Array.isArray(raw)) {
      return raw as Array<{ text: string; budgetMins?: number | null }>;
    }
    return [];
  }, [todayPlanData]);

  // Auto-suggest leave reason from the leave type. Skips if the user has
  // touched the reason (manual choice wins).
  useEffect(() => {
    if (reasonTouched) return;
    // Keyed by the legacy vocabulary; a policy type that isn't in it simply
    // gets no suggestion rather than blanking the user's reason.
    const suggested = (DEFAULT_REASON_FOR_TYPE as Record<string, string>)[
      form.type
    ];
    if (suggested && form.reason !== suggested) {
      setForm((f) => ({ ...f, reason: suggested }));
    }
  }, [form.type, form.reason, reasonTouched]);

  // The initial "casual" is a guess made before the policy loads. Once it has,
  // snap to a type the policy actually defines — otherwise the form would post
  // a key the entitlement engine can't match and the leave lands unpaid.
  useEffect(() => {
    if (!typeOptions.length) return;
    if (typeOptions.some((t) => t.value === form.type)) return;
    setForm((f) => ({ ...f, type: typeOptions[0].value }));
  }, [typeOptions, form.type]);

  // Auto-fill deliverables from today's plan once when the modal opens. Skips
  // if the user has already edited the field, so reopens don't overwrite work.
  useEffect(() => {
    if (!isOpen) return;
    if (deliverablesTouched) return;
    if (todayPlanTasks.length === 0) return;
    const joined = todayPlanTasks
      .map((t) => t.text)
      .filter(Boolean)
      .join(", ");
    if (!joined) return;
    setForm((f) => (f.deliverables ? f : { ...f, deliverables: joined }));
  }, [isOpen, todayPlanTasks, deliverablesTouched]);

  // Fetch the user's existing leaves so we can warn about overlapping ranges.
  // 50 rows is plenty for the warning — we filter by status client-side.
  const { data: myLeavesData } = useApi({
    queryFn: () => LeaveService.listAllMine({ page: 1, perPage: 50 }),
    queryKey: ["aavahana", "leaves", "apply", "my-leaves"],
    enabled: isOpen,
  });
  const conflictingLeave = useMemo(() => {
    const items = (myLeavesData as { items?: LeaveRecord[] } | undefined)?.items;
    if (!Array.isArray(items) || items.length === 0) return null;
    const from = form.range?.from;
    const to = form.range?.to ?? form.range?.from;
    if (!from || !to) return null;
    const startMs = from.getTime();
    const endMs = to.getTime();
    for (const leave of items) {
      // Only block against ranges that could still consume balance —
      // cancelled / rejected leaves are safe to overlap.
      if (leave.status === "cancelled" || leave.status === "rejected") continue;
      const ls = new Date(leave.startDate).getTime();
      const le = new Date(leave.endDate).getTime();
      if (Number.isNaN(ls) || Number.isNaN(le)) continue;
      if (ls <= endMs && le >= startMs) return leave;
    }
    return null;
  }, [myLeavesData, form.range]);

  // Check whether the supervisor is on approved leave overlapping the
  // requested range. Backend uses the same check to require the rationale
  // field; the UI mirrors it so the user knows up-front.
  const supervisorRangeStart = toLeaveDayParam(form.range?.from) ?? null;
  const supervisorRangeEnd =
    toLeaveDayParam(form.range?.to ?? form.range?.from) ?? null;
  const { data: supervisorAvailability } = useApi({
    queryFn: () =>
      LeaveService.checkSupervisorAvailability(
        supervisorRangeStart as string,
        supervisorRangeEnd as string
      ),
    queryKey: [
      "aavahana",
      "leaves",
      "apply",
      "supervisor-availability",
      supervisorRangeStart,
      supervisorRangeEnd,
    ],
    enabled: isOpen && !!supervisorRangeStart && !!supervisorRangeEnd,
  });
  const supervisorOnLeave = !!(supervisorAvailability as
    | { onLeave?: boolean }
    | undefined)?.onLeave;
  // Who the request will actually reach for approval — mirrors backend routing:
  // available supervisor → escalated top supervisor → org-admins pool. Only
  // available once a date range is picked, since it rides on the availability
  // lookup.
  const approver = (supervisorAvailability as
    | {
        approver?: {
          type: "supervisor" | "top_supervisor" | "admins" | "none";
          user?: {
            uid: string;
            username?: string;
            fullname?: string | null;
            picture?: string | null;
          } | null;
          users?: Array<{
            uid: string;
            username?: string;
            fullname?: string | null;
            picture?: string | null;
          }>;
        };
      }
    | undefined)?.approver ?? null;

  const calculated = useMemo(
    () =>
      buildCalculation({
        range: form.range,
        leaveFromTime: form.workingHoursFrom,
        leaveToTime: form.workingHoursTo,
        workDay: profileWorkDay,
        holidayDates,
      }),
    [form.range, form.workingHoursFrom, form.workingHoursTo, profileWorkDay, holidayDates]
  );

  const leaveHoursPerDay = useMemo(() => {
    const [fh, fm] = form.workingHoursFrom.split(":").map(Number);
    const [th, tm] = form.workingHoursTo.split(":").map(Number);
    if ([fh, fm, th, tm].some(Number.isNaN)) return null;
    const mins = th * 60 + tm - (fh * 60 + fm);
    return mins > 0 ? mins / 60 : null;
  }, [form.workingHoursFrom, form.workingHoursTo]);

  // Calendar days, not instants — see toLeaveDayParam.
  const startIso = toLeaveDayParam(form.range?.from);
  const endIso = toLeaveDayParam(form.range?.to ?? form.range?.from);

  const reset = () => {
    setForm(initialState);
    setHandoffOpen(false);
    setLeaveDuration("full");
    setSubmittedLeave(null);
    setReasonTouched(false);
    setDeliverablesTouched(false);
  };
  const handleClose = () => {
    reset();
    onClose();
  };

  // Compute the time window for Full / Half presets from the profile work day
  // (falling back to DEFAULT_WORKING_HOURS when the user hasn't set one yet).
  // Half = first half of the day, rounded to the nearest minute.
  const presetWindow = useMemo(() => {
    const { from, to } = profileWorkDay;
    const [fh, fm] = from.split(":").map(Number);
    const [th, tm] = to.split(":").map(Number);
    const fromMins = fh * 60 + fm;
    const toMins = th * 60 + tm;
    const midMins = Math.round((fromMins + toMins) / 2);
    const fmt = (mins: number) =>
      `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
    return { full: { from, to }, half: { from, to: fmt(midMins) } };
  }, [profileWorkDay]);

  useEffect(() => {
    if (leaveDuration === "custom") return;
    const next = leaveDuration === "full" ? presetWindow.full : presetWindow.half;
    setForm((f) =>
      f.workingHoursFrom === next.from && f.workingHoursTo === next.to
        ? f
        : { ...f, workingHoursFrom: next.from, workingHoursTo: next.to }
    );
  }, [leaveDuration, presetWindow]);

  const handleSubmit = async () => {
    if (!calculated || !startIso || !endIso) {
      toast.error("Please select start and end dates");
      return;
    }
    if (form.isUrgent && !form.urgentReason.trim()) {
      toast.error("Please explain why this leave is urgent");
      return;
    }
    if (supervisorOnLeave && !form.noSupervisorReason.trim()) {
      toast.error(
        "Your supervisor is on leave — please explain why you're applying now"
      );
      return;
    }

    const finalReason =
      form.reason === "Other" ? form.reasonOther.trim() : form.reason;

    // No requestedTo / supervisorId — the backend infers the reporting manager
    // from the caller's onboarding org_introduction step.
    const payload = {
      type: form.type,
      startDate: startIso,
      endDate: endIso,
      days: calculated.workingDays ?? 1,
      reason: finalReason,
      calculated,
      workingHours: { from: form.workingHoursFrom, to: form.workingHoursTo },
      description: form.description.trim() || undefined,
      deliverables: form.deliverables.trim() || undefined,
      assignee: form.assignee.trim() || undefined,
      isUrgent: form.isUrgent,
      urgentReason: form.isUrgent ? form.urgentReason.trim() : undefined,
      noSupervisorReason: supervisorOnLeave
        ? form.noSupervisorReason.trim()
        : undefined,
    };

    const parsed = applyLeaveSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Validation failed");
      return;
    }

    try {
      const result = (await apply(payload)) as LeaveRecord | undefined;
      if (result) setSubmittedLeave(result);
    } catch {
      /* surfaced */
    }
  };

  const finalLeavesCount = Number(calculated?.finalLeaves || 0);
  const submitDisabled =
    !calculated ||
    finalLeavesCount === 0 ||
    (form.isUrgent && !form.urgentReason.trim()) ||
    (supervisorOnLeave && !form.noSupervisorReason.trim());

  const footer = submittedLeave ? (
    <div className="flex justify-end w-full">
      <Button color="primary" size="sm" onClick={handleClose}>
        Done
      </Button>
    </div>
  ) : (
    <div className="flex items-center justify-between w-full">
      <div className="text-xs text-base-content/60">
        {!calculated ? (
          <span>Select leave dates to continue</span>
        ) : finalLeavesCount === 0 ? (
          <span className="font-medium text-error">
            Final leave count is zero — cannot submit
          </span>
        ) : (
          <span className="font-medium text-success">
            ✓ {finalLeavesCount} working day{finalLeavesCount === 1 ? "" : "s"} selected
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="soft" color="secondary" size="sm" onClick={handleClose} disabled={isApplying}>
          Cancel
        </Button>
        <Button
          color="primary"
          size="sm"
          onClick={handleSubmit}
          loading={isApplying}
          disabled={submitDisabled}
        >
          Submit Leave
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      size="xl"
      isOpen={isOpen}
      onClose={handleClose}
      title={submittedLeave ? "Leave request submitted" : "Apply for Leave"}
      subtitle={
        submittedLeave
          ? "We've sent it to your reviewer(s) for approval."
          : "Fill in the details for your leave request"
      }
      icon={<CalendarIcon />}
      footer={footer}
    >
      {submittedLeave ? (
        <SubmittedView leave={submittedLeave} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
          {/* ─── LEFT: calendar + leave timings (left-aligned, compact) ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon size="sm" className="text-primary" />
                <h4 className="font-semibold text-sm">Select leave duration</h4>
              </div>
              {conflictingLeave && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-warning/15 text-warning-content">
                  Overlaps with leave on{" "}
                  {formatLeaveDate(conflictingLeave.startDate, "DD MMM")}
                </span>
              )}
            </div>

            <div className="flex justify-start">
              <LeaveCalendar
                value={form.range}
                onChange={(range) => setForm((f) => ({ ...f, range }))}
                minDate={moment()
                  .startOf("day")
                  .subtract(MAX_BACKDATE_DAYS, "days")
                  .toDate()}
                holidayDates={holidayDates}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ClockIcon size="sm" className="text-primary" />
                  <h4 className="font-semibold text-sm">Leave timings</h4>
                </div>
                {leaveHoursPerDay !== null && (
                  <span className="text-xs text-base-content/60">
                    {leaveHoursPerDay % 1 === 0
                      ? leaveHoursPerDay
                      : leaveHoursPerDay.toFixed(1)}{" "}
                    {leaveHoursPerDay === 1 ? "hour" : "hours"} / day
                  </span>
                )}
              </div>

              {/* Match the calendar's width so the three buttons together
                  span the same horizontal extent as the day grid above. */}
              <div className="grid grid-cols-3 gap-1 bg-base-200 rounded-lg p-1 w-fit max-w-full">
                {(
                  [
                    { key: "full", label: "Full" },
                    { key: "half", label: "Half" },
                    { key: "custom", label: "Custom" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setLeaveDuration(opt.key)}
                    className={cn(
                      "min-w-[5.5rem] px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                      leaveDuration === opt.key
                        ? "bg-primary text-primary-content shadow-sm"
                        : "text-base-content/70 hover:bg-base-100/60"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {leaveDuration === "custom" ? (
                <div className="grid grid-cols-2 bg-base-200 rounded-lg overflow-visible mt-2 w-fit max-w-full">
                  <div className="min-w-[8.5rem]">
                    <TimePicker
                      label="From"
                      value={form.workingHoursFrom}
                      onChange={(v) =>
                        setForm((f) => ({ ...f, workingHoursFrom: v }))
                      }
                    />
                  </div>
                  <div className="min-w-[8.5rem] border-l border-base-300">
                    <TimePicker
                      label="To"
                      value={form.workingHoursTo}
                      onChange={(v) =>
                        setForm((f) => ({ ...f, workingHoursTo: v }))
                      }
                      alignRight
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* ─── MIDDLE: full leave breakdown ───────────────────────────── */}
          <div className="space-y-3">
            {startIso && endIso && calculated ? (
              <CalculationDisplay
                startDate={startIso}
                endDate={endIso}
                calculated={calculated}
              />
            ) : (
              <p className="text-xs text-base-content/50 italic">
                Pick dates on the calendar to see the leave breakdown.
              </p>
            )}
          </div>

          {/* ─── RIGHT: who + what (minimal, top-down) ──────────────────── */}
          <div className="space-y-3">
            <UserInfo
              uid={user?.uid != null ? String(user.uid) : null}
              title="Requested by"
              name={user?.fullname || user?.username}
              picture={user?.picture}
            />
            {approver?.user ? (
              <UserInfo
                uid={approver.user.uid}
                title="Requested to"
                name={approver.user.fullname || approver.user.username}
                picture={approver.user.picture ?? null}
              />
            ) : approver?.type === "admins" ? (
              <div className="flex items-start gap-3">
                <AvatarImage src={null} name="Org admins" size={40} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs text-base-content/60">Requested to</h4>
                  <p className="font-semibold text-sm">
                    {approver.users && approver.users.length > 0
                      ? approver.users
                          .map((u) => u.fullname || u.username)
                          .join(", ")
                      : "Org admins / leadership"}
                  </p>
                  {approver.users && approver.users.length > 0 && (
                    <p className="text-xs text-base-content/60">
                      Org admins / leadership
                    </p>
                  )}
                </div>
              </div>
            ) : approver?.type === "none" ? (
              <div className="rounded-lg bg-warning/10 p-3">
                <h4 className="text-xs text-base-content/60 mb-0.5">
                  Requested to
                </h4>
                <p className="text-sm font-medium text-warning-content">
                  No approver available — ask your admin to assign a supervisor
                  or an org leader before applying.
                </p>
              </div>
            ) : null}

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Basic details</h4>

              <Field label="Leave type" required>
                <select
                  className="select select-sm w-full bg-base-100 border border-base-300/70 focus:outline-none focus:border-primary/50"
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value }))
                  }
                >
                  {typeOptions.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {/* What this leave will actually cost — read before applying,
                    not discovered on the payslip. */}
                {selectedBalance ? (
                  selectedBalance.picked.isPaid ? (
                    <p className="mt-1.5 text-xs text-base-content/60">
                      <span
                        className={
                          monthlyLeft > 0
                            ? "font-semibold text-success"
                            : "font-semibold text-error"
                        }
                      >
                        {monthlyLeft} paid {monthlyLeft === 1 ? "day" : "days"}{" "}
                        available
                      </span>
                      {selectedBalance.charged.type !== selectedBalance.picked.type
                        ? ` — ${selectedBalance.picked.label} is charged to your ${selectedBalance.charged.label} allowance`
                        : ""}
                      .
                      {monthlyLeft <= 0
                        ? monthly?.carryForward
                          ? " This leave will be unpaid until more accrues."
                          : " This leave will be unpaid — the allowance resets next month."
                        : ""}
                      {monthly?.maxPaidDaysPerRequest &&
                      Number(calculated?.workingDays ?? 0) >
                        monthly.maxPaidDaysPerRequest
                        ? ` Only ${monthly.maxPaidDaysPerRequest} days of one continuous leave can be paid — the rest are unpaid.`
                        : ""}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-base-content/60">
                      {selectedBalance.picked.label} is unpaid — these days are
                      not counted as billable.
                    </p>
                  )
                ) : null}
              </Field>

              <Field label="Reason" required>
                <select
                  className="select select-sm w-full bg-base-100 border border-base-300/70 focus:outline-none focus:border-primary/50"
                  value={form.reason}
                  onChange={(e) => {
                    setReasonTouched(true);
                    setForm((f) => ({ ...f, reason: e.target.value }));
                  }}
                >
                  {LEAVE_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {form.reason === "Other" && (
                  <input
                    className="input input-sm w-full bg-base-100 border border-base-300/70 focus:outline-none focus:border-primary/50 mt-2"
                    placeholder="Specify reason"
                    value={form.reasonOther}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, reasonOther: e.target.value }))
                    }
                  />
                )}
              </Field>

              {/* Urgent toggle — when ON we (a) require a rationale and
                  (b) tell the backend to add org admins to the approver pool
                  so the request can move even if the manager is unreachable. */}
              <Field label="Urgent">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="toggle toggle-sm toggle-error"
                    checked={form.isUrgent}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        isUrgent: e.target.checked,
                        // Clear the rationale when toggled off so we don't
                        // submit stale text.
                        urgentReason: e.target.checked ? f.urgentReason : "",
                      }))
                    }
                  />
                  <span className="text-xs text-base-content/70">
                    Mark this leave as urgent (notifies admins too)
                  </span>
                </label>
              </Field>

              {form.isUrgent && (
                <Field label="Why is this urgent?" required>
                  <textarea
                    className="textarea textarea-sm w-full bg-base-100 border border-base-300/70 focus:outline-none focus:border-primary/50"
                    rows={2}
                    placeholder="Briefly explain the urgency…"
                    value={form.urgentReason}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, urgentReason: e.target.value }))
                    }
                  />
                </Field>
              )}

              {supervisorOnLeave && (
                <div className="rounded-md border border-warning/40 bg-warning/10 p-2 space-y-1">
                  <p className="text-[11px] font-medium text-warning-content">
                    Your reporting manager is on approved leave during this
                    window.
                  </p>
                  <Field label="Why apply without your supervisor?" required>
                    <textarea
                      className="textarea textarea-sm w-full bg-base-100 border border-base-300/70 focus:outline-none focus:border-primary/50"
                      rows={2}
                      placeholder="Explain why this can't wait for them to be back…"
                      value={form.noSupervisorReason}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          noSupervisorReason: e.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>
              )}
            </div>

            <div className="space-y-1 pt-1">
              <button
                type="button"
                onClick={() => setHandoffOpen((o) => !o)}
                aria-expanded={handoffOpen}
                className="flex items-center justify-between w-full text-left font-semibold text-sm hover:text-primary transition-colors"
              >
                <span>Handoff deliverables</span>
                {handoffOpen ? (
                  <ChevronUpIcon size="sm" />
                ) : (
                  <ChevronDownIcon size="sm" />
                )}
              </button>
              <p className="text-xs text-base-content/60">
                Hand off your work so things keep moving while you&apos;re away.
              </p>

              {handoffOpen && (
                <div className="space-y-2 pt-1">
                  <Field label="Current deliverables">
                    <input
                      className="input input-sm w-full bg-base-100 border border-base-300/70 focus:outline-none focus:border-primary/50"
                      placeholder="What are you working on?"
                      value={form.deliverables}
                      onChange={(e) => {
                        setDeliverablesTouched(true);
                        setForm((f) => ({
                          ...f,
                          deliverables: e.target.value,
                        }));
                      }}
                    />
                    {todayPlanTasks.length > 0 && !deliverablesTouched && (
                      <span className="text-[11px] text-base-content/50 mt-1 inline-block">
                        Pre-filled from today&apos;s plan — edit as needed.
                      </span>
                    )}
                  </Field>

                  <Field label="Assign alternatives">
                    <input
                      className="input input-sm w-full bg-base-100 border border-base-300/70 focus:outline-none focus:border-primary/50"
                      placeholder="Who can handle your work?"
                      value={form.assignee}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, assignee: e.target.value }))
                      }
                    />
                  </Field>

                  <Field label="Additional notes">
                    <textarea
                      className="textarea textarea-sm w-full bg-base-100 border border-base-300/70 focus:outline-none focus:border-primary/50"
                      rows={2}
                      placeholder="Any additional information…"
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                    />
                  </Field>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

// The post-submit confirmation. The applied leave row comes back with
// `managerUsers` (the full snapshotted approver pool, hydrated to user
// records) so we can list every reviewer by name.
function SubmittedView({ leave }: { leave: LeaveRecord }) {
  const reviewers = useMemo(() => {
    const names: string[] = [];
    const seen = new Set<string>();
    const push = (name?: string | null, uid?: string | null) => {
      const key = uid ? String(uid) : (name || "").toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      if (name) names.push(name);
    };
    // Prefer managerUsers (full hydrated pool), fall back to requestedToUser
    // (legacy) and bare manager uids if nothing else is available.
    for (const mu of leave.managerUsers || []) {
      push(mu.fullname || mu.username, String(mu.uid));
    }
    if (names.length === 0 && leave.requestedToUser) {
      push(
        leave.requestedToUser.fullname || leave.requestedToUser.username,
        String(leave.requestedToUser.uid)
      );
    }
    if (names.length === 0 && leave.requestedTo) {
      push(`Manager #${leave.requestedTo}`, leave.requestedTo);
    }
    if (names.length === 0) {
      for (const m of leave.managers || []) {
        push(`Manager #${m}`, m);
      }
    }
    return names;
  }, [leave]);

  return (
    <div className="flex flex-col items-center text-center py-6 px-4 max-w-md mx-auto">
      <div className="w-14 h-14 rounded-full bg-success/15 text-success flex items-center justify-center mb-4 text-2xl">
        ✓
      </div>
      <h3 className="font-semibold text-base mb-2">
        Your leave request has been submitted
      </h3>
      {leave.isUrgent && (
        <span className="inline-flex items-center gap-1 mb-2 px-2 py-0.5 rounded text-[11px] font-semibold bg-error/15 text-error">
          URGENT
        </span>
      )}
      <p className="text-sm text-base-content/70 mb-4">
        {reviewers.length === 1 ? (
          <>
            It will be reviewed by{" "}
            <span className="font-medium text-base-content">{reviewers[0]}</span>.
            Stay tuned for the update.
          </>
        ) : reviewers.length > 1 ? (
          <>
            Any one of{" "}
            <span className="font-medium text-base-content">
              {reviewers.join(", ")}
            </span>{" "}
            can approve. You&apos;ll be notified as soon as a decision is made.
          </>
        ) : (
          <>Your reviewer will be notified shortly. Stay tuned for the update.</>
        )}
      </p>
      <div className="w-full text-left bg-base-200/60 rounded-lg p-3 text-xs space-y-1">
        <div className="flex justify-between gap-3">
          <span className="text-base-content/60">Dates</span>
          <span className="font-medium tabular-nums">
            {formatLeaveDate(leave.startDate, "DD MMM YYYY")}
            {leave.endDate && leave.endDate !== leave.startDate
              ? ` – ${formatLeaveDate(leave.endDate, "DD MMM YYYY")}`
              : ""}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-base-content/60">Days</span>
          <span className="font-medium tabular-nums">{formatLeaveDays(leave)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-base-content/60">Reason</span>
          <span className="font-medium">{leave.reason}</span>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="form-control">
      <label className="label py-1">
        <span className="label-text text-xs font-medium">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </span>
      </label>
      {children}
    </div>
  );
}


