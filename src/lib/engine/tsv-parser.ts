/**
 * TSV Parser for decision tree files.
 *
 * Three-file architecture per section:
 *   flow  — tree structure (id, parent, type, condition, target)
 *   copy  — human-facing text (id, text)
 *   options — user choices (id, options, source)
 *
 * The parser merges all three on `id` to produce TreeNodes.
 * Legacy single-file format (all columns in one TSV) is still supported.
 */

import { TreeRegistry, assignPositions } from "./tree-registry";

// ── Node types matching TSV `type` column ──
export type NodeType =
  | "start"
  | "end"
  | "question"
  | "answer"
  | "decision"
  | "ack"
  | "action"
  | "bridge"
  | "signal"
  | "nudge"
  | "compassion"
  | "elevate";

// ── Parsed node from one TSV row ──
export interface TreeNode {
  id: string;
  parentId: string | null;
  type: NodeType;
  text: string;
  condition: string | null;
  options: string[];
  optionSource: string | null;
  target: string | null;
  children: TreeNode[];
  position: string;   // fractional index for stable sibling order
  agent: boolean;      // agent subtree flag — subtree collapses to one node
}

// ── Parsed tree: roots + lookup map ──
export interface ParsedTree {
  roots: TreeNode[];
  nodeMap: Record<string, TreeNode>;
  nodeCount: number;
  decisionCount: number;
  registry: TreeRegistry;
}

// ── Internal row types for each file ──

interface FlowRow {
  id: string;
  parentId: string | null;
  type: NodeType;
  condition: string | null;
  target: string | null;
  position: string | null;
  agent: boolean;
}

interface CopyRow {
  id: string;
  text: string;
}

interface OptionsRow {
  id: string;
  options: string[];
  source: string | null;
}

// ── Generic TSV row parser ──

function parseTsvRows(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split("\t").map((h) => h.trim().toLowerCase());
  const rows = lines.slice(1).map((line) => {
    const cols = line.split("\t").map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] || "";
    });
    return row;
  });

  return { headers, rows };
}

const nil = (v: string) => (!v || v === "-" ? null : v);

// ── Parse flow TSV ──

function parseFlowRows(text: string): FlowRow[] {
  const { headers, rows } = parseTsvRows(text);
  const hasPosition = headers.includes("position");
  const hasAgent = headers.includes("agent");
  return rows.map((r) => ({
    id: r.id || "",
    parentId: nil(r.parent || ""),
    type: (r.type || "action") as NodeType,
    condition: nil(r.condition || ""),
    target: nil(r.target || ""),
    position: hasPosition ? nil(r.position || "") : null,
    agent: hasAgent ? r.agent === "true" : false,
  }));
}

// ── Parse copy TSV ──

function parseCopyRows(text: string): Map<string, CopyRow> {
  const { rows } = parseTsvRows(text);
  const map = new Map<string, CopyRow>();
  for (const r of rows) {
    if (r.id) map.set(r.id, { id: r.id, text: r.text || "" });
  }
  return map;
}

// ── Parse options TSV ──

function parseOptionsRows(text: string): Map<string, OptionsRow> {
  const { rows } = parseTsvRows(text);
  const map = new Map<string, OptionsRow>();
  for (const r of rows) {
    if (!r.id) continue;
    const optionsRaw = nil(r.options || "");
    map.set(r.id, {
      id: r.id,
      options: optionsRaw ? optionsRaw.split("|").map((o) => o.trim()) : [],
      source: nil(r.source || ""),
    });
  }
  return map;
}

// ── Merge flow + copy + options into TreeNodes ──

function mergeToNodes(
  flowRows: FlowRow[],
  copyMap: Map<string, CopyRow>,
  optionsMap: Map<string, OptionsRow>,
): TreeNode[] {
  return flowRows.map((f) => {
    const copy = copyMap.get(f.id);
    const opts = optionsMap.get(f.id);

    return {
      id: f.id,
      parentId: f.parentId,
      type: f.type,
      text: copy?.text ?? "",
      condition: f.condition,
      options: opts?.options ?? [],
      optionSource: opts?.source ?? null,
      target: f.target,
      children: [],
      position: f.position ?? "",
      agent: f.agent,
    };
  });
}

/**
 * Build tree structure from flat node array using parentId references.
 * Uses TreeRegistry for stable addressing and fractional-indexed sibling order.
 */
function buildTree(nodes: TreeNode[]): ParsedTree {
  // Auto-assign fractional positions for nodes that lack them (backward compat)
  assignPositions(nodes);

  const registry = new TreeRegistry(nodes);
  return {
    roots: registry.roots(),
    nodeMap: registry.toNodeMap(),
    nodeCount: registry.nodeCount,
    decisionCount: registry.decisionCount,
    registry,
  };
}

/**
 * Parse three split TSV files and return a complete tree structure.
 * This is the primary entry point for the three-file architecture.
 */
export function parseSplitTSV(
  flowText: string,
  copyText: string,
  optionsText: string,
): ParsedTree {
  const flowRows = parseFlowRows(flowText);
  const copyMap = parseCopyRows(copyText);
  const optionsMap = parseOptionsRows(optionsText);
  const nodes = mergeToNodes(flowRows, copyMap, optionsMap);
  return buildTree(nodes);
}

/**
 * Legacy: Parse a single combined TSV file.
 * Kept for backward compatibility during migration.
 */
export function parseTSV(text: string): ParsedTree {
  const { headers, rows } = parseTsvRows(text);
  const hasText = headers.includes("text");
  const hasOptions = headers.includes("options");

  const hasPosition = headers.includes("position");
  const hasAgent = headers.includes("agent");

  const nodes: TreeNode[] = rows.map((r) => {
    const optionsRaw = nil(r.options || "");
    return {
      id: r.id || "",
      parentId: nil(r.parent || ""),
      type: (r.type || "action") as NodeType,
      text: hasText ? (r.text || "") : "",
      condition: nil(r.condition || ""),
      options: hasOptions && optionsRaw ? optionsRaw.split("|").map((o) => o.trim()) : [],
      optionSource: null,
      target: nil(r.target || ""),
      children: [],
      position: hasPosition ? (nil(r.position || "") ?? "") : "",
      agent: hasAgent ? r.agent === "true" : false,
    };
  });

  return buildTree(nodes);
}

/**
 * Find the start node in a parsed tree.
 * Returns the first node of type "start", or the first root.
 */
export function findStartNode(tree: ParsedTree): TreeNode | null {
  const start = Object.values(tree.nodeMap).find((n) => n.type === "start");
  return start ?? tree.roots[0] ?? null;
}

/**
 * Get all ancestors of a node (upstream path to root).
 */
export function getAncestors(
  nodeId: string,
  tree: ParsedTree,
): TreeNode[] {
  const result: TreeNode[] = [];
  let current = tree.nodeMap[nodeId];
  while (current?.parentId && tree.nodeMap[current.parentId]) {
    current = tree.nodeMap[current.parentId];
    result.push(current);
  }
  return result;
}
