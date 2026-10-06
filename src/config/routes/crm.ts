export const crmRoutes = {
  home: {
    _: "/crm",
    _config: { title: "CRM", requiresOrg: true },
  },

  contacts: {
    _: "/crm/contacts",
    _config: { title: "Contacts", requiresOrg: true },
    _param: "contactId",
    _paramPath: "/crm/contacts/[contactId]",
    _paramConfig: { title: "Contact Details", requiresOrg: true },
  },

  // ── Company Directory + Company Record (Phase A) ───────────────────────
  // The org-level account list + record. Moved out of /crm/outreach to
  // top-level /crm/companies at swap time (Phase J), replacing the legacy
  // companies surface that used to live here.
  outreachCompanies: {
    _: "/crm/companies",
    _config: { title: "Company Directory", requiresOrg: true },
    _param: "companyId",
    _paramPath: "/crm/companies/[companyId]",
    _paramConfig: { title: "Company Record", requiresOrg: true },
  },

  // ── Spotlights studio (Phase B) ──────────────────────────────────────────
  // Production workbench for Lens × Company generated pages; the public share
  // link itself lives at /p/s/[slug] (publisher namespace, outside ROUTES).
  outreachSpotlights: {
    _: "/crm/spotlights",
    _config: { title: "Spotlights", requiresOrg: true },
  },

  // ── What Works ───────────────────────────────────────────────────────────
  // Call findings for the whole team plus a page per caller. Top level rather
  // than nested under Outreach > Recordings: it is meant to be read before a
  // call, not hunted for. Open to every org member, not admin-gated.
  crmWhatWorks: {
    _: "/crm/what-works",
    _config: { title: "What Works", requiresOrg: true },
  },

  // ── Outreach: Meeting Pipeline (Phase C) ─────────────────────────────────
  // System name Meeting Pipeline; UI label "Meeting Calendar" (was "Warm Room" until
  // 2026-09-12). Ready-to-attend flow: meeting_ready → invite_sent → meeting_scheduled.
  outreachMeetingPipeline: {
    _: "/crm/outreach/meeting-pipeline",
    _config: { title: "Meeting Calendar", requiresOrg: true },
  },

  // ── Scoring overview (Phase I, spec §17.2) ───────────────────────────────
  // Org-wide nodal scoring completeness: companies × per-group scored/total.
  outreachScoring: {
    _: "/crm/scoring",
    _config: { title: "Scoring", requiresOrg: true },
  },

  // ── Customers (Phase E) ──────────────────────────────────────────────────
  // Won-companies surface: won deals + derived Closing Call + Win Story marker.
  outreachCustomers: {
    _: "/crm/customers",
    _config: { title: "Customers", requiresOrg: true },
  },

  // The supply side of the demand/capability bridge: what this plant can make, and what
  // it must refuse. Distinct from Offerings, which is what you sell.
  capabilities: {
    _: "/crm/capabilities",
    _config: { title: "Plant Capabilities", requiresOrg: true },
  },

  // The bridge: one requirement, the capabilities that serve it, the candidate options.
  applications: {
    _: "/crm/applications",
    _config: { title: "Applications", requiresOrg: true },
    _param: "applicationId",
    _paramPath: "/crm/applications/[applicationId]",
    _paramConfig: { title: "Application", requiresOrg: true },
  },

  // Steps 6 and 7 — hung off the application because that is the thing the funnel walks.
  // A spec belongs to an application and a sample belongs to a spec, so both screens resolve
  // "the latest one" rather than making the rep carry a spec id around.
  applicationSpec: {
    _: "/crm/applications/[applicationId]/spec",
    _config: { title: "Spec to plant", requiresOrg: true },
    _param: "applicationId",
    _paramPath: "/crm/applications/[applicationId]/spec",
    _paramConfig: { title: "Spec to plant", requiresOrg: true },
  },

  applicationSample: {
    _: "/crm/applications/[applicationId]/sample",
    _config: { title: "Sample and feedback", requiresOrg: true },
    _param: "applicationId",
    _paramPath: "/crm/applications/[applicationId]/sample",
    _paramConfig: { title: "Sample and feedback", requiresOrg: true },
  },

  // Step 3 — the questions derived from demand x capability.
  dealRequirements: {
    _: "/crm/deals/[dealId]/requirements",
    _config: { title: "Requirements", requiresOrg: true },
    _param: "dealId",
    _paramPath: "/crm/deals/[dealId]/requirements",
    _paramConfig: { title: "Requirements", requiresOrg: true },
  },

  // Steps 1-2 — who opened the report we sent, and who is ready to be asked for a meeting.
  // ⚠️ NOT under /crm/outreach: that path is the dialler operation (agents, allocation, call
  // logs) and has nothing to do with this. Same word, different product.
  engagement: {
    _: "/crm/engagement",
    _config: { title: "Engagement", requiresOrg: true },
  },

  // "What do I do now" across every live pursuit.
  flow: {
    _: "/crm/flow",
    _config: { title: "The Flow", requiresOrg: true },
  },

  deals: {
    _: "/crm/deals",
    _config: { title: "Sales Pipeline", requiresOrg: true },
    _param: "dealId",
    _paramPath: "/crm/deals/[dealId]",
    _paramConfig: { title: "Deal Details", requiresOrg: true },
  },

  funnels: {
    _: "/crm/funnels",
    _config: { title: "Funnels", requiresOrg: true },
    _param: "funnelId",
    _paramPath: "/crm/funnels/[funnelId]",
    _paramConfig: { title: "Funnel Builder", requiresOrg: true },
  },

  board: {
    _: "/crm/board",
    _config: { title: "Funnel Board", requiresOrg: true },
  },

  accountWorkspace: {
    _: "/crm/accounts",
    _config: { title: "Accounts", requiresOrg: true },
    _param: "companyId",
    _paramPath: "/crm/accounts/[companyId]/workspace",
    _paramConfig: { title: "Account Workspace", requiresOrg: true },
  },

  movementReconciliation: {
    _: "/crm/outreach/movement-reconciliation",
    _config: { title: "Movement Reconciliation", requiresOrg: true },
  },

  outreachDuplicates: {
    _: "/crm/outreach/duplicates",
    _config: { title: "Duplicate Deals", requiresOrg: true },
  },

  market: {
    _: "/crm/market",
    _config: { title: "Market Research", requiresOrg: true },
  },

  targets: {
    _: "/crm/targets",
    _config: { title: "Sourcing Targets", requiresOrg: true },
  },

  gen: {
    _: "/crm/gen",
    _config: { title: "Generation", requiresOrg: true },
  },

  genExperiments: {
    _: "/crm/gen/experiments",
    _config: { title: "HVT Arms", requiresOrg: true },
  },

  signals: {
    _: "/crm/signals",
    _config: { title: "Signals & Watches", requiresOrg: true },
  },

  package: {
    _: "/crm/package",
    _config: { title: "Conviction Package", requiresOrg: true },
  },

  capture: {
    _: "/crm/capture",
    _config: { title: "Capture", requiresOrg: true },
  },

  aavahana: { _: "/crm/aavahana", _config: { title: "Aavahana (V1)", requiresOrg: true } },
  trinethra: { _: "/crm/trinethra", _config: { title: "Trinethra (V2)", requiresOrg: true } },
  mimamsaka: { _: "/crm/mimamsaka", _config: { title: "Mimamsaka (V3)", requiresOrg: true } },
  kautilya: { _: "/crm/kautilya", _config: { title: "Kautilya (V4)", requiresOrg: true } },
  niyantaCrm: { _: "/crm/niyanta-crm", _config: { title: "Niyanta CRM (V5)", requiresOrg: true } },
  learning: { _: "/crm/learning", _config: { title: "Learning", requiresOrg: true } },
  healthV2: { _: "/crm/health-v2", _config: { title: "Health (perception)", requiresOrg: true } },
  pmsView: { _: "/crm/pms-view", _config: { title: "PMS", requiresOrg: true } },
  rhythm: { _: "/crm/rhythm", _config: { title: "Management Rhythm", requiresOrg: true } },

  canvases: {
    _: "/crm/canvases",
    _config: { title: "Research Canvases", requiresOrg: true },
    _param: "canvasId",
    _paramPath: "/crm/canvases/[canvasId]",
    _paramConfig: { title: "Research Canvas", requiresOrg: true },
  },

  leads: {
    _: "/crm/leads",
    _config: { title: "Leads", requiresOrg: true },
  },

  // Who can see whose leads. Org leader or site admin to read; site admin to change.
  adminLeadAccess: {
    _: "/crm/admin/lead-access",
    _config: { title: "Lead Access", requiresOrg: true },
  },

  adminOntology: {
    _: "/crm/admin/ontology",
    _config: { title: "Interaction Ontology", requiresOrg: true },
  },

  adminSettings: {
    _: "/crm/admin/settings",
    _config: { title: "CRM Settings", requiresOrg: true },
  },

  emailSender: {
    _: "/crm/settings/email-sender",
    _config: { title: "Email Sender", requiresOrg: true },
  },

  blueprints: {
    _: "/crm/blueprints",
    _config: { title: "Blueprints", requiresOrg: true },
  },

  blueprintNew: {
    _: "/crm/blueprints/new",
    _config: { title: "New Blueprint", requiresOrg: true },
  },

  blueprintDetail: {
    _: "/crm/blueprints/[templateId]",
    _config: { title: "Blueprint Editor", requiresOrg: true },
    _param: "templateId",
    _paramPath: "/crm/blueprints/[templateId]",
  },

  blueprintAccounts: {
    _: "/crm/blueprints/accounts",
    _config: { title: "Account Blueprints", requiresOrg: true },
  },

  blueprintAccountDetail: {
    _: "/crm/blueprints/accounts/[accountBlueprintId]",
    _config: { title: "Account Blueprint", requiresOrg: true },
    _param: "accountBlueprintId",
    _paramPath: "/crm/blueprints/accounts/[accountBlueprintId]",
  },

  experiments: {
    _: "/crm/experiments",
    _config: { title: "Experiments", requiresOrg: true },
    _param: "experimentId",
    _paramPath: "/crm/experiments/[experimentId]",
    _paramConfig: { title: "Experiment Details", requiresOrg: true },
  },

  experimentNew: {
    _: "/crm/experiments/new",
    _config: { title: "New Experiment", requiresOrg: true },
  },

  analytics: {
    _: "/crm/analytics",
    _config: { title: "CRM Analytics", requiresOrg: true },
  },

  team: {
    _: "/crm/team",
    _config: { title: "Team Performance", requiresOrg: true },
    _param: "repId",
    _paramPath: "/crm/team/[repId]",
    _paramConfig: { title: "Rep Performance", requiresOrg: true },
  },

  coaching: {
    _: "/crm/team/coaching",
    _config: { title: "Coaching Triggers", requiresOrg: true },
  },

  campaigns: {
    _: "/crm/campaigns",
    _config: { title: "Newsletter Campaigns", requiresOrg: true },
    _param: "campaignId",
    _paramPath: "/crm/campaigns/[campaignId]",
    _paramConfig: { title: "Campaign Details", requiresOrg: true },
  },

  contentStudio: {
    _: "/crm/content-studio",
    _config: { title: "Content Studio", requiresOrg: true },
    _param: "carouselId",
    _paramPath: "/crm/content-studio/[carouselId]",
    _paramConfig: { title: "Carousel", requiresOrg: true },
  },

  contentStudioSchedule: {
    _: "/crm/content-studio/schedule",
    _config: { title: "Content Schedule", requiresOrg: true },
  },

  // ── Set 1: Business Context ─────────────────────────────────────────────

  offerings: {
    _: "/crm/admin/offerings",
    _config: { title: "Offerings", requiresOrg: true },
    _param: "offeringId",
    _paramPath: "/crm/admin/offerings/[offeringId]",
    _paramConfig: { title: "Offering Details", requiresOrg: true },
  },

  icpProfiles: {
    _: "/crm/admin/icp",
    _config: { title: "ICP Profiles", requiresOrg: true },
    _param: "profileId",
    _paramPath: "/crm/admin/icp/[profileId]",
    _paramConfig: { title: "ICP Profile", requiresOrg: true },
  },

  competitors: {
    _: "/crm/admin/competitors",
    _config: { title: "Competitive Landscape", requiresOrg: true },
    _param: "competitorId",
    _paramPath: "/crm/admin/competitors/[competitorId]",
    _paramConfig: { title: "Competitor Details", requiresOrg: true },
  },

  businessContext: {
    _: "/crm/admin/business-context",
    _config: { title: "Business Context", requiresOrg: true },
  },

  contentIdentity: {
    _: "/crm/admin/content-identity",
    _config: { title: "Brand & Messaging Identity", requiresOrg: true },
  },

  metricTargets: {
    _: "/crm/admin/metrics",
    _config: { title: "Key Metrics & Targets", requiresOrg: true },
  },

  fieldOptions: {
    _: "/crm/admin/field-options",
    _config: { title: "Field Options", requiresOrg: true },
  },

  // ── Nodal Infrastructure ──────────────────────────────────────────────────

  adminNodes: {
    _: "/crm/admin/nodes",
    _config: { title: "Node Schema", requiresOrg: true },
  },

  adminNodeGroups: {
    _: "/crm/admin/nodes/groups",
    _config: { title: "Node Groups", requiresOrg: true },
    _param: "groupId",
    _paramPath: "/crm/admin/nodes/groups/[groupId]",
    _paramConfig: { title: "Node Group", requiresOrg: true },
  },

  adminNodeDefinition: {
    _: "/crm/admin/nodes/definitions/[nodeId]",
    _config: { title: "Node Editor", requiresOrg: true },
    _param: "nodeId",
    _paramPath: "/crm/admin/nodes/definitions/[nodeId]",
  },

  adminNodeGates: {
    _: "/crm/admin/nodes/gates",
    _config: { title: "Gates", requiresOrg: true },
    _param: "gateId",
    _paramPath: "/crm/admin/nodes/gates/[gateId]",
    _paramConfig: { title: "Gate Editor", requiresOrg: true },
  },

  adminContentFields: {
    _: "/crm/admin/nodes/content-fields",
    _config: { title: "Companion Fields", requiresOrg: true },
  },

  adminTemplates: {
    _: "/crm/admin/nodes/templates",
    _config: { title: "Activity Templates", requiresOrg: true },
    _param: "templateId",
    _paramPath: "/crm/admin/nodes/templates/[templateId]",
    _paramConfig: { title: "Template Editor", requiresOrg: true },
  },

  adminNodeImport: {
    _: "/crm/admin/nodes/import",
    _config: { title: "Import / Export Schema", requiresOrg: true },
  },

  adminStages: {
    _: "/crm/admin/nodes/stages",
    _config: { title: "Stage Definitions", requiresOrg: true },
  },

  // ── Pitch Engine ───────────────────────────────────────────────────────────

  pitches: {
    _: "/crm/pitches",
    _config: { title: "Pitches", requiresOrg: true },
    _param: "pitchId",
    _paramPath: "/crm/pitches/[pitchId]",
    _paramConfig: { title: "Pitch Details", requiresOrg: true },
  },

  pitchNew: {
    _: "/crm/pitches/new",
    _config: { title: "New Pitch", requiresOrg: true },
  },
} as const;
