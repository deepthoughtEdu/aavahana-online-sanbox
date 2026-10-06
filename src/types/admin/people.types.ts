export type EmployeeStatus = "active" | "alumni" | "removed";

export interface PeopleEmployee {
  uid: string;
  eid: number;
  fullname: string;
  workEmail: string | null;
  type: string;
  departmentId: string | null;
  joinedAt: number | null;
  leftAt: number | null;
  status: EmployeeStatus;
  isSupervisor: boolean;
  supervisorEid: number | null;
  title: string | null;
}

export interface PeopleCounts {
  all: number;
  active: number;
  alumni: number;
  removed: number;
}

export interface PeopleListResponse {
  items: PeopleEmployee[];
  total: number;
  page: number;
  perPage: number;
  counts?: PeopleCounts;
}

export interface PeopleListParams {
  status?: "all" | "active" | "alumni" | "removed";
  search?: string;
  page?: number;
  perPage?: number;
  [key: string]: unknown;
}
