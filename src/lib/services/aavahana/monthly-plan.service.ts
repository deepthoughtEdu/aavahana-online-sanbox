import { api, isError } from '@/lib/api/client';
import type { ApiResult } from '@/lib/api/client';
import type {
  MonthlyPlanData,
  MonthlyPlanDeliverable,
  CreateMonthlyPlanPayload,
  UpdateMonthlyPlanPayload,
  ProgramKPI,
  RecurringEvent,
  IpItemOption,
} from '@/types/aavahana/monthly-plan.types';
import type { MonthlyBasketItem } from '@/types';
import { normalizeMonthlyPlan, normalizeProgramKpis } from '@/lib/adapters/aavahana-route.adapters';

export class MonthlyPlanService {
  static async getCurrentPlan(month: string): Promise<ApiResult<MonthlyPlanData | null>> {
    const result = await api.get<unknown>('/v3/pdgms/loops/plans/current', { cadence: 'monthly', periodStart: month });
    if (isError(result)) return result;
    return normalizeMonthlyPlan(result);
  }

  static async createPlan(payload: CreateMonthlyPlanPayload): Promise<ApiResult<MonthlyPlanData>> {
    return api.post<MonthlyPlanData>('/v3/pdgms/loops/plans', { ...payload, cadence: 'monthly' });
  }

  static async updatePlan(planId: string, payload: UpdateMonthlyPlanPayload): Promise<ApiResult<MonthlyPlanData>> {
    return api.patch<MonthlyPlanData>(`/v3/pdgms/loops/plans/${planId}`, payload);
  }

  static async submitPlan(planId: string): Promise<ApiResult<{ success: boolean }>> {
    return api.post(`/v3/pdgms/loops/plans/${planId}/submit`, {});
  }

  static async getBasket(month: string): Promise<ApiResult<MonthlyBasketItem[]>> {
    return api.get<MonthlyBasketItem[]>('/v3/pdgms/loops/plans/basket', { cadence: 'monthly', month });
  }

  static async getCarryovers(month: string): Promise<ApiResult<MonthlyPlanDeliverable[]>> {
    return api.get<MonthlyPlanDeliverable[]>('/v3/pdgms/loops/plans/carryovers', { month });
  }

  /**
   * The route returns the canonical A67 KPI shape; the planner reads
   * `ProgramKPI`. `normalizeProgramKpis` bridges the two field vocabularies and
   * leaves the pagination envelope intact for `useApi` to unwrap.
   */
  static async getProgramKPIs(programId: string): Promise<ApiResult<ProgramKPI[]>> {
    const result = await api.get<unknown>(`/v3/pdgms/programs/${programId}/kpis`);
    if (isError(result)) return result;
    return normalizeProgramKpis(result) as ProgramKPI[];
  }

  /**
   * IP items available to pick as a monthly IP goal. The spec binds this axis to
   * the label registry ("no free text for label fields") — a goal has to point at
   * a real IpItem or the server cannot compute its maturity from commit counts.
   */
  static async getIpItems(): Promise<ApiResult<IpItemOption[]>> {
    return api.get<IpItemOption[]>('/v3/pdgms/loops/ip/items');
  }

  static async getRecurringEvents(planId: string): Promise<ApiResult<RecurringEvent[]>> {
    return api.get<RecurringEvent[]>(`/v3/pdgms/loops/plans/${planId}/recurring-events`);
  }

  static async createRecurringEvent(
    planId: string,
    event: Omit<RecurringEvent, 'id' | 'isActive'>
  ): Promise<ApiResult<RecurringEvent>> {
    return api.post<RecurringEvent>(`/v3/pdgms/loops/plans/${planId}/recurring-events`, event);
  }

  static async updateRecurringEvent(
    planId: string,
    eventId: string,
    updates: Partial<RecurringEvent>
  ): Promise<ApiResult<RecurringEvent>> {
    return api.patch<RecurringEvent>(`/v3/pdgms/loops/plans/${planId}/recurring-events/${eventId}`, updates);
  }

  static async deleteRecurringEvent(planId: string, eventId: string): Promise<ApiResult<{ success: boolean }>> {
    return api.delete(`/v3/pdgms/loops/plans/${planId}/recurring-events/${eventId}`);
  }
}
