import { User } from "./user.types";

export interface Membership {
  membershipId: string;
  type: string;
  status: "active" | "inactive";
  joinedAt: number;
  department: string | null;
  role: string | null;
}

export interface OrganizationPrivileges {
  isMember: boolean;
  isManager: boolean;
  isLeader: boolean;
  isAdmin: boolean;
  isTicketAgent: boolean;
  isTicketAdmin: boolean;
  departments: string[];
}

export interface Organization {
  about: string;
  emails: string[];
  employeeRange: string;
  images: Record<string, unknown>;
  lastmodified: number;
  lastmodifiedBy: string;
  leaders: string[];
  locations: string[];
  name: string;
  orgId: string;
  phoneNumbers: string[];
  sector: string;
  socialLinks: string[];
  state: "active" | "inactive";
  timestamp: number;
  website: string;
  deparments: Department[];
  memberships: Membership[];
  privileges: OrganizationPrivileges;
}
//@typescript-eslint/no-empty-object-type
export interface Member extends User {
  timestamp: string;
}

export interface DepartmentRole {
  name: string;
  description?: string;
}

export interface Department {
  _id: string;
  uid: string;
  name: string;
  description?: string;
  role?: DepartmentRole;
}
