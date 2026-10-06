"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import { userAtom } from "@/lib/store/auth";
import { Button } from "@/components/shared/Button";
import { Section } from "@/components/shared/Section";
import { AvatarImage } from "@/components/shared/AvatarImage";
import { EmptyState } from "@/components/shared/EmptyState";
import { UserIcon, ClockIcon, CalendarIcon } from "@/components/shared/icons";
import { normalizeWorkDay } from "@/utils/aavahana/leave.utils";
import {
  useCompensationAccess,
  useCompensationQuery,
  useEmployeeMe,
  useProfileMutations,
} from "@/lib/hooks/aavahana/use-profile";
import { Modal } from "@/components/shared/Modal";
import type {
  CompensationField,
  EmployeeProfile,
  InternshipType,
  LeaveCurrency,
  UpdateProfilePayload,
} from "@/lib/services/shared/employee.service";

const INTERNSHIP_TYPES: InternshipType[] = [
  "Internship",
  "Contract",
  "Full-Time Employee",
];

const COMMITTED_HOURS: Array<15 | 25 | 35 | 50> = [15, 25, 35, 50];

const CURRENCIES: LeaveCurrency[] = ["INR", "USD"];

const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

const WEEKDAY_BY_NUM: Record<number, string> = WEEKDAYS.reduce<
  Record<number, string>
>((acc, d) => ({ ...acc, [d.value]: d.label }), {});

interface FormState {
  rolls: string;
  internshipType: InternshipType | "";
  joiningDate: string;
  learningPeriodStartDate: string;
  commitedHours: 15 | 25 | 35 | 50 | "";
  workingHoursFrom: string;
  workingHoursTo: string;
  workingDaysFrom: number;
  workingDaysTo: number;
  honororium: string;
  currency: LeaveCurrency;
  accountNumber: string;
  ifscCode: string;
  upi: string;
}

const emptyForm: FormState = {
  rolls: "",
  internshipType: "",
  joiningDate: "",
  learningPeriodStartDate: "",
  commitedHours: "",
  workingHoursFrom: "11:00",
  workingHoursTo: "21:00",
  workingDaysFrom: 1,
  workingDaysTo: 5,
  honororium: "",
  currency: "INR",
  accountNumber: "",
  ifscCode: "",
  upi: "",
};

/**
 * A UPI number as people type it: the mobile number linked to their UPI
 * account, or the 8 or 9 digit UPI number they chose. Not a UPI ID such as
 * name@bank. Spaces, dashes and a leading +91 are dropped. Null when it is not
 * a UPI number. The backend applies the same rule.
 */
function normalizeUpiNumber(value: string): string | null {
  let digits = value.replace(/[\s-]/g, "");
  if (/^\+?91\d{10}$/.test(digits)) digits = digits.replace(/^\+?91/, "");
  return /^(\d{8,9}|[6-9]\d{9})$/.test(digits) ? digits : null;
}

function fromProfile(p?: EmployeeProfile): FormState {
  if (!p) return emptyForm;
  // workingHours has arrived as both { from, to } and free text ("3pm-7pm IST")
  // depending on which form last wrote it — resolve either into the pickers.
  const workDay = normalizeWorkDay(p.workingHours);
  return {
    rolls: p.rolls ?? "",
    internshipType: p.internshipType ?? "",
    joiningDate: p.joiningDate ?? "",
    learningPeriodStartDate: p.learningPeriodStartDate ?? "",
    commitedHours: (p.commitedHours as FormState["commitedHours"]) ?? "",
    workingHoursFrom: workDay.from,
    workingHoursTo: workDay.to,
    workingDaysFrom: p.workingDays?.from ?? 1,
    workingDaysTo: p.workingDays?.to ?? 5,
    honororium: p.honororium != null ? String(p.honororium) : "",
    currency: p.currency ?? "INR",
    accountNumber: p.accountNumber ?? "",
    ifscCode: p.ifscCode ?? "",
    upi: p.upi ?? "",
  };
}

// `joiningDate` and `honororium` are absent on purpose — the API rejects them
// here. See UpdateProfilePayload.
function toPayload(
  f: FormState,
  currentUpi?: EmployeeProfile["upi"],
): UpdateProfilePayload {
  const trimmedUpi = f.upi.trim();
  const normalizedUpi = trimmedUpi ? normalizeUpiNumber(f.upi) : null;
  return {
    rolls: f.rolls.trim() || undefined,
    internshipType: (f.internshipType || undefined) as
      | InternshipType
      | undefined,
    learningPeriodStartDate: f.learningPeriodStartDate || undefined,
    commitedHours: f.commitedHours === "" ? undefined : f.commitedHours,
    workingHours: { from: f.workingHoursFrom, to: f.workingHoursTo },
    workingDays: { from: f.workingDaysFrom, to: f.workingDaysTo },
    currency: f.currency,
    accountNumber: f.accountNumber.trim() || undefined,
    ifscCode: f.ifscCode.trim() || undefined,
    upi:
      trimmedUpi === ""
        ? null
        : normalizedUpi ?? (trimmedUpi === (currentUpi?.trim() ?? "") ? currentUpi : null),
  };
}

export function ProfileContainer() {
  const user = useAtomValue(userAtom);
  const { data: me, isLoading, error } = useEmployeeMe();
  const { updateProfile, isSaving } = useProfileMutations();

  const idPrefix = useId();
  const fid = (name: string) => `${idPrefix}-${name}`;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  // Pay and joining date are Finance-owned. Everyone else sees them, nobody
  // else edits them, and there is a route to disagree instead.
  const { canEditCompensation } = useCompensationAccess();
  const [query, setQuery] = useState<CompensationField | null>(null);

  const profile = useMemo<EmployeeProfile | undefined>(
    () => (me as EmployeeProfile | undefined) ?? undefined,
    [me],
  );
  const legacyUpiKept =
    !!form.upi.trim() &&
    normalizeUpiNumber(form.upi) === null &&
    form.upi.trim() === (profile?.upi?.trim() ?? "");
  const upiInvalid =
    !!form.upi.trim() &&
    normalizeUpiNumber(form.upi) === null &&
    !legacyUpiKept;

  useEffect(() => {
    if (profile) setForm(fromProfile(profile));
  }, [profile]);

  if (isLoading) {
    return (
      <Section variant="ghost">
        <Section.Body>
          <div
            role="status"
            className="text-center text-sm text-base-content/60"
          >
            Loading profile…
          </div>
        </Section.Body>
      </Section>
    );
  }

  if (error) {
    return (
      <Section variant="ghost">
        <Section.Body>
          <EmptyState
            variant="error"
            title="Couldn't load your profile"
            subtitle={error.message}
          />
        </Section.Body>
      </Section>
    );
  }

  const handleSave = async () => {
    if (upiInvalid) return;
    try {
      await updateProfile(toPayload(form, profile?.upi));
      setEditing(false);
    } catch {
      /* surfaced by api guard */
    }
  };

  const handleCancel = () => {
    if (profile) setForm(fromProfile(profile));
    setEditing(false);
  };

  const displayName = user?.fullname || user?.username || "—";
  const ro = !editing;
  // Two separate locks. `ro` is "am I in edit mode"; these two also require the
  // finance role, so being in edit mode never unlocks pay or tenure.
  const payRo = ro || !canEditCompensation;
  const joiningRo = ro || !canEditCompensation;

  const eid = me ? (me as { eid?: number }).eid : undefined;

  const editActions = editing ? (
    <>
      <Button
        size="sm"
        variant="ghost"
        color="secondary"
        onClick={handleCancel}
        disabled={isSaving}
      >
        Cancel
      </Button>
      <Button size="sm" color="primary" onClick={handleSave} loading={isSaving} disabled={upiInvalid}>
        Save changes
      </Button>
    </>
  ) : (
    <Button size="sm" color="primary" onClick={() => setEditing(true)}>
      Edit profile
    </Button>
  );

  // Quick-summary chips shown under the hero name. Read-only signal of the
  // most useful identity facts so the user doesn't have to scan four sections
  // just to confirm what they look like to the org.
  const heroChips = [
    form.rolls && { label: form.rolls, tone: "primary" as const },
    form.internshipType && {
      label: form.internshipType,
      tone: "neutral" as const,
    },
    form.commitedHours !== "" && {
      label: `${form.commitedHours} hrs / week`,
      tone: "neutral" as const,
    },
    form.workingHoursFrom &&
      form.workingHoursTo && {
        label: `${form.workingHoursFrom} → ${form.workingHoursTo}`,
        tone: "neutral" as const,
      },
  ].filter(Boolean) as { label: string; tone: "primary" | "neutral" }[];

  return (
    <div className="flex flex-col gap-4">
      {/* ── Hero identity card ─────────────────────────────────────────────
         Hero band carries everything the user already knows about themselves
         (avatar, name, EID, the chip summary) plus the global edit toggle.
         No scroll required to start editing. */}
      <Section>
        <Section.Body>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            {/* Initials avatar: src={null} skips the photo lookup so the
                AvatarImage fallback (getInitials) always renders — one letter
                for a single-word name, two letters for a two-word name. */}
            <AvatarImage src={null} name={displayName} size={88} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-lg truncate">{displayName}</p>
              <p className="text-xs text-base-content/60 mt-0.5">
                {eid != null ? `EID ${eid}` : "—"}
              </p>
              {heroChips.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {heroChips.map((c, i) => (
                    <span
                      key={`${c.label}-${i}`}
                      className={
                        c.tone === "primary"
                          ? "px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                          : "px-2 py-0.5 rounded-full text-xs font-medium bg-base-200 text-base-content/80"
                      }
                    >
                      {c.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 sm:self-start">
              {editActions}
            </div>
          </div>
        </Section.Body>
      </Section>

      {/* ── 2-column body — all sections live on one screen ─────────────────
         Identity + Working schedule fill the top row (most edited fields).
         Employment dates + Compensation share the bottom row. On mobile the
         grid collapses to a single column so nothing gets squished. */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Identity */}
        <Section>
          <Section.Header
            icon={<UserIcon size="sm" />}
            title="Identity"
            subtitle="How you appear in the org"
          />
          <Section.Body>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id={fid("rolls")} label="Role">
                <input
                  id={fid("rolls")}
                  type="text"
                  readOnly={ro}
                  aria-readonly={ro}
                  value={form.rolls}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, rolls: e.target.value }))
                  }
                  className={inputCls(ro)}
                  placeholder="e.g. Software Developer"
                />
              </Field>

              <Field id={fid("type")} label="Employment type">
                <select
                  id={fid("type")}
                  disabled={ro}
                  aria-readonly={ro}
                  value={form.internshipType}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      internshipType: e.target.value as InternshipType,
                    }))
                  }
                  className={inputCls(ro)}
                >
                  <option value="">—</option>
                  {INTERNSHIP_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>

              <Field id={fid("hours")} label="Committed hours / week">
                <select
                  id={fid("hours")}
                  disabled={ro}
                  aria-readonly={ro}
                  value={form.commitedHours}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      commitedHours:
                        e.target.value === ""
                          ? ""
                          : (Number(e.target.value) as 15 | 25 | 35 | 50),
                    }))
                  }
                  className={inputCls(ro)}
                >
                  <option value="">—</option>
                  {COMMITTED_HOURS.map((h) => (
                    <option key={h} value={h}>
                      {h} hrs/week
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Section.Body>
        </Section>

        {/* Working schedule */}
        <Section>
          <Section.Header
            icon={<ClockIcon size="sm" />}
            title="Working schedule"
            subtitle="Drives partial-day leave calculations"
          />
          <Section.Body>
            <div className="flex flex-col gap-5">
              <fieldset disabled={ro}>
                <legend className="text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-2">
                  Daily working hours
                </legend>
                <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                  <Field id={fid("wh-from")} label="From">
                    <input
                      id={fid("wh-from")}
                      type="time"
                      aria-readonly={ro}
                      value={form.workingHoursFrom}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          workingHoursFrom: e.target.value,
                        }))
                      }
                      className={inputCls(ro)}
                    />
                  </Field>
                  <span
                    aria-hidden="true"
                    className="text-base-content/40 pb-2"
                  >
                    →
                  </span>
                  <Field id={fid("wh-to")} label="To">
                    <input
                      id={fid("wh-to")}
                      type="time"
                      aria-readonly={ro}
                      value={form.workingHoursTo}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          workingHoursTo: e.target.value,
                        }))
                      }
                      className={inputCls(ro)}
                    />
                  </Field>
                </div>
              </fieldset>

              <fieldset disabled={ro}>
                <legend className="text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-2">
                  Working days
                </legend>
                {ro ? (
                  <p className="text-sm text-base-content/80">
                    {WEEKDAY_BY_NUM[form.workingDaysFrom] ?? "—"} →{" "}
                    {WEEKDAY_BY_NUM[form.workingDaysTo] ?? "—"}
                  </p>
                ) : (
                  <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                    <Field id={fid("wd-from")} label="From">
                      <select
                        id={fid("wd-from")}
                        value={form.workingDaysFrom}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            workingDaysFrom: Number(e.target.value),
                          }))
                        }
                        className={inputCls(false)}
                      >
                        {WEEKDAYS.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <span
                      aria-hidden="true"
                      className="text-base-content/40 pb-2"
                    >
                      →
                    </span>
                    <Field id={fid("wd-to")} label="To">
                      <select
                        id={fid("wd-to")}
                        value={form.workingDaysTo}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            workingDaysTo: Number(e.target.value),
                          }))
                        }
                        className={inputCls(false)}
                      >
                        {WEEKDAYS.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                )}
              </fieldset>
            </div>
          </Section.Body>
        </Section>

        {/* Employment dates */}
        <Section>
          <Section.Header
            icon={<CalendarIcon size="sm" />}
            title="Employment dates"
            subtitle="When you joined and your learning period"
          />
          <Section.Body>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id={fid("joined")} label="Joining date">
                <input
                  id={fid("joined")}
                  type="date"
                  readOnly={joiningRo}
                  aria-readonly={joiningRo}
                  value={form.joiningDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, joiningDate: e.target.value }))
                  }
                  className={inputCls(joiningRo)}
                />
                <FinanceOwnedNote
                  canEdit={canEditCompensation}
                  onRaise={() => setQuery("joiningDate")}
                  what="Your joining date decides how much leave you have accrued."
                />
              </Field>
              <Field id={fid("learn")} label="Learning period starting date">
                <input
                  id={fid("learn")}
                  type="date"
                  readOnly={ro}
                  aria-readonly={ro}
                  value={form.learningPeriodStartDate}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      learningPeriodStartDate: e.target.value,
                    }))
                  }
                  className={inputCls(ro)}
                />
              </Field>
            </div>
          </Section.Body>
        </Section>

        {/* Compensation & banking */}
        <Section>
          <Section.Header
            icon={<UserIcon size="sm" />}
            title="Compensation & banking"
            subtitle="Visible only to you and the org's admins"
          />
          <Section.Body>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id={fid("hon")} label="Honororium">
                <input
                  id={fid("hon")}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  readOnly={payRo}
                  aria-readonly={payRo}
                  value={form.honororium}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, honororium: e.target.value }))
                  }
                  className={inputCls(payRo)}
                  placeholder={form.honororium ? "0" : "Not set"}
                />
                <FinanceOwnedNote
                  canEdit={canEditCompensation}
                  onRaise={() => setQuery("honororium")}
                  what="This is what payroll pays you each month."
                />
              </Field>
              <Field id={fid("ccy")} label="Currency">
                <select
                  id={fid("ccy")}
                  disabled={ro}
                  aria-readonly={ro}
                  value={form.currency}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      currency: e.target.value as LeaveCurrency,
                    }))
                  }
                  className={inputCls(ro)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id={fid("acct")} label="Account number">
                <input
                  id={fid("acct")}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  readOnly={ro}
                  aria-readonly={ro}
                  value={form.accountNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, accountNumber: e.target.value }))
                  }
                  className={inputCls(ro)}
                />
              </Field>
              <Field id={fid("ifsc")} label="IFSC code">
                <input
                  id={fid("ifsc")}
                  type="text"
                  autoComplete="off"
                  readOnly={ro}
                  aria-readonly={ro}
                  value={form.ifscCode}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      ifscCode: e.target.value.toUpperCase(),
                    }))
                  }
                  className={inputCls(ro)}
                  placeholder="e.g. HDFC0001234"
                />
              </Field>
              <Field id={fid("upi")} label="UPI number (optional)">
                <input
                  id={fid("upi")}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  readOnly={ro}
                  aria-readonly={ro}
                  aria-invalid={editing && upiInvalid}
                  aria-describedby={fid("upi-help")}
                  value={form.upi}
                  onChange={(e) => setForm((f) => ({ ...f, upi: e.target.value }))}
                  className={inputCls(ro)}
                  placeholder="e.g. 9876543210"
                />
                <p id={fid("upi-help")} className={editing && upiInvalid ? "text-xs text-error" : "text-xs text-base-content/60"}>
                  {editing && upiInvalid
                    ? "Enter the 10-digit mobile number linked to your UPI, or your 8 or 9 digit UPI number, or leave it blank."
                    : "The mobile number linked to your UPI, or your UPI number. Included in the payroll dashboard and CSV export."}
                </p>
              </Field>
            </div>
          </Section.Body>
          {editing && <Section.Footer>{editActions}</Section.Footer>}
        </Section>
      </div>

      {query && (
        <CompensationQueryModal
          field={query}
          currentValue={query === "honororium" ? form.honororium : form.joiningDate}
          onClose={() => setQuery(null)}
        />
      )}
    </div>
  );
}

// ─── Field primitives ──────────────────────────────────────────────────────

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-xs font-semibold text-base-content/80"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function inputCls(readOnly: boolean): string {
  return [
    "w-full rounded-md px-3 py-2 text-sm",
    "border border-base-300/70",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
    readOnly
      ? "bg-base-200/40 text-base-content cursor-default"
      : "bg-base-100 focus:border-primary/50",
  ].join(" ");
}

/**
 * The note under a field the person can see but not change.
 *
 * Locking a number without saying who owns it, or giving a route to question
 * it, just moves the argument to WhatsApp. Finance-role holders get no note —
 * for them the field is simply editable.
 */
function FinanceOwnedNote({
  canEdit,
  onRaise,
  what,
}: {
  canEdit: boolean;
  onRaise: () => void;
  what: string;
}) {
  if (canEdit) return null;
  return (
    <p className="text-[11px] leading-relaxed text-base-content/60">
      {what} Finance keeps this field.{" "}
      <button
        type="button"
        onClick={onRaise}
        className="underline underline-offset-2 hover:text-base-content"
      >
        Raise it with them
      </button>
    </p>
  );
}

const QUERY_LABEL: Record<CompensationField, string> = {
  honororium: "monthly stipend",
  joiningDate: "joining date",
};

/** Raises a ticket to Finance carrying the field and what the record says. */
function CompensationQueryModal({
  field,
  currentValue,
  onClose,
}: {
  field: CompensationField;
  currentValue: string;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const { raiseQuery, isRaising } = useCompensationQuery();

  const submit = async () => {
    if (!message.trim()) return;
    try {
      await raiseQuery({ field, message: message.trim() });
      onClose();
    } catch {
      /* surfaced by the api guard */
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Query your ${QUERY_LABEL[field]}`}
      subtitle="This goes to Finance as a ticket. They can see what the record says."
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button size="sm" variant="soft" color="secondary" onClick={onClose} disabled={isRaising}>
            Cancel
          </Button>
          <Button
            size="sm"
            color="primary"
            onClick={submit}
            loading={isRaising}
            disabled={!message.trim()}
          >
            Send to Finance
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="rounded-md bg-base-200/50 px-3 py-2 text-xs">
          <span className="text-base-content/60">Recorded {QUERY_LABEL[field]}: </span>
          <span className="font-medium">{currentValue || "not set"}</span>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-base-content/80">
            What should it be, and why?
          </span>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. My offer letter says 12000 from 1 August."
            className="w-full rounded-md border border-base-300/70 bg-base-100 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </label>
      </div>
    </Modal>
  );
}
