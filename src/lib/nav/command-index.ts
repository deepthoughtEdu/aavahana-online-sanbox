// src/lib/nav/command-index.ts
/**
 * The searchable index behind the command palette, and the matcher that ranks it.
 *
 * Pure on purpose — no React, no jotai, no DOM. That keeps it unit-testable and lets a
 * future app launcher reuse the same flattening without dragging the palette along.
 *
 * ⚠️ The index mirrors `Sidebar.tsx`'s visibility rules step for step, so the palette
 * can never surface a link the sidebar is hiding. If you change the filtering here,
 * change it there too. And note that `access` is DISPLAY FILTERING: see the warning on
 * `NavAccess` in src/types/shared/nav.types.ts.
 */
import type { NavAccess } from "@/types/shared/nav.types";
import { matchesRole } from "@/lib/auth/role-match";
import { resolveDynamicPath } from "@/utils";
import {
  MODULES,
  type ModuleId,
  type ModuleRuntimeCtx,
  resolveModuleMenu,
  resolveNavModule,
} from "@/config/modules";

export type CommandKind = "module" | "page";

export interface CommandEntry {
  /** `${kind}:${path}`. Stable across rebuilds, which is what recents are stored as. */
  key: string;
  kind: CommandKind;
  label: string;
  /** Module tagline, on module entries only. */
  sublabel?: string;
  /** Section header in the results list. Always the owning module's label. */
  group: string;
  /** The menu group this entry sits under, when it is a child. */
  parentLabel?: string;
  path: string;
  icon?: React.ElementType;
  moduleId: ModuleId;
  /** Precomputed lowercase label + parent + group + path, so matching does no work. */
  haystack: string;
}

export interface BuildCommandIndexArgs {
  access: NavAccess;
  /** Same shape Sidebar passes to resolveDynamicPath: `{ profile: user, selectedOrg }`. */
  pathContext: Record<string, unknown>;
  runtime: ModuleRuntimeCtx;
}

function makeEntry(
  parts: Omit<CommandEntry, "key" | "haystack">
): CommandEntry {
  return {
    ...parts,
    key: `${parts.kind}:${parts.path}`,
    haystack: [parts.label, parts.parentLabel, parts.group, parts.path]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  };
}

/**
 * Flattens every visible module and menu entry into one flat, deduped list.
 *
 * Deliberately ignores `sidebarOverrideAtom`: that menu is built from fetched round data
 * on two ATS screens, so it is ephemeral and instance-specific and has no business in a
 * global search index.
 */
export function buildCommandIndex({
  access,
  pathContext,
  runtime,
}: BuildCommandIndexArgs): CommandEntry[] {
  const entries: CommandEntry[] = [];

  // Named `mod`, not `module`: Next forbids assigning to a variable called `module`.
  for (const mod of MODULES) {
    if (mod.visible && !mod.visible(access)) continue;

    // Carries the Virtual Tour minDay gate into the palette, so a day-locked page the
    // sidebar is hiding can never be reached by searching for it.
    const menu = resolveModuleMenu(mod, runtime);

    if (!mod.hidden) {
      entries.push(
        makeEntry({
          kind: "module",
          label: mod.label,
          sublabel: mod.tagline,
          group: mod.label,
          path: mod.home,
          icon: mod.icon,
          moduleId: mod.id,
        })
      );
    }

    for (const item of menu) {
      if (item.roles && !matchesRole(item.roles, roleCtx(access))) continue;

      const children = item.children ?? [];

      // A parent WITH children is rendered by NavMenu as a toggle button and its own
      // `path` is ignored entirely. Emitting it would create entries that navigate
      // somewhere the sidebar will not let you click.
      if (children.length === 0) {
        if (!item.path) continue;
        entries.push(
          makeEntry({
            kind: "page",
            label: item.label,
            group: mod.label,
            path: resolveDynamicPath(item.path, pathContext),
            icon: item.icon,
            moduleId: mod.id,
          })
        );
        continue;
      }

      for (const child of children) {
        if (child.roles && !matchesRole(child.roles, roleCtx(access))) continue;
        if (!child.path) continue;
        entries.push(
          makeEntry({
            kind: "page",
            label: child.label,
            group: mod.label,
            parentLabel: item.label,
            path: resolveDynamicPath(child.path, pathContext),
            // Children cannot carry icons per the MenuItem type, so they inherit the
            // group's icon rather than rendering a ragged list.
            icon: item.icon,
            moduleId: mod.id,
          })
        );
      }
    }
  }

  return dedupe(entries);
}

function roleCtx(access: NavAccess) {
  return {
    userRole: access.userRole,
    isTicketAgent: access.privileges.isTicketAgent,
    isTicketAdmin: access.privileges.isTicketAdmin,
  };
}

/**
 * Prefix-owner wins, then first-wins.
 *
 * Real collisions exist: /niyanta/growth-charter and /niyanta/growth-workflow appear in
 * both the Kautilya and Niyanta menus, and /director/* sits in the Niyanta menu while
 * /director is its own module. Those cross-links are a feature in a sidebar and noise in
 * a search index, so the module that actually owns the path keeps the entry.
 */
function dedupe(entries: CommandEntry[]): CommandEntry[] {
  const byPath = new Map<string, CommandEntry>();

  for (const entry of entries) {
    const existing = byPath.get(entry.path);
    if (!existing) {
      byPath.set(entry.path, entry);
      continue;
    }
    const owner = resolveNavModule(entry.path)?.id;
    if (owner && existing.moduleId !== owner && entry.moduleId === owner) {
      byPath.set(entry.path, entry);
    }
  }

  return [...byPath.values()];
}

// ============================================
// MATCHING
// ============================================

const MODULE_ORDER = new Map(MODULES.map((m, i) => [m.id, i]));

/** Scores one entry against one whitespace-free token. Null means "no match". */
function scoreToken(entry: CommandEntry, token: string): number | null {
  const label = entry.label.toLowerCase();

  if (label === token) return 100;
  if (label.startsWith(token)) return 90;

  const at = label.indexOf(token);
  if (at > 0) {
    const isWordBoundary = /[\s\-/]/.test(label[at - 1]);
    return isWordBoundary ? 75 : 65;
  }

  const parent = entry.parentLabel?.toLowerCase() ?? "";
  if (parent.includes(token) || entry.group.toLowerCase().includes(token)) return 50;

  // Lets someone paste or half-remember a URL: "/crm/deals" finds Pipeline.
  if (entry.path.toLowerCase().includes(token)) return 40;

  const subsequence = scoreSubsequence(label, token);
  if (subsequence !== null) return subsequence;

  return null;
}

/** "dp" finds "Daily Plan". Penalised by how spread out the matched letters are. */
function scoreSubsequence(label: string, token: string): number | null {
  let cursor = 0;
  let first = -1;
  let last = -1;

  for (const ch of token) {
    const found = label.indexOf(ch, cursor);
    if (found === -1) return null;
    if (first === -1) first = found;
    last = found;
    cursor = found + 1;
  }

  const span = last - first + 1;
  const gapPenalty = Math.min(15, span - token.length);
  return Math.max(5, 20 - gapPenalty);
}

/**
 * Ranks the index against a query. Multi-word queries are AND: every token must match
 * something, which is what makes "crm deal" behave instead of returning all of CRM.
 */
export function searchCommands(
  index: readonly CommandEntry[],
  query: string,
  limit = 30
): CommandEntry[] {
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const scored: { entry: CommandEntry; score: number }[] = [];

  for (const entry of index) {
    // Cheap reject before scoring: every token must appear somewhere in the haystack,
    // unless it could still land as a subsequence on the label.
    let total = 0;
    let matchedAll = true;

    for (const token of tokens) {
      const score = scoreToken(entry, token);
      if (score === null) {
        matchedAll = false;
        break;
      }
      total += score;
    }

    if (matchedAll) scored.push({ entry, score: total });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Modules above pages, so "crm" opens CRM rather than a page that mentions it.
    if (a.entry.kind !== b.entry.kind) return a.entry.kind === "module" ? -1 : 1;
    if (a.entry.label.length !== b.entry.label.length) {
      return a.entry.label.length - b.entry.label.length;
    }
    return (
      (MODULE_ORDER.get(a.entry.moduleId) ?? 0) -
      (MODULE_ORDER.get(b.entry.moduleId) ?? 0)
    );
  });

  return scored.slice(0, limit).map((s) => s.entry);
}

/**
 * What to show before the user has typed anything. An alphabetical dump of ~200 entries
 * answers nobody's question; "where am I, and where was I" is the actual first-open need.
 */
export function defaultCommands(
  index: readonly CommandEntry[],
  opts: { recentKeys: readonly string[]; currentModuleId: ModuleId | null }
): { recents: CommandEntry[]; currentModule: CommandEntry[]; modules: CommandEntry[] } {
  const byKey = new Map(index.map((e) => [e.key, e]));

  // Resolved against the freshly built index, so a recent that is no longer visible
  // (role changed, tour day regressed, module removed) silently disappears rather than
  // becoming a dead link.
  const recents = opts.recentKeys
    .map((key) => byKey.get(key))
    .filter((e): e is CommandEntry => Boolean(e))
    .slice(0, 5);

  const recentKeySet = new Set(recents.map((e) => e.key));

  const currentModule = opts.currentModuleId
    ? index.filter(
        (e) =>
          e.moduleId === opts.currentModuleId &&
          e.kind === "page" &&
          !recentKeySet.has(e.key)
      )
    : [];

  const modules = index.filter((e) => e.kind === "module" && !recentKeySet.has(e.key));

  return { recents, currentModule, modules };
}
