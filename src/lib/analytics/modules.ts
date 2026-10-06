// src/lib/analytics/modules.ts
/**
 * Module registry for product analytics.
 *
 * PDGMS is one Next app with one route segment per product (Aavahana, CRM,
 * Trinethra, ...). Analytics needs to answer "how many people used CRM this
 * week", so every pathname must resolve to exactly one module key.
 *
 * This map is deliberately SEPARATE from the sidebar map in `AuthProvider`.
 * That one only covers surfaces that own a sidebar and falls through to
 * "Aavahana" for everything else — which would silently mis-attribute /sd,
 * /ldi, /hcd, /director and friends. For analytics every segment is listed,
 * and an unknown segment auto-derives its own key instead of being folded
 * into a neighbour.
 */

export interface ResolvedModule {
  /** Stable machine key — used as the Clarity tag value. Never rename casually. */
  key: string;
  /** Human label shown in Clarity filters. */
  label: string;
  /** Second path segment with ids masked, e.g. "designer", "deals". */
  section: string | null;
  /** False when the segment is not in the registry below (new/unmapped surface). */
  known: boolean;
}

/** segment → [key, label]. Several segments may share one key (ats/atsdraft). */
const MODULE_MAP: Record<string, [key: string, label: string]> = {
  aavahana: ["aavahana", "Aavahana"],
  account: ["account", "Account"],
  activities: ["activities", "Activities"],
  admin: ["admin", "Admin"],
  ats: ["ats", "ATS"],
  atsdraft: ["ats", "ATS"],
  auth: ["auth", "Auth"],
  authenticate: ["auth", "Auth"],
  blog: ["blog", "Blog"],
  "cmo-check": ["cmo-check", "CMO Check"],
  crm: ["crm", "CRM"],
  demos: ["demos", "Demos"],
  director: ["director", "Director"],
  documents: ["documents", "Documents"],
  experiment: ["experiment", "Experiment"],
  finance: ["finance", "Finance"],
  garudavega: ["garudavega", "Garudavega"],
  growth: ["growth", "Growth Space"],
  guides: ["guides", "Guides"],
  hcd: ["hcd", "HCD"],
  invite: ["invite", "Invite"],
  "invoice-paused": ["finance", "Finance"],
  kautilya: ["kautilya", "Kautilya"],
  ldi: ["ldi", "L&D"],
  mimamsaka: ["mimamsaka", "Mimamsaka"],
  niyanta: ["niyanta", "Niyanta"],
  ontology: ["ontology", "Ontology"],
  p: ["public-pages", "Public Pages"],
  payroll: ["payroll", "People Ops"],
  "privacy-policy": ["legal", "Legal"],
  profile: ["profile", "Profile"],
  prospect: ["prospect", "Prospect"],
  research: ["research", "Research"],
  sd: ["sd", "Socratic Dialogue Portal"],
  selection: ["selection", "Selection"],
  "socratic-ai": ["socratic-ai", "Socratic AI"],
  ticket: ["ticket", "Support Tickets"],
  "ticket-agent": ["ticket", "Support Tickets"],
  "ticket-commandcenter": ["ticket", "Support Tickets"],
  trinethra: ["trinethra", "Trinethra"],
  "virtual-tour": ["virtual-tour", "Virtual Tour"],
  welcome: ["welcome", "Welcome"],
};

const ROOT_MODULE: ResolvedModule = { key: "home", label: "Home", section: null, known: true };

const UUID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;

/**
 * Masks record ids so `module_section` stays low-cardinality. Clarity tags are
 * for filtering, not for storing every deal/report id.
 */
function maskId(segment: string): string {
  if (!segment) return "";
  if (/^\d+$/.test(segment)) return ":id";
  if (UUID_LIKE.test(segment)) return ":id";
  if (/^[0-9a-f]{16,}$/i.test(segment)) return ":id";
  if (segment.length > 24) return ":id";
  return segment;
}

function titleize(segment: string): string {
  return segment
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Resolves any pathname to the product module that owns it. */
export function resolveModule(pathname: string): ResolvedModule {
  const clean = (pathname || "/").split("?")[0].split("#")[0];
  const segments = clean.split("/").filter(Boolean);

  if (segments.length === 0) return ROOT_MODULE;

  const head = segments[0].toLowerCase();
  const entry = MODULE_MAP[head];
  const rawSection = segments[1] ? maskId(segments[1]) : null;

  if (!entry) {
    return { key: head, label: titleize(head), section: rawSection, known: false };
  }

  return { key: entry[0], label: entry[1], section: rawSection, known: true };
}

/** Every distinct module key, for docs/tests. */
export function allModuleKeys(): string[] {
  return Array.from(new Set(Object.values(MODULE_MAP).map(([key]) => key))).sort();
}
