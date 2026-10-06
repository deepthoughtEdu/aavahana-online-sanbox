import { api } from '@/lib/api/client';
import type { ApiResult } from '@/lib/api/client';
import type { MonthlyBasketItem } from '@/types/aavahana/pdgms.types';
import type { DailyBasket, UpdateBasketItemPayload } from '@/types/mimamsaka/plan-cascade.types';

interface EmployeeWeeklyBasket {
  basketItems: unknown[];
  fromMonthlyPlan: MonthlyBasketItem[];
}

export class CascadeService {
  static async getWeeklyBasket(weekId: string): Promise<ApiResult<EmployeeWeeklyBasket>> {
    return api.get<EmployeeWeeklyBasket>(`/v3/pdgms/grammar/employees/me/basket/weekly/${weekId}`);
  }

  static async getDailyBasket(date: string): Promise<ApiResult<DailyBasket>> {
    return api.get<DailyBasket>(`/v3/pdgms/grammar/employees/me/basket/daily/${date}`);
  }

  static async updateBasketItem(
    itemId: string,
    payload: UpdateBasketItemPayload,
  ): Promise<ApiResult<{ success: boolean }>> {
    return api.patch(`/v3/pdgms/grammar/basket/${itemId}`, payload);
  }

  static async addBasketItem(payload: {
    label: string;
    quantity: number;
    source: 'selfCreated';
    targetDate: string;
  }): Promise<ApiResult<{ id: string }>> {
    return api.post('/v3/pdgms/grammar/basket', payload);
  }

  static async deleteBasketItem(itemId: string): Promise<ApiResult<{ success: boolean }>> {
    return api.delete(`/v3/pdgms/grammar/basket/${itemId}`);
  }
}
