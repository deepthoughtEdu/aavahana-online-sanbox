// src/types/aavahana/holiday.types.ts
// Types for the Aavahana → Leaves → Holidays calendar.
// Mirrors the Prisma `Holiday` model in pdgmsnewdb/prisma/schema.prisma.

export type HolidayType = "public" | "optional" | "restricted";

export interface HolidayRecord {
  id: number;
  orgId: string;
  date: string;            // ISO date (YYYY-MM-DD or full ISO from server)
  year: number;
  name: string;
  description: string | null;
  type: HolidayType;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateHolidayPayload {
  date: string;            // "YYYY-MM-DD"
  name: string;
  type?: HolidayType;
  description?: string;
}

export interface UpdateHolidayPayload {
  date?: string;
  name?: string;
  type?: HolidayType;
  description?: string | null;
}

export interface ListHolidaysParams {
  year?: number;
  page?: number;
  perPage?: number;
  [key: string]: unknown;
}

export interface PaginatedHolidays {
  items: HolidayRecord[];
  total: number;
  page: number;
  perPage: number;
}
