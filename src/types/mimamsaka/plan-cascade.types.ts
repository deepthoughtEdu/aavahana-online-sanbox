export type BasketItemSource = "micromap" | "weeklyPlan" | "monthlyPlan" | "eventLoop" | "l2Created" | "selfCreated";
export type BasketItemStatus = "available" | "picked" | "completed" | "deferred" | "removed";

export interface BasketItem {
  id:           string;
  eid:          number;
  programId:    string;
  source:       BasketItemSource;
  sourceRefId:  string;
  label:        string;
  quantity:     number;
  description?: string;
  targetDate?:  string;
  status:       BasketItemStatus;
  pickedAt?:    string;
  completedAt?: string;
  deferredTo?:  string;
  createdAt:    string;
}

export interface WeeklyBasket {
  eid:             number;
  programId:       string;
  weekId:          string;
  fromMonthlyPlan: BasketItem[];
  fromEventLoop:   BasketItem[];
  selfAdded:       BasketItem[];
  l2Added:         BasketItem[];
}

export interface DailyBasket {
  eid:            number;
  programId:      string;
  date:           string;
  fromWeeklyPlan: BasketItem[];
  fromEventLoop:  BasketItem[];
  selfAdded:      BasketItem[];
  l2Added:        BasketItem[];
  picked:         BasketItem[];
}

export interface CascadeOverview {
  programId:          string;
  sprintId:           string | null;
  micromapTaskCount:  number;
  ticketCount:        number;
  weeklyPickRate:     number;
  dailyPickRate:      number;
  completionRate:     number;
  byEmployee?: {
    eid:            number;
    employeeName:   string;
    basketSize:     number;
    picked:         number;
    completed:      number;
    deferred:       number;
    pickRate:       number;
    completionRate: number;
  }[];
}

export interface AddToBasketPayload {
  eid:          number;
  programId:    string;
  label:        string;
  quantity:     number;
  description?: string;
  targetDate?:  string;
  source:       "selfCreated" | "l2Created";
}

export interface UpdateBasketItemPayload {
  status:      BasketItemStatus;
  deferredTo?: string;
}
