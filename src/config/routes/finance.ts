/**
 * Finance module routes (TKT-005, U1 + U6).
 *
 * `/finance` is the contract book and `/finance/[contractId]` is one contract.
 * `/finance/clients` is WHO IS ACTIVE (U6), and `/finance/access` is who may open the
 * module at all (U6, AC-27).
 *
 * Registration matters: ROUTE_CONFIG_MAP is auto-extracted by walking ROUTES, so a path
 * that is not here gets NO org check from AuthProvider.
 *
 * ⚠️ `/finance/clients` and `/finance/access` are STATIC segments sitting beside the
 * dynamic `[contractId]`. Both Next's router and `getRouteConfig` resolve an exact match
 * before trying the dynamic pattern, so neither is ever read as a contract id. Registering
 * them is what makes that true for the org check as well as for the page.
 *
 * ⚠️ The ROLE gate is NOT here and cannot be. The live pattern for a module gate is a
 * LAYOUT — `src/app/finance/layout.tsx`, which reads the named `finance` org role. And
 * even that only hides the page: the DATA is protected by `requireFinance(caller)` in the
 * backend's api layer, because ⟐ nothing in its request pipeline enforces a named role.
 */
export const financeRoutes = {
  contracts: {
    _: "/finance",
    _config: { title: "Contracts", requiresOrg: true },
    _param: "contractId",
    _paramPath: "/finance/[contractId]",
    _paramConfig: { title: "Contract", requiresOrg: true },
  },
  clients: {
    _: "/finance/clients",
    _config: { title: "Clients", requiresOrg: true },
  },
  access: {
    _: "/finance/access",
    _config: { title: "Finance access", requiresOrg: true },
  },
  // U7 — what the cron did last night. Automated work is invisible work: the proformas
  // raise at 09:00 IST and the chase goes out at 10:00 IST with nobody logged in, and a
  // sweep that failed looks exactly like a sweep that never ran. Also a STATIC segment
  // beside `[contractId]`, resolved before the dynamic pattern.
  ops: {
    _: "/finance/ops",
    _config: { title: "Finance ops", requiresOrg: true },
  },
} as const;
