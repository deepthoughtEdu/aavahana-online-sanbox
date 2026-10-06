/**
 * Adapters — reshape backend API responses into engine-compatible shapes.
 *
 * The tree-walker engine uses Dictionary / NestedDictionary / PlannedDeliverable.
 * Backend endpoints return richer structures. These adapters bridge the gap.
 */

import type {
  Dictionary,
  NestedDictionary,
  MacroOption,
  MicroOption,
  PlannedDeliverable,
} from "@/types/aavahana/report-engine.types";
import type {
  ConstraintsResponse,
  FrameworksResponse,
  FeelingsResponse,
  NavigationsResponse,
} from "@/types/aavahana/report-v7.types";

/**
 * Constraints ontology → Dictionary.
 * Maps constraintTypes[] → { macro[], micro: Record<macroId, micro[]> }.
 */
export function adaptConstraints(data: ConstraintsResponse): Dictionary {
  const macro: MacroOption[] = [];
  const micro: Record<string, MicroOption[]> = {};

  for (const ct of data.constraintTypes) {
    macro.push({ id: ct.key, label: ct.label });
    micro[ct.key] = ct.subConstraints.map((sc) => ({
      id: sc.key,
      label: sc.label,
    }));
  }

  return { macro, micro };
}

/**
 * Navigations ontology → NestedDictionary.
 * Backend already returns the right shape — just type-cast.
 */
export function adaptNavigations(data: NavigationsResponse): NestedDictionary {
  const result: NestedDictionary = {};

  for (const [constraintMicroId, dict] of Object.entries(data.navigations)) {
    result[constraintMicroId] = {
      macro: dict.macro.map((m) => ({ id: m.id, label: m.label })),
      micro: Object.fromEntries(
        Object.entries(dict.micro).map(([macroId, micros]) => [
          macroId,
          micros.map((m) => ({ id: m.id, label: m.label })),
        ]),
      ),
    };
  }

  return result;
}

/**
 * Constraint macro → recommended framework horizontals.
 * When user picks a constraint, the corresponding horizontals are
 * sorted first in the framework picker and tagged with `pairedWith`.
 */
export const CONSTRAINT_HORIZONTAL_MAP: Record<string, string[]> = {
  budget: ["H3", "H5"],
  talent: ["H4"],
  internal_support: ["H3", "H2"],
  assumptions: ["H5", "H4"],
  permissions: ["H5"],
};

/**
 * Frameworks registry → Dictionary.
 * Flattens domains → verticals → cells → frameworks into macro/micro.
 * Macro = horizontal domain (H1-H5), Micro = individual frameworks within.
 */
export function adaptFrameworks(data: FrameworksResponse): Dictionary {
  const macro: MacroOption[] = [];
  const micro: Record<string, MicroOption[]> = {};

  for (const domain of data.domains) {
    const macroId = domain.horizontalTag;
    macro.push({ id: macroId, label: domain.domain });
    micro[macroId] = [];

    for (const vert of domain.verticals) {
      for (const cell of vert.cells) {
        for (const fw of cell.frameworks) {
          micro[macroId].push({
            id: String(fw.id),
            label: fw.name,
          });
        }
      }
    }
  }

  return { macro, micro };
}

/**
 * Re-sort a frameworks Dictionary so recommended horizontals appear first.
 * Call this with the current constraint macro ID when building resolver context.
 * Returns a new Dictionary — does not mutate the original.
 */
export function sortFrameworksByConstraint(
  frameworks: Dictionary,
  constraintMacroId: string | null,
): Dictionary {
  if (!constraintMacroId) return frameworks;

  const recommended = new Set(CONSTRAINT_HORIZONTAL_MAP[constraintMacroId] ?? []);
  if (recommended.size === 0) return frameworks;

  const sorted = [...frameworks.macro]
    .map((m) => ({
      ...m,
      ...(recommended.has(m.id) ? { pairedWith: constraintMacroId } : {}),
    }))
    .sort((a, b) => {
      const aRec = recommended.has(a.id) ? 0 : 1;
      const bRec = recommended.has(b.id) ? 0 : 1;
      return aRec - bRec;
    });

  return { macro: sorted, micro: frameworks.micro };
}

/**
 * Feelings ontology → Dictionary.
 * feelingTypes[] → { macro[], micro: Record<macroId, micro[]> }.
 */
export function adaptFeelings(data: FeelingsResponse): Dictionary {
  const macro: MacroOption[] = [];
  const micro: Record<string, MicroOption[]> = {};

  for (const ft of data.feelingTypes) {
    macro.push({ id: ft.id, label: ft.label });
    micro[ft.id] = ft.micros.map((m) => ({
      id: m.id,
      label: m.label,
    }));
  }

  return { macro, micro };
}

/**
 * Section A context → PlannedDeliverable[].
 * Maps backend plannedItems to engine shape.
 */
export function adaptDeliverables(
  plannedItems: {
    taskId: string;
    text: string;
    budgetMins: number;
    gridSlot?: string;
    isCriticalPath?: boolean;
    basketItemId?: string;
  }[],
): PlannedDeliverable[] {
  return plannedItems.map((item, index) => ({
    id: index,
    planTaskId: item.taskId,
    gridSlot: item.gridSlot ?? "",
    label: item.text,
    estimateMins: item.budgetMins,
    actualMins: item.budgetMins,
    isCriticalPath: item.isCriticalPath ?? false,
    status: null,
    qaStatus: null,
    basketItemId: item.basketItemId,
  }));
}
