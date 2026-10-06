import { NextRequest, NextResponse } from "next/server";
import type { DailyTask } from "@/types/aavahana/plan.types";

const dailyPlans = new Map<string, DailyTask[]>();

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

async function respond(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/api/auth/session") return NextResponse.json({ response: { user: demoUser } });
  if (path === "/api/config") return NextResponse.json({ csrf_token: "sandbox" });
  if (path === "/api/v3/pdgms/people/employees/me") {
    return NextResponse.json({ response: { eid: 1, email: demoUser.email, joinedAt: 0, leftAt: null, programs: [] } });
  }
  if (path === "/api/v3/pdgms/crm/calling-targets/me") {
    return NextResponse.json({ response: { programs: [] } });
  }
  if (path === "/api/v3/pdgms/loops/daily-plan/incomplete") {
    return NextResponse.json({ response: [] });
  }
  if (path === "/api/v3/pdgms/loops/daily-plan/submit" && request.method === "POST") {
    const payload = await request.json() as { plan?: DailyTask[] };
    const date = request.nextUrl.searchParams.get("date");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Array.isArray(payload.plan)) {
      return NextResponse.json({ error: "A dated plan array is required." }, { status: 400 });
    }
    dailyPlans.set(date, payload.plan);
    return NextResponse.json({ response: { message: "Daily plan saved in the sandbox", success: true, insight: null } });
  }
  const dailyPlanMatch = path.match(/^\/api\/v3\/pdgms\/loops\/daily-plan\/(\d{4}-\d{2}-\d{2})$/);
  if (dailyPlanMatch && request.method === "GET") {
    return NextResponse.json({ response: { plan: dailyPlans.get(dailyPlanMatch[1]) ?? [] } });
  }
  const dailyBasketMatch = path.match(/^\/api\/v3\/pdgms\/grammar\/employees\/me\/basket\/daily\/(\d{4}-\d{2}-\d{2})$/);
  if (dailyBasketMatch && request.method === "GET") {
    return NextResponse.json({ response: {
      eid: 1, programId: "sandbox", date: dailyBasketMatch[1],
      fromWeeklyPlan: [], fromEventLoop: [], selfAdded: [], l2Added: [], picked: [],
    } });
  }
  if (path === "/api/v3/pdgms/loops/daily-report/v7/draft") {
    return NextResponse.json({ response: null });
  }
  if (path === "/api/v3/pdgms/loops/daily-report/v7/streak") {
    return NextResponse.json({ response: { currentStreak: 0, submittedDays: 0, growthScore: 0 } });
  }
  return NextResponse.json({ error: "No mock data is configured for this production endpoint.", path }, { status: 501 });
}

export const GET = respond;
export const POST = respond;
export const PUT = respond;
export const PATCH = respond;
export const DELETE = respond;
