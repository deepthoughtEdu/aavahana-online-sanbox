// src/types/trinethra/daily-reports.types.ts
// Daily Reports Export (Trinethra) — org-wide browse + CSV download of V7
// daily reports for managers/admins.
//
// Response shapes are owned by the backend (R19): they mirror
// pdgmsnewdb/src/pdgms/loops/daily-reports-export.js (serializeRow /
// listPeople). Do not change field names here without a pendingsync row.
//
// NOTE: names are namespaced "DailyReportExport*" / "DailyReportPerson" —
// `DailyReport` is already taken by trinethra/supervisor.types.

import type { BackendPaginatedResponse } from "@/types/shared/api.types";

/** One person row from GET /v3/pdgms/loops/daily-reports/people */
export interface DailyReportPerson {
  /** NodeBB uid (string) — null when the employee hash is gone. */
  uid: string | null;
  eid: number;
  fullname: string;
  workEmail: string | null;
  status: "active" | "alumni";
  /** All report rows (drafts + submitted) in the range. */
  totalEntries: number;
  /** Submitted reports only — shown as the count badge. */
  totalReports: number;
}

export interface DailyReportPeopleResponse {
  items: DailyReportPerson[];
  total: number;
  /** Resolved range, YYYY-MM-DD (echoed by the backend). */
  from: string;
  to: string;
}

/**
 * One row from GET /v3/pdgms/loops/daily-reports.
 * Flat + pre-formatted server-side (same keys feed the CSV columns):
 * plan/unplanned/reflections/suggestions are newline-joined strings,
 * rubricTotal is "N/M", readable* are IST-formatted timestamps.
 */
export interface DailyReportExportRow {
  reportId: string;
  uid: string | null;
  eid: number;
  fullname: string;
  workEmail: string | null;
  /** YYYY-MM-DD */
  date: string;
  status: "draft" | "submitted";
  plan: string;
  unplanned: string;
  constraint: string;
  navigation: string;
  framework: string;
  feeling: string;
  narrative: string;
  smoothDayNote: string;
  aiStatus: string;
  rubricTotal: string;
  reflections: string;
  suggestions: string;
  /** Minutes spent in the report flow — "" when not tracked. */
  durationMins: number | "";
  /** ISO datetimes — "" when absent (e.g. drafts have no submittedAt). */
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  readableSubmittedAt: string;
  readableCreatedAt: string;
  readableUpdatedAt: string;
}

export type DailyReportListResponse =
  BackendPaginatedResponse<DailyReportExportRow> & { from: string; to: string };

/** Page-level filter state for the export screen. */
export interface DailyReportFilters {
  /** YYYY-MM — defaults to the current month. */
  month: string;
  /** Selected eids; empty = everyone. */
  eids: number[];
  /** Name/email search. */
  search: string;
  /** Only rows with a submitted report (legacy "reports only"). */
  submittedOnly: boolean;
}

/** Flat query params for DataTable / the list endpoint. */
export interface DailyReportQuery {
  month: string;
  /** Comma-joined eids — omitted when everyone is selected. */
  eids?: string;
  search?: string;
  submittedOnly?: boolean;
  [key: string]: string | number | boolean | undefined;
}
