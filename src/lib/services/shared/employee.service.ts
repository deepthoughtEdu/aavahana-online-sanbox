import { api, ApiResult } from "@/lib/api/client";
import type { ProgramMembership } from "@/types/shared/user.types";

export interface WorkingHours {
  from: string; // "HH:mm"
  to: string;   // "HH:mm"
}

export interface WorkingDays {
  /** ISO weekday: Mon=1 … Sun=7 */
  from: number;
  to: number;
}

export type InternshipType = "Internship" | "Contract" | "Full-Time Employee";
export type LeaveCurrency = "INR" | "USD";

/** Employee profile (Leaves Tracker) — every field optional until set. */
export interface EmployeeProfile {
  rolls?: string;
  internshipType?: InternshipType;
  joiningDate?: string;          // "YYYY-MM-DD"
  learningPeriodStartDate?: string;
  commitedHours?: 15 | 25 | 35 | 50;
  /**
   * The API normalizes this to { from, to } (or null). It is typed to admit a
   * string too because records written by the fellow-invite / employment-details
   * forms held free text ("3pm-7pm IST"), and a cached response can still carry
   * that. Always resolve it through `normalizeWorkDay` before doing time math —
   * reading `.from` off the string form is what took the leave page down.
   */
  workingHours?: WorkingHours | string | null;
  workingDays?: WorkingDays;
  honororium?: number;
  currency?: LeaveCurrency;
  accountNumber?: string;
  ifscCode?: string;
  upi?: string | null;
}

export interface EmployeeMeResponse extends EmployeeProfile {
  eid: number;
  email: string;
  joinedAt: number;
  leftAt: number | null;
  programs: ProgramMembership[];
  /** NodeBB uid of the reporting manager assigned during onboarding (org_introduction step). */
  managerId?: string | null;
}

/**
 * What the person may change about themselves.
 *
 * `joiningDate` and `honororium` are deliberately absent. Both are money —
 * payroll reads the honorarium as the monthly stipend, and the joining date
 * drives leave accrual — and both are owned by the `finance` org role after the
 * supervisor enters them at invite (Tarun, 2026-08-28). Sending either is
 * rejected by the API with `compensation-is-finance-owned`, not silently
 * dropped, so a stale client cannot leave someone believing a stipend change
 * was saved.
 */
export type UpdateProfilePayload = Omit<EmployeeProfile, "joiningDate" | "honororium">;

/** Which of the locked fields a person can query with Finance. */
export type CompensationField = "honororium" | "joiningDate";

export interface CompensationAccess {
  canEditCompensation: boolean;
}

export interface SetCompensationPayload {
  honororium?: number;
  joiningDate?: string;
  currency?: LeaveCurrency;
}

export class EmployeeService {
  static async getMe(): Promise<ApiResult<EmployeeMeResponse>> {
    return api.get<EmployeeMeResponse>(
      "/v3/pdgms/people/employees/me",
      undefined,
      { label: "Get Employee Me", toast: false },
    );
  }

  /** GET /v3/pdgms/people/employees/compensation-access — may I edit pay? */
  static async getCompensationAccess(): Promise<ApiResult<CompensationAccess>> {
    return api.get<CompensationAccess>(
      "/v3/pdgms/people/employees/compensation-access",
      undefined,
      { label: "Compensation Access", toast: false },
    );
  }

  /** PATCH /v3/pdgms/people/employees/:eid/compensation — finance only. */
  static async setCompensation(
    eid: number,
    payload: SetCompensationPayload,
  ): Promise<ApiResult<EmployeeMeResponse>> {
    return api.patch<EmployeeMeResponse>(
      `/v3/pdgms/people/employees/${eid}/compensation`,
      payload,
      { label: "Update Compensation" },
    );
  }

  /**
   * POST /v3/pdgms/people/employees/me/compensation-query
   * The locked fields' escape hatch: raise it with Finance rather than edit it.
   */
  static async raiseCompensationQuery(
    field: CompensationField,
    message: string,
  ): Promise<ApiResult<{ id: number }>> {
    return api.post<{ id: number }>(
      "/v3/pdgms/people/employees/me/compensation-query",
      { field, message },
      { label: "Raise Finance Query" },
    );
  }

  /** PATCH /v3/pdgms/people/employees/me/profile */
  static async updateMyProfile(
    payload: UpdateProfilePayload
  ): Promise<ApiResult<EmployeeMeResponse>> {
    return api.patch<EmployeeMeResponse>(
      "/v3/pdgms/people/employees/me/profile",
      payload,
      { label: "Update Profile" },
    );
  }
}
