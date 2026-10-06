/**
 * Option Source Resolver — maps source keys in options TSV to actual labels.
 *
 * Three kinds of options:
 *   1. Inline  — literal values in the TSV `options` column, no source needed.
 *   2. Derived — static data, dynamic subset. Source prefixed `derived:`.
 *                Data lives in a fixed dictionary; which subset to show
 *                depends on prior user selection (e.g. constraint micros).
 *   3. External — data comes from backend/org config. Source prefixed `external:`.
 *                Phase 1: resolved from mock dictionaries.
 *                Phase 2: resolved from API response injected into context.
 *
 * Literal options from the TSV are always appended after resolved ones
 * (e.g. "skip" appears after the 5 resolved labels).
 */

import type { Dictionary, NestedDictionary } from "@/types/aavahana/report-engine.types";
import type { TreeNode } from "./tsv-parser";

// ── Resolver context: all data the resolver can draw from ──

export interface ResolverContext {
  // Derived sources — static dictionaries
  constraints: Dictionary;
  feelings: Dictionary;

  // External sources — backend/org in phase 2, mock in phase 1
  navigations: NestedDictionary;
  frameworks: Dictionary;
  deliverableLabels: string[];

  // Current selections — determine which micro subset to show
  selectedConstraintMacro: string | null;
  selectedConstraintMicro: string | null;
  selectedNavigationMacro: string | null;
  selectedFrameworkMacro: string | null;
  selectedFeelingMacro: string | null;
}

/**
 * Resolve the actual options for a node.
 *
 * - No optionSource → return literal options as-is (inline).
 * - Has optionSource → strip prefix, expand, append literals.
 */
export function resolveOptions(
  node: TreeNode,
  ctx: ResolverContext,
): string[] {
  if (!node.optionSource) return node.options;

  const resolved = expandSource(node.optionSource, ctx);
  // Append any literal options (e.g. "skip", "none of these", "they're all equal")
  return [...resolved, ...node.options];
}

/**
 * Build a label → source ID map for the current node's resolved options.
 * Used by interpretAnswer to store actual SSOT IDs instead of labels.
 */
export function resolveOptionIds(
  node: TreeNode,
  ctx: ResolverContext,
): Record<string, string> {
  if (!node.optionSource) return {};

  const key = node.optionSource.replace(/^(derived|external):/, "");
  return expandSourceIds(key, ctx);
}

/**
 * Strip the derived:/external: prefix and expand to labels.
 * In phase 1, both prefixes resolve from the same mock context.
 * In phase 2, external: sources will resolve from API data.
 */
function expandSource(source: string, ctx: ResolverContext): string[] {
  // Strip prefix
  const key = source.replace(/^(derived|external):/, "");

  switch (key) {
    // ── Derived: static data, dynamic subset ──

    case "constraints.micro": {
      if (!ctx.selectedConstraintMacro) return [];
      const micros = ctx.constraints.micro[ctx.selectedConstraintMacro];
      return micros ? micros.map((m) => m.label) : [];
    }

    case "feelings.micro": {
      if (!ctx.selectedFeelingMacro) return [];
      const micros = ctx.feelings.micro[ctx.selectedFeelingMacro];
      return micros ? micros.map((m) => m.label) : [];
    }

    // ── External: backend/org data (mock in phase 1) ──

    case "navigations.macro": {
      if (!ctx.selectedConstraintMicro) return [];
      const dict = ctx.navigations[ctx.selectedConstraintMicro];
      return dict ? dict.macro.map((m) => m.label) : [];
    }

    case "navigations.micro": {
      if (!ctx.selectedConstraintMicro || !ctx.selectedNavigationMacro) return [];
      const dict = ctx.navigations[ctx.selectedConstraintMicro];
      if (!dict) return [];
      const micros = dict.micro[ctx.selectedNavigationMacro];
      return micros ? micros.map((m) => m.label) : [];
    }

    case "frameworks.macro":
      return ctx.frameworks.macro.map((m) => m.label);

    case "frameworks.micro": {
      if (!ctx.selectedFrameworkMacro) return [];
      const micros = ctx.frameworks.micro[ctx.selectedFrameworkMacro];
      return micros ? micros.map((m) => m.label) : [];
    }

    case "deliverables":
      return ctx.deliverableLabels;

    default:
      console.warn(`[option-resolver] Unknown source: "${source}" (key: "${key}")`);
      return [];
  }
}

/**
 * Build label → ID map for sources that use SSOT IDs.
 */
function expandSourceIds(key: string, ctx: ResolverContext): Record<string, string> {
  const map: Record<string, string> = {};

  switch (key) {
    case "constraints.micro": {
      if (!ctx.selectedConstraintMacro) return map;
      const micros = ctx.constraints.micro[ctx.selectedConstraintMacro];
      if (micros) micros.forEach((m) => { map[m.label] = m.id; });
      return map;
    }

    case "navigations.macro": {
      if (!ctx.selectedConstraintMicro) return map;
      const dict = ctx.navigations[ctx.selectedConstraintMicro];
      if (dict) dict.macro.forEach((m) => { map[m.label] = m.id; });
      return map;
    }

    case "navigations.micro": {
      if (!ctx.selectedConstraintMicro || !ctx.selectedNavigationMacro) return map;
      const dict = ctx.navigations[ctx.selectedConstraintMicro];
      if (!dict) return map;
      const micros = dict.micro[ctx.selectedNavigationMacro];
      if (micros) micros.forEach((m) => { map[m.label] = m.id; });
      return map;
    }

    case "feelings.micro": {
      if (!ctx.selectedFeelingMacro) return map;
      const micros = ctx.feelings.micro[ctx.selectedFeelingMacro];
      if (micros) micros.forEach((m) => { map[m.label] = m.id; });
      return map;
    }

    case "frameworks.macro": {
      ctx.frameworks.macro.forEach((m) => { map[m.label] = m.id; });
      return map;
    }

    case "frameworks.micro": {
      if (!ctx.selectedFrameworkMacro) return map;
      const micros = ctx.frameworks.micro[ctx.selectedFrameworkMacro];
      if (micros) micros.forEach((m) => { map[m.label] = m.id; });
      return map;
    }

    default:
      return map;
  }
}
