import { ROUTES } from "./definitions";

// ============================================
// TYPE-SAFE ROUTE BUILDER
// ============================================

export const routes = {
  home: () => ROUTES.home._,

  auth: {
    login: () => ROUTES.auth.login._,
    signup: () => ROUTES.auth.signup._,
    forgotPassword: () => ROUTES.auth.forgotPassword._,
    resetPassword: () => ROUTES.auth.resetPassword._,
    verify: () => ROUTES.auth.verify._,
    verifyCode: () => ROUTES.auth.verifyCode._,
  },

  // Aavahana routes
  dashboard: Object.assign(() => ROUTES.aavahana.dashboard._, {
    users: () => ROUTES.dashboard.users._,
  }),

  profile: () => ROUTES.profile._,

  plan: {
    daily: () => ROUTES.aavahana.dailyPlan._,
  },

  report: {
    daily: () => ROUTES.aavahana.dailyReport._,
  },

  weeklyPlan: Object.assign(() => ROUTES.aavahana.weeklyPlan._, {
    input: () => ROUTES.aavahana.weeklyPlan.input._,
    report: () => ROUTES.aavahana.weeklyReport._,
    timetable: () => ROUTES.aavahana.timetable._,
    analytics: () => ROUTES.aavahana.analytics._,
    monthlyReport: () => ROUTES.aavahana.monthlyReport._,
  }),

  monthlyReport: () => ROUTES.aavahana.monthlyReport._,
  careerRunrate: () => ROUTES.aavahana.careerRunrate._,
  leadershipPortfolio: () => ROUTES.aavahana.leadershipPortfolio._,
  feedback: () => ROUTES.aavahana.feedback._,
  ubs: () => ROUTES.aavahana.engagementScore._,
  ip: () => ROUTES.aavahana.ip._,

  test: () => ROUTES.aavahana.test._,

  // Mimamsaka routes
  mimamsaka: {
    home: () => ROUTES.mimamsaka.home._,
    explore: () => ROUTES.mimamsaka.explore._,
    program: Object.assign(
      (name: string) => ROUTES.mimamsaka.program._paramPath!.replace("[name]", name),
      {
        intake: () => ROUTES.mimamsaka.program.intake._,
        attention: (name: string) =>
          ROUTES.mimamsaka.program.attention._.replace("[name]", name),
        eventLoop: (name: string) =>
          ROUTES.mimamsaka.program.eventLoop._.replace("[name]", name),
        alignment: (name: string) =>
          ROUTES.mimamsaka.program.alignment._.replace("[name]", name),
        sprintReview: (name: string) =>
          ROUTES.mimamsaka.program.sprintReview._.replace("[name]", name),
      }
    ),
  },

  // Niyanta routes
  niyanta: {
    home: () => ROUTES.niyanta.home._,
    create: () => ROUTES.niyanta.create._,
    view: (id: string) => ROUTES.niyanta._paramPath!.replace("[id]", id),
    growthCharter: () => ROUTES.niyanta.growthCharter._,
    growthWorkflow: () => ROUTES.niyanta.growthWorkflow._,
  },

  // ATS routes
  ats: {
    home: () => ROUTES.ats.home._,
    apply: (oppId: string) =>
      ROUTES.ats.apply._paramPath!.replace("[oppId]", oppId),
    applySuccess: () => ROUTES.ats.apply.success._,
    consent: () => ROUTES.ats.consent._,
    candidate: {
      dashboard: () => ROUTES.ats.candidate.dashboard._,
      opportunities: () => ROUTES.ats.candidate.opportunities._,
      opportunity: (oppId: string) =>
        ROUTES.ats.candidate.opportunities._paramPath!.replace("[oppId]", oppId),
      application: (appId: string) =>
        ROUTES.ats.candidate.applications._paramPath!.replace("[appId]", appId),
      round: (appId: string, roundId: string) =>
        ROUTES.ats.candidate.applications.rounds._paramPath!
          .replace("[appId]", appId)
          .replace("[roundId]", roundId),
      leaderboard: (appId: string) =>
        ROUTES.ats.candidate.applications.leaderboard._!.replace("[appId]", appId),
    },
    designer: {
      dashboard: () => ROUTES.ats.designer.dashboard._,
      templates: () => ROUTES.ats.designer.templates._,
      templateCreate: () => ROUTES.ats.designer.templates.create._,
      template: (id: string) =>
        ROUTES.ats.designer.templates._paramPath!.replace("[templateId]", id),
      processes: () => ROUTES.ats.designer.processes._,
      processCreate: () => ROUTES.ats.designer.processes.create._,
      process: (id: string) =>
        ROUTES.ats.designer.processes._paramPath!.replace("[processId]", id),
    },
    recruiter: {
      dashboard: () => ROUTES.ats.recruiter.dashboard._,
      opportunities: () => ROUTES.ats.recruiter.opportunities._,
      opportunityCreate: () => ROUTES.ats.recruiter.opportunities.create._,
      opportunity: (oppId: string) =>
        ROUTES.ats.recruiter.opportunities._paramPath!.replace("[oppId]", oppId),
      applications: (oppId: string) =>
        ROUTES.ats.recruiter.opportunities.applications._!.replace("[oppId]", oppId),
      application: (oppId: string, appId: string) =>
        ROUTES.ats.recruiter.opportunities.applications._paramPath!
          .replace("[oppId]", oppId)
          .replace("[appId]", appId),
      leaderboard: (oppId: string) =>
        ROUTES.ats.recruiter.opportunities.leaderboard._!.replace("[oppId]", oppId),
    },
  },

  finance: {
    home: () => ROUTES.finance.contracts._,
    contract: (id: string | number) =>
      ROUTES.finance.contracts._paramPath!.replace("[contractId]", String(id)),
    // U6 — who is active, and who may open the module.
    clients: () => ROUTES.finance.clients._,
    access: () => ROUTES.finance.access._,
    // U7 — what the cron did, and what it could not send.
    ops: () => ROUTES.finance.ops._,
  },

  virtualTour: {
    home: () => ROUTES.virtualTour.home._,
    day: (dayNumber: number) =>
      ROUTES.virtualTour.day._paramPath!.replace("[dayNumber]", String(dayNumber)),
    threadBuilder: () => ROUTES.virtualTour.threadBuilder._,
    gratitudes: () => ROUTES.virtualTour.gratitudes._,
    journal: () => ROUTES.virtualTour.journal._,
    rigor: () => ROUTES.virtualTour.rigor._,
    simulatedWork: () => ROUTES.virtualTour.simulatedWork._,
  },

  welcome: {
    home: () => ROUTES.welcome.home._,
    progress: () => ROUTES.welcome.progress._,
    fellowship: () => ROUTES.welcome.fellowship._,
    caseFiles: () => ROUTES.welcome.caseFiles._,
    testimonials: () => ROUTES.welcome.testimonials._,
    heritage: () => ROUTES.welcome.heritage._,
    leadership: () => ROUTES.welcome.leadership._,
  },

  crm: {
    home: () => ROUTES.crm.home._,
    contacts: () => ROUTES.crm.contacts._,
    contact: (id: string) =>
      ROUTES.crm.contacts._paramPath!.replace("[contactId]", id),
    outreachCompanies: () => ROUTES.crm.outreachCompanies._,
    outreachCompany: (id: string) =>
      ROUTES.crm.outreachCompanies._paramPath!.replace("[companyId]", id),
    outreachSpotlights: () => ROUTES.crm.outreachSpotlights._,
    outreachScoring: () => ROUTES.crm.outreachScoring._,
    outreachMeetingPipeline: () => ROUTES.crm.outreachMeetingPipeline._,
    outreachCustomers: () => ROUTES.crm.outreachCustomers._,
    // Public Spotlight share link (path only — the publisher's neutral /p/s/
    // namespace lives outside ROUTES; callers prepend window.location.origin
    // for a copyable absolute URL).
    publicSpotlight: (slug: string) => `/p/s/${slug}`,
    deals: () => ROUTES.crm.deals._,
    deal: (id: string) =>
      ROUTES.crm.deals._paramPath!.replace("[dealId]", id),
    // the demand/capability bridge
    capabilities: () => ROUTES.crm.capabilities._,
    engagement: () => ROUTES.crm.engagement._,
    flow: () => ROUTES.crm.flow._,
    dealRequirements: (dealId: string) =>
      ROUTES.crm.dealRequirements._paramPath!.replace("[dealId]", dealId),
    applications: () => ROUTES.crm.applications._,
    application: (id: string) =>
      ROUTES.crm.applications._paramPath!.replace("[applicationId]", id),
    applicationSpec: (id: string) =>
      ROUTES.crm.applicationSpec._paramPath!.replace("[applicationId]", id),
    applicationSample: (id: string) =>
      ROUTES.crm.applicationSample._paramPath!.replace("[applicationId]", id),
    aavahana: () => ROUTES.crm.aavahana._,
    adminOntology: () => ROUTES.crm.adminOntology._,
    adminSettings: () => ROUTES.crm.adminSettings._,
    emailSender: () => ROUTES.crm.emailSender._,
    blueprints: () => ROUTES.crm.blueprints._,
    blueprintNew: () => ROUTES.crm.blueprintNew._,
    blueprint: (id: string) =>
      ROUTES.crm.blueprintDetail._paramPath!.replace("[templateId]", id),
    blueprintAccounts: () => ROUTES.crm.blueprintAccounts._,
    blueprintAccount: (id: string) =>
      ROUTES.crm.blueprintAccountDetail._paramPath!.replace("[accountBlueprintId]", id),
    // tasks/health/healthAlerts KILLED (2026-07-06): replaced by the deal-loop (aavahana)
    // and perception health (healthV2).
    funnels: () => ROUTES.crm.funnels._,
    funnel: (id: string) => ROUTES.crm.funnels._paramPath!.replace("[funnelId]", id),
    board: () => ROUTES.crm.board._,
    accountWorkspace: (companyId: string) =>
      ROUTES.crm.accountWorkspace._paramPath!.replace("[companyId]", companyId),
    movementReconciliation: () => ROUTES.crm.movementReconciliation._,
    outreachDuplicates: () => ROUTES.crm.outreachDuplicates._,
    market: () => ROUTES.crm.market._,
    targets: () => ROUTES.crm.targets._,
    gen: () => ROUTES.crm.gen._,
    signals: () => ROUTES.crm.signals._,
    packageView: () => ROUTES.crm.package._,
    capture: () => ROUTES.crm.capture._,
    trinethra: () => ROUTES.crm.trinethra._,
    mimamsaka: () => ROUTES.crm.mimamsaka._,
    kautilya: () => ROUTES.crm.kautilya._,
    niyantaCrm: () => ROUTES.crm.niyantaCrm._,
    learning: () => ROUTES.crm.learning._,
    health: () => ROUTES.crm.healthV2._,
    healthV2: () => ROUTES.crm.healthV2._,
    pmsView: () => ROUTES.crm.pmsView._,
    rhythm: () => ROUTES.crm.rhythm._,
    experiments: () => ROUTES.crm.experiments._,
    experimentNew: () => ROUTES.crm.experimentNew._,
    experiment: (id: string) =>
      ROUTES.crm.experiments._paramPath!.replace("[experimentId]", id),
    analytics: () => ROUTES.crm.analytics._,
    team: () => ROUTES.crm.team._,
    rep: (repId: string) =>
      ROUTES.crm.team._paramPath!.replace("[repId]", repId),
    coaching: () => ROUTES.crm.coaching._,
    campaigns: () => ROUTES.crm.campaigns._,
    campaign: (id: string) =>
      ROUTES.crm.campaigns._paramPath!.replace("[campaignId]", id),
    offerings: () => ROUTES.crm.offerings._,
    offering: (id: string) =>
      ROUTES.crm.offerings._paramPath!.replace("[offeringId]", id),
    icpProfiles: () => ROUTES.crm.icpProfiles._,
    icpProfile: (id: string) =>
      ROUTES.crm.icpProfiles._paramPath!.replace("[profileId]", id),
    competitors: () => ROUTES.crm.competitors._,
    competitor: (id: string) =>
      ROUTES.crm.competitors._paramPath!.replace("[competitorId]", id),
    businessContext: () => ROUTES.crm.businessContext._,
    contentIdentity: () => ROUTES.crm.contentIdentity._,
    metricTargets: () => ROUTES.crm.metricTargets._,
    fieldOptions: () => ROUTES.crm.fieldOptions._,
    adminStages: () => ROUTES.crm.adminStages._,
    pitches: () => ROUTES.crm.pitches._,
    pitchNew: () => ROUTES.crm.pitchNew._,
    pitch: (id: string) =>
      ROUTES.crm.pitches._paramPath!.replace("[pitchId]", id),
  },

  ticket: {
    home: () => ROUTES.ticket.home._,
    detail: (id: string | number) =>
      ROUTES.ticket.detail._paramPath!.replace("[id]", String(id)),
    agent: () => ROUTES.ticket.agent._,
    commandCenter: () => ROUTES.ticket.commandCenter._,
  },
} as const;

export type Routes = typeof routes;
