import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type { AdminProgram, CreateProgramPayload, AddMemberPayload, ProgramMemberResult } from "@/types/admin";

const BASE = "/v3/pdgms";

export class AdminProgramService {
  static async list(params?: { type?: string; status?: string; page?: number; perPage?: number }): Promise<ApiResult<{ items: AdminProgram[]; total: number }>> {
    return api.get<{ items: AdminProgram[]; total: number }>(`${BASE}/program/programs`, params);
  }
  static async get(id: string): Promise<ApiResult<AdminProgram>> {
    return api.get<AdminProgram>(`${BASE}/program/programs/${id}`);
  }
  static async create(payload: CreateProgramPayload): Promise<ApiResult<AdminProgram>> {
    return api.post<AdminProgram>(`${BASE}/program/programs`, payload);
  }
  static async update(id: string, payload: Partial<CreateProgramPayload>): Promise<ApiResult<AdminProgram>> {
    return api.put<AdminProgram>(`${BASE}/program/programs/${id}`, payload);
  }
  static async transitionStatus(id: string, status: string): Promise<ApiResult<AdminProgram>> {
    return api.patch<AdminProgram>(`${BASE}/program/programs/${id}/status`, { status });
  }
  static async addMember(programId: string, payload: AddMemberPayload): Promise<ApiResult<ProgramMemberResult>> {
    return api.post<ProgramMemberResult>(`${BASE}/program/programs/${programId}/members`, payload);
  }
}
