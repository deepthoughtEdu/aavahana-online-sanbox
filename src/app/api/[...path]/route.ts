import { NextRequest, NextResponse } from "next/server";

const demoUser = {
  uid: 1,
  username: "demo.fellow",
  userslug: "demo-fellow",
  email: "demo@example.invalid",
  displayname: "Demo Fellow",
  fullname: "Demo Fellow",
  picture: null,
  birthday: null,
  "email:confirmed": 1,
  status: "online",
  reputation: 0,
  postcount: 0,
  topiccount: 0,
  joindate: 0,
  lastonline: 0,
  isAdministrator: false,
  eid: 1,
  employments: [{ orgId: "sandbox", eid: 1 }],
  membership: { membershipId: "sandbox", type: "member", status: "active", joinedAt: 0, department: null, role: "member" },
  organizations: [{
    orgId: "sandbox", name: "Sandbox Organisation", state: "active",
    privileges: { isMember: true, isManager: false, isLeader: false, isAdmin: false, isTicketAgent: false, isTicketAdmin: false, departments: [] },
  }],
};

function respond(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/api/auth/session") return NextResponse.json({ response: { user: demoUser } });
  if (path === "/api/config") return NextResponse.json({ csrf_token: "sandbox" });
  if (path === "/api/v3/pdgms/people/employees/me") {
    return NextResponse.json({ response: { eid: 1, email: demoUser.email, joinedAt: 0, leftAt: null, programs: [] } });
  }
  if (path === "/api/v3/pdgms/crm/calling-targets/me") {
    return NextResponse.json({ response: { programs: [] } });
  }
  return NextResponse.json({ error: "No mock data is configured for this production endpoint.", path }, { status: 501 });
}

export const GET = respond;
export const POST = respond;
export const PUT = respond;
export const PATCH = respond;
export const DELETE = respond;
