// ─── Types ──────────────────────────────────────────────────────────────────

export type AnswerDepth = 'weak' | 'strong' | 'system';

export interface DemoDeliverable {
  label: string;
  checked: boolean;
}

export interface ThinkingAnswer {
  text: string;
  depth: AnswerDepth;
}

export interface DemoMonth {
  stage: 1 | 6 | 12;
  deliverables: DemoDeliverable[];
  dependencyAnswer: ThinkingAnswer;
  constraintAnswer: ThinkingAnswer;
  systemNudge?: string;
  maturity: { label: string; percent: number };
}

export interface DemoPerson {
  name: string;
  role: string;
  subtitle: string;
}

export interface DemoVLevel {
  badge: string;
  person: DemoPerson;
  goals: { months3: string; months6: string; year1: string };
  timeBadge: string;
  questions: { dependency: string; constraint: string };
  months: DemoMonth[];
}

export interface DemoContext {
  id: string;
  label: string;
  levels: DemoVLevel[];
}

// ─── Data ───────────────────────────────────────────────────────────────────

export const DEMO_CONTEXTS: DemoContext[] = [
  {
    id: 'mfg',
    label: 'Manufacturing — PPC',
    levels: [
      // ── V1 — Rohit ──
      {
        badge: 'V1',
        person: { name: 'Rohit', role: 'PPC Executive', subtitle: 'Job cards, material tracking, shop floor coordination' },
        goals: { months3: 'Names what blocked with specificity', months6: 'Sees patterns, suggests fixes', year1: 'Ready for V2' },
        timeBadge: '~2 min',
        questions: {
          dependency: 'If one gets delayed, which holds up the most other work?',
          constraint: 'What slowed you down most last week?',
        },
        months: [
          {
            stage: 1,
            deliverables: [
              { label: 'Update job cards — SF2 (8 orders)', checked: true },
              { label: 'Follow up stores — raw material for next week', checked: true },
              { label: 'Compile daily output vs target report', checked: true },
            ],
            dependencyAnswer: { text: 'Update job cards — SF2', depth: 'weak' },
            constraintAnswer: { text: 'Everything took longer than expected', depth: 'weak' },
            maturity: { label: 'Dependency thinking', percent: 25 },
          },
          {
            stage: 6,
            deliverables: [
              { label: 'Update job cards — SF2 (6 orders)', checked: true },
              { label: 'Follow up stores — raw material for next week', checked: true },
              { label: 'Cross-check dispatch schedule vs FG inventory', checked: true },
            ],
            dependencyAnswer: { text: 'Follow up stores — 4 job cards and the dispatch schedule both depend on material confirmation', depth: 'strong' },
            constraintAnswer: { text: 'Stores has been my blocker 9 of the last 14 weeks. If purchase dept confirmed receipts by Wednesday I wouldn\'t lose Thursday-Friday every week', depth: 'strong' },
            systemNudge: 'You\'ve named stores as your blocker 9 of 14 weeks.',
            maturity: { label: 'Dependency thinking', percent: 60 },
          },
          {
            stage: 12,
            deliverables: [
              { label: 'Update job cards — SF1 + SF2 (12 orders)', checked: true },
              { label: 'Pre-verify material with stores before Wednesday cutoff', checked: true },
              { label: 'Flag dispatch delays to Prasad before they cascade', checked: true },
            ],
            dependencyAnswer: { text: 'Pre-verify material — if I don\'t confirm by Wednesday, Sunita can\'t finalize the machine loading plan on Thursday and the whole SF2 schedule slips by a day', depth: 'system' },
            constraintAnswer: { text: 'The dispatch→production handoff has no standard format — I spend 40 min per order translating sales commitments into production specs. Prasad has the same problem. If there were a standard template, both of us would save 3 hours a week.', depth: 'system' },
            systemNudge: 'Prasad also named dispatch handoff as a blocker this week.',
            maturity: { label: 'Dependency thinking', percent: 90 },
          },
        ],
      },

      // ── V2 — Sunita ──
      {
        badge: 'V2',
        person: { name: 'Sunita', role: 'PPC Team Lead', subtitle: 'Manages Rohit, Prasad, Geeta · Machine loading, scheduling, capacity' },
        goals: { months3: 'Attributes causes for gaps', months6: 'Anticipates, coaches V1', year1: 'Ready for V3' },
        timeBadge: '~4 min',
        questions: {
          dependency: 'What was planned last week but not done — and what caused it?',
          constraint: 'Which team member had the hardest week — what would you change?',
        },
        months: [
          {
            stage: 1,
            deliverables: [
              { label: 'Finalize machine loading plan — SF1 + SF2', checked: true },
              { label: 'Job cards update — SF2 (Rohit)', checked: true },
              { label: 'FG inventory reconciliation (Prasad)', checked: true },
            ],
            dependencyAnswer: { text: 'Capacity utilization report didn\'t get done. We were too busy.', depth: 'weak' },
            constraintAnswer: { text: 'Rohit. I\'ll tell him to try harder with stores.', depth: 'weak' },
            maturity: { label: 'Causal attribution', percent: 25 },
          },
          {
            stage: 6,
            deliverables: [
              { label: 'Machine loading plan — SF1 + SF2', checked: true },
              { label: 'Job cards + material pre-check (Rohit)', checked: true },
              { label: 'Dispatch reconciliation (Prasad)', checked: true },
              { label: 'Capacity report (Geeta)', checked: true },
            ],
            dependencyAnswer: { text: 'Geeta\'s capacity report. She was pulled into dispatch reconciliation because Prasad was out sick — her planned work got displaced. Capacity, not capability.', depth: 'strong' },
            constraintAnswer: { text: 'Rohit. He\'s stuck waiting on stores every week. I\'ll escalate PO-4471 to purchase dept myself instead of making him chase it — his constraint is above his authority level.', depth: 'strong' },
            systemNudge: 'Your team\'s carry-forward has been above 25% for 8 weeks.',
            maturity: { label: 'Causal attribution', percent: 60 },
          },
          {
            stage: 12,
            deliverables: [
              { label: 'Machine loading + buffer allocation — SF1 + SF2', checked: true },
              { label: 'Material pre-verification by Wednesday cutoff (Rohit)', checked: true },
              { label: 'Dispatch-production handoff audit (Prasad + Rohit)', checked: true },
              { label: 'Monthly capacity + throughput report (Geeta)', checked: true },
            ],
            dependencyAnswer: { text: 'All planned items completed, but the handoff audit only covered SF2. The real gap: 5 of 12 production orders this week had specs that didn\'t match what sales committed — we\'re finishing items on time but some don\'t match what the customer ordered. Throughput looks fine, quality is the real gap.', depth: 'system' },
            constraintAnswer: { text: 'Prasad. He keeps finding dispatch errors only at the end. I\'m restructuring — moving his dispatch check to before production starts, not after. Preventing the problem instead of catching it.', depth: 'system' },
            systemNudge: 'Rohit and Prasad both named dispatch handoff this week. Structural pattern.',
            maturity: { label: 'Causal attribution', percent: 90 },
          },
        ],
      },

      // ── V3 — Vikram ──
      {
        badge: 'V3',
        person: { name: 'Vikram', role: 'Production Planning TPM', subtitle: 'Oversees PPC + Quality + Dispatch' },
        goals: { months3: 'Accurate constraint ID, mechanical exploitation', months6: 'Proactive, proposes structural fixes', year1: 'V4-level thinking' },
        timeBadge: '~4 min',
        questions: {
          dependency: 'THE constraint this week?',
          constraint: 'What will you do about it?',
        },
        months: [
          {
            stage: 1,
            deliverables: [],
            dependencyAnswer: { text: 'Lots of problems — lathe is down, material is late, dispatch is backed up', depth: 'weak' },
            constraintAnswer: { text: 'Will talk to Plant Head about everything', depth: 'weak' },
            maturity: { label: 'Constraint identification', percent: 25 },
          },
          {
            stage: 6,
            deliverables: [],
            dependencyAnswer: { text: 'CNC lathe #3 downtime — 6 days, SF2 bottleneck. 4 orders stuck at turning. Downstream assembly is starving for parts.', depth: 'strong' },
            constraintAnswer: { text: 'Rerouting 2 orders to SF1 CNC (overtime). Deferring 2 non-urgent orders. Not releasing new jobs to SF2 until lathe is back.', depth: 'strong' },
            maturity: { label: 'Constraint identification', percent: 60 },
          },
          {
            stage: 12,
            deliverables: [],
            dependencyAnswer: { text: 'The constraint isn\'t a machine or person — it\'s the sales→production information handoff. 5 of 12 orders this week had specs that didn\'t match sales commitments. We\'re building the right things at the right speed but sometimes the wrong things. This has shown up in 7 of the last 10 sprints.', depth: 'system' },
            constraintAnswer: { text: 'Sprint-level fixes have failed 3 times. Proposing V4 redesigns the order-entry→production spec flow: standard template, mandatory fields, verification gate before production starts. Sunita is already piloting it with Prasad — early results are promising.', depth: 'system' },
            systemNudge: 'Sales-production handoff flagged as constraint in 7 of last 10 sprints.',
            maturity: { label: 'Constraint identification', percent: 90 },
          },
        ],
      },
    ],
  },

  {
    id: 'saas',
    label: 'SaaS — Growth',
    levels: [
      // ── V1 — Sneha ──
      {
        badge: 'V1',
        person: { name: 'Sneha', role: 'Growth Associate', subtitle: 'Activation experiments, lifecycle emails, landing pages' },
        goals: { months3: 'Names what blocked with specificity', months6: 'Sees patterns, suggests fixes', year1: 'Ready for V2' },
        timeBadge: '~2 min',
        questions: {
          dependency: 'If one gets delayed, which holds up the most other work?',
          constraint: 'What slowed you down most last week?',
        },
        months: [
          {
            stage: 1,
            deliverables: [
              { label: 'Set up 3 email drip sequences — unactivated trials', checked: true },
              { label: 'Update landing page copy from A/B winner', checked: true },
              { label: 'Pull activation funnel data into Mixpanel tracker', checked: true },
            ],
            dependencyAnswer: { text: 'Set up 3 email drip sequences', depth: 'weak' },
            constraintAnswer: { text: 'I didn\'t know how to do the Mixpanel setup properly', depth: 'weak' },
            maturity: { label: 'Dependency thinking', percent: 25 },
          },
          {
            stage: 6,
            deliverables: [
              { label: 'Run in-app tooltip experiment — onboarding step 3', checked: true },
              { label: 'Pull weekly activation funnel data into tracker', checked: true },
              { label: 'Write nurture sequence for high-value trials (>50 employees)', checked: true },
            ],
            dependencyAnswer: { text: 'Pull activation funnel data — Arjun\'s conversion analysis and my tooltip experiment both need last week\'s numbers to know what to test next', depth: 'strong' },
            constraintAnswer: { text: 'Onboarding emails have 12% open rate — I\'ve been building drip sequences for 5 months but nobody reads them. The channel is wrong, not the content. Need to move everything to in-app.', depth: 'strong' },
            systemNudge: 'You\'ve named email open rate / channel mismatch 6 of last 10 weeks.',
            maturity: { label: 'Dependency thinking', percent: 60 },
          },
          {
            stage: 12,
            deliverables: [
              { label: 'Activation audit — compare tooltip vs email vs webinar paths', checked: true },
              { label: 'Build segment-specific onboarding for enterprise trials', checked: true },
              { label: 'Document the onboarding playbook for Kavya\'s new channels', checked: true },
            ],
            dependencyAnswer: { text: 'Activation audit — Arjun needs it for the quarterly growth review, and Kavya can\'t start her channel experiments until we know which onboarding path works best per segment', depth: 'system' },
            constraintAnswer: { text: 'Product and Growth don\'t share a definition of "activated." Product counts login + 1 action. We count data-connected + dashboard-viewed. Our funnel numbers don\'t match theirs. Until we align, every experiment is measured differently. Kavya hit the same problem on her retention experiments last week.', depth: 'system' },
            systemNudge: 'Kavya also named activation definition mismatch this week.',
            maturity: { label: 'Dependency thinking', percent: 90 },
          },
        ],
      },

      // ── V2 — Arjun ──
      {
        badge: 'V2',
        person: { name: 'Arjun', role: 'Growth Lead', subtitle: 'Manages Sneha, Kavya · Funnel optimization, conversion analysis' },
        goals: { months3: 'Attributes causes for gaps', months6: 'Anticipates, coaches V1', year1: 'Ready for V3' },
        timeBadge: '~4 min',
        questions: {
          dependency: 'What was planned last week but not done — and what caused it?',
          constraint: 'Which team member had the hardest week — what would you change?',
        },
        months: [
          {
            stage: 1,
            deliverables: [
              { label: 'Analyze trial→paid conversion by channel', checked: true },
              { label: 'Email drips for unactivated trials (Sneha)', checked: true },
              { label: 'Retargeting campaign (Kavya)', checked: true },
            ],
            dependencyAnswer: { text: 'LinkedIn ads didn\'t get done. Sneha was busy with other things.', depth: 'weak' },
            constraintAnswer: { text: 'Sneha. She needs to manage her time better.', depth: 'weak' },
            maturity: { label: 'Causal attribution', percent: 25 },
          },
          {
            stage: 6,
            deliverables: [
              { label: 'Conversion analysis — trial→paid by channel', checked: true },
              { label: 'In-app tooltip experiment (Sneha)', checked: true },
              { label: 'Churned user retargeting (Kavya)', checked: true },
            ],
            dependencyAnswer: { text: 'Sneha spent 2 days on email drips with 12% open rate — the work got done but the approach is wrong, not a time issue. We\'re optimizing a dead channel.', depth: 'strong' },
            constraintAnswer: { text: 'Sneha. She needs Appcues access for in-app tooltips — email isn\'t working. Will get her a Product team intro and a learning slot this week. Her constraint isn\'t skill, it\'s tooling access.', depth: 'strong' },
            systemNudge: 'Your team\'s carry-forward has been below 20% for 6 weeks — but activation hasn\'t improved.',
            maturity: { label: 'Causal attribution', percent: 60 },
          },
          {
            stage: 12,
            deliverables: [
              { label: 'Activation path comparison (Sneha)', checked: true },
              { label: 'Enterprise segment onboarding (Sneha)', checked: true },
              { label: 'Retention channel experiments (Kavya)', checked: true },
              { label: 'Quarterly growth review deck (Arjun)', checked: true },
            ],
            dependencyAnswer: { text: 'All items completed. But 3 of 4 were top-of-funnel — we\'re still spending 75% of team capacity on acquisition when the bottleneck is activation. I\'m over-resourcing the non-constraint. Next week I\'m shifting Kavya to activation experiments alongside Sneha.', depth: 'system' },
            constraintAnswer: { text: 'Both Sneha and Kavya hit the activation definition mismatch with Product. I sat with Sneha Wednesday to map the gap — we need a shared definition before anyone runs more experiments. I\'ll bring this to Nisha as a structural ask.', depth: 'system' },
            systemNudge: 'Sneha and Kavya both named activation definition as their blocker this week.',
            maturity: { label: 'Causal attribution', percent: 90 },
          },
        ],
      },

      // ── V3 — Nisha ──
      {
        badge: 'V3',
        person: { name: 'Nisha', role: 'Growth TPM', subtitle: 'Oversees Growth + Lifecycle + Partnerships' },
        goals: { months3: 'Accurate constraint ID', months6: 'Proactive, structural proposals', year1: 'V4-level thinking' },
        timeBadge: '~4 min',
        questions: {
          dependency: 'THE constraint this week?',
          constraint: 'What will you do about it?',
        },
        months: [
          {
            stage: 1,
            deliverables: [],
            dependencyAnswer: { text: 'Product team isn\'t giving us bandwidth. Also the email open rates are low. And we need better tooling.', depth: 'weak' },
            constraintAnswer: { text: 'Will ask VP to talk to Product about prioritization', depth: 'weak' },
            maturity: { label: 'Constraint identification', percent: 25 },
          },
          {
            stage: 6,
            deliverables: [],
            dependencyAnswer: { text: 'Activation bottleneck — trial→activated is 18% vs 35% benchmark. Root cause is onboarding UX, but changes need Product engineering and they\'re locked on Q2 release.', depth: 'strong' },
            constraintAnswer: { text: 'Stop all top-of-funnel experiments — more trials into broken activation is waste. Redirect team to non-engineering onboarding fixes: in-app tooltips via Appcues, manual outreach to high-value trials, webinar invite flow.', depth: 'strong' },
            maturity: { label: 'Constraint identification', percent: 60 },
          },
          {
            stage: 12,
            deliverables: [],
            dependencyAnswer: { text: 'The constraint isn\'t bandwidth anymore — it\'s that Growth and Product measure "activated" differently. Product counts login + 1 action. We count data-connected + dashboard-viewed. Every experiment is measured against a different baseline. Arjun\'s team surfaced this — Sneha and Kavya both hit it independently. This is the 6th sprint it\'s appeared.', depth: 'system' },
            constraintAnswer: { text: 'Sprint-level workarounds have failed for 6 months. Proposing a shared activation definition workshop with Product — 1 day, lock the definition, update Mixpanel/Amplitude events to match. Until this is fixed, every growth experiment produces ambiguous results.', depth: 'system' },
            systemNudge: 'Activation definition mismatch flagged as constraint in 6 of last 8 sprints.',
            maturity: { label: 'Constraint identification', percent: 90 },
          },
        ],
      },
    ],
  },
];

// ─── V3 signal data (auto-computed metrics shown to V3s) ────────────────────

export interface V3Signal {
  throughput: { value: string; trend: 'up' | 'down' };
  buffer: { value: string; status: 'red' | 'amber' | 'green' };
  teamConstraint: string;
}

export const V3_SIGNALS: Record<string, Record<number, V3Signal>> = {
  mfg: {
    1:  { throughput: { value: '61%', trend: 'down' }, buffer: { value: '1 of 3d', status: 'red' }, teamConstraint: 'Budget' },
    6:  { throughput: { value: '68%', trend: 'down' }, buffer: { value: '2 of 4d', status: 'amber' }, teamConstraint: 'Internal Support' },
    12: { throughput: { value: '84%', trend: 'up' },   buffer: { value: '3 of 4d', status: 'green' }, teamConstraint: 'Assumptions' },
  },
  saas: {
    1:  { throughput: { value: '58%', trend: 'down' }, buffer: { value: '2 of 5d', status: 'amber' }, teamConstraint: 'Internal Support' },
    6:  { throughput: { value: '65%', trend: 'down' }, buffer: { value: '2 of 4d', status: 'amber' }, teamConstraint: 'Internal Support' },
    12: { throughput: { value: '81%', trend: 'up' },   buffer: { value: '3 of 4d', status: 'green' }, teamConstraint: 'Assumptions' },
  },
};

// ─── V3 action tags ─────────────────────────────────────────────────────────

export const V3_ACTION_TAGS: Record<string, Record<number, string>> = {
  mfg:  { 1: 'ESCALATE', 6: 'SUBORDINATE', 12: 'STRUCTURAL' },
  saas: { 1: 'ESCALATE', 6: 'SUBORDINATE', 12: 'STRUCTURAL' },
};

// ─── V3 V4-signal data ──────────────────────────────────────────────────────

export interface V4Signal {
  needsDecision: boolean;
  text: string;
}

export const V3_V4_SIGNALS: Record<string, Record<number, V4Signal>> = {
  mfg: {
    1:  { needsDecision: true, text: 'Multiple issues on the floor. Need guidance.' },
    6:  { needsDecision: true, text: 'Lathe #3 spare: original vendor 5 more days, alternate vendor Thursday at 1.5x. Every day = ~₹1.5L delayed dispatch. Need approval for alternate vendor by tomorrow.' },
    12: { needsDecision: true, text: 'Investment tradeoff: 2 weeks of Sunita\'s time to build the standard handoff template + verification gate, vs ~₹2L/month in rework and dispatch delays. Sunita\'s team is already doing it informally — need V4 to mandate it across all three shop floors.' },
  },
  saas: {
    1:  { needsDecision: true, text: 'Product isn\'t supporting growth experiments. Need help.' },
    6:  { needsDecision: false, text: 'Resequencing around Product freeze. Building the case for Q3 onboarding prioritization with activation data.' },
    12: { needsDecision: true, text: 'Investment: 1-day cross-functional workshop + 2 days engineering to update event definitions. Return: every experiment from that point forward has a shared measurement baseline. Current cost of ambiguity: ~3 wasted experiment-weeks per quarter because results can\'t be compared. Arjun can lead it — he\'s ready.' },
  },
};
