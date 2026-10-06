import { Membership, Organization } from "@/types";

export interface Employment {
  orgId: string;
  eid: number;
}

export interface ProgramMembership {
  id: string;
  name: string;
  slug: string;
}

export enum UserRole {
  ALL = "all",
  ADMIN = "admin",
  MANAGER = "manager",
  USER = "user",
  MEMBER = "member",
  TICKET_AGENT = "ticket_agent",
  TICKET_ADMIN = "ticket_admin",
}

export interface User {
  uid: number;
  username: string;
  userslug: string;
  email: string;
  displayname: string;
  "email:confirmed": number;
  picture: string | null;
  fullname: string | null;
  birthday: string | null;
  "icon:bgColor"?: string;
  status: string;
  reputation: number;
  postcount: number;
  topiccount: number;
  joindate: number;
  lastonline: number;
  isAdministrator: boolean;
  organizations: Organization[];
  eid: number | null;
  employments: Employment[];
  [key: string]: unknown;
  membership: Membership;
}

export interface AuthState {
  user: User | null;
  selectedOrgId: string | null;
  selectedDeptId: string | null;
  selectedProgramId: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}
