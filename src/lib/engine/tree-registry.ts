/**
 * TreeRegistry — stable node addressing with fractional indexing.
 *
 * Replaces the plain nodeMap + baked children[] pattern with a structured
 * registry that provides O(1) lookup, position-sorted children, computed
 * depth/breadth addresses, and graph mutation methods.
 *
 * Two internal indices:
 *   nodes      — Map<id, TreeNode>     O(1) by ID
 *   childIndex — Map<parentId, id[]>   parent → sorted child IDs
 */

import { generateKeyBetween } from "fractional-indexing";
import type { TreeNode } from "./tsv-parser";

// ── Address entry for pathFromRoot ──

export interface AddressEntry {
  id: string;
  depth: number;
  breadth: number;
}

// ── TreeRegistry ──

export class TreeRegistry {
  private nodes: Map<string, TreeNode>;
  private childIndex: Map<string, string[]>;
  private rootIds: string[];

  constructor(flatNodes: TreeNode[]) {
    this.nodes = new Map();
    this.childIndex = new Map();
    this.rootIds = [];

    // Pass 1: index all nodes
    for (const n of flatNodes) {
      this.nodes.set(n.id, n);
    }

    // Pass 2: group children by parentId
    const unsorted = new Map<string, TreeNode[]>();
    for (const n of flatNodes) {
      const parentKey = n.parentId ?? "__ROOT__";
      const list = unsorted.get(parentKey) ?? [];
      list.push(n);
      unsorted.set(parentKey, list);
    }

    // Pass 3: sort each sibling group by position, store IDs
    for (const [parentKey, siblings] of unsorted) {
      siblings.sort((a, b) => (a.position < b.position ? -1 : a.position > b.position ? 1 : 0));
      const ids = siblings.map((n) => n.id);
      if (parentKey === "__ROOT__") {
        this.rootIds = ids;
      } else {
        this.childIndex.set(parentKey, ids);
      }
    }

    // Sync TreeNode.children arrays for backward compat
    this.syncChildren();
  }

  // ── Lookups ──

  get(id: string): TreeNode | null {
    return this.nodes.get(id) ?? null;
  }

  children(parentId: string): TreeNode[] {
    const ids = this.childIndex.get(parentId) ?? [];
    return ids.map((id) => this.nodes.get(id)!).filter(Boolean);
  }

  childIds(parentId: string): string[] {
    return this.childIndex.get(parentId) ?? [];
  }

  roots(): TreeNode[] {
    return this.rootIds.map((id) => this.nodes.get(id)!).filter(Boolean);
  }

  depth(id: string): number {
    let d = 0;
    let node = this.nodes.get(id);
    while (node?.parentId) {
      d++;
      node = this.nodes.get(node.parentId);
    }
    return d;
  }

  breadth(id: string): number {
    const node = this.nodes.get(id);
    if (!node) return 0;
    const siblingIds = node.parentId
      ? (this.childIndex.get(node.parentId) ?? [])
      : this.rootIds;
    return siblingIds.indexOf(id);
  }

  pathFromRoot(id: string): AddressEntry[] {
    const path: AddressEntry[] = [];
    let current = this.nodes.get(id);
    while (current) {
      path.unshift({
        id: current.id,
        depth: this.depth(current.id),
        breadth: this.breadth(current.id),
      });
      current = current.parentId ? this.nodes.get(current.parentId) : undefined;
    }
    return path;
  }

  get nodeCount(): number {
    return this.nodes.size;
  }

  get decisionCount(): number {
    let count = 0;
    for (const n of this.nodes.values()) {
      if (n.type === "decision") count++;
    }
    return count;
  }

  // ── Graph ops (design-time) ──

  insert(node: TreeNode, afterId?: string): void {
    this.nodes.set(node.id, node);
    const parentKey = node.parentId ?? "__ROOT__";
    const siblings = parentKey === "__ROOT__" ? this.rootIds : (this.childIndex.get(parentKey) ?? []);

    if (afterId) {
      const idx = siblings.indexOf(afterId);
      const afterPos = this.nodes.get(afterId)?.position ?? null;
      const nextId = siblings[idx + 1];
      const nextPos = nextId ? (this.nodes.get(nextId)?.position ?? null) : null;
      node.position = generateKeyBetween(afterPos, nextPos);
      siblings.splice(idx + 1, 0, node.id);
    } else {
      // Append at end
      const lastId = siblings[siblings.length - 1];
      const lastPos = lastId ? (this.nodes.get(lastId)?.position ?? null) : null;
      node.position = generateKeyBetween(lastPos, null);
      siblings.push(node.id);
    }

    if (parentKey !== "__ROOT__") {
      this.childIndex.set(parentKey, siblings);
    }
    this.syncChildren();
  }

  remove(id: string): void {
    const node = this.nodes.get(id);
    if (!node) return;

    // Cascade: remove all descendants first
    const childIds = this.childIndex.get(id) ?? [];
    for (const childId of [...childIds]) {
      this.remove(childId);
    }

    // Remove from parent's child list
    const parentKey = node.parentId ?? "__ROOT__";
    if (parentKey === "__ROOT__") {
      this.rootIds = this.rootIds.filter((rid) => rid !== id);
    } else {
      const siblings = this.childIndex.get(parentKey);
      if (siblings) {
        this.childIndex.set(parentKey, siblings.filter((sid) => sid !== id));
      }
    }

    // Remove node and its child index entry
    this.childIndex.delete(id);
    this.nodes.delete(id);
    this.syncChildren();
  }

  move(id: string, newParentId: string, afterId?: string): void {
    const node = this.nodes.get(id);
    if (!node) return;

    // Remove from old parent
    const oldParentKey = node.parentId ?? "__ROOT__";
    if (oldParentKey === "__ROOT__") {
      this.rootIds = this.rootIds.filter((rid) => rid !== id);
    } else {
      const oldSiblings = this.childIndex.get(oldParentKey);
      if (oldSiblings) {
        this.childIndex.set(oldParentKey, oldSiblings.filter((sid) => sid !== id));
      }
    }

    // Update parent
    node.parentId = newParentId;

    // Insert into new parent
    const newSiblings = this.childIndex.get(newParentId) ?? [];
    if (afterId) {
      const idx = newSiblings.indexOf(afterId);
      const afterPos = this.nodes.get(afterId)?.position ?? null;
      const nextId = newSiblings[idx + 1];
      const nextPos = nextId ? (this.nodes.get(nextId)?.position ?? null) : null;
      node.position = generateKeyBetween(afterPos, nextPos);
      newSiblings.splice(idx + 1, 0, id);
    } else {
      const lastId = newSiblings[newSiblings.length - 1];
      const lastPos = lastId ? (this.nodes.get(lastId)?.position ?? null) : null;
      node.position = generateKeyBetween(lastPos, null);
      newSiblings.push(id);
    }
    this.childIndex.set(newParentId, newSiblings);
    this.syncChildren();
  }

  reorder(parentId: string, orderedIds: string[]): void {
    // Reassign positions to match the new order
    let prev: string | null = null;
    for (const id of orderedIds) {
      const node = this.nodes.get(id);
      if (node) {
        node.position = generateKeyBetween(prev, null);
        prev = node.position;
      }
    }

    if (parentId === "__ROOT__") {
      this.rootIds = orderedIds;
    } else {
      this.childIndex.set(parentId, orderedIds);
    }
    this.syncChildren();
  }

  // ── Compat ──

  /** Returns a Record<id, TreeNode> for ParsedTree.nodeMap backward compat. */
  toNodeMap(): Record<string, TreeNode> {
    const map: Record<string, TreeNode> = {};
    for (const [id, node] of this.nodes) {
      map[id] = node;
    }
    return map;
  }

  /** Repopulate each TreeNode.children[] from childIndex, sorted by position. */
  syncChildren(): void {
    // Clear all children arrays
    for (const node of this.nodes.values()) {
      node.children = [];
    }

    // Rebuild from childIndex
    for (const [parentId, childIds] of this.childIndex) {
      const parent = this.nodes.get(parentId);
      if (parent) {
        parent.children = childIds.map((id) => this.nodes.get(id)!).filter(Boolean);
      }
    }
  }
}

// ── Helper: auto-assign fractional positions to nodes that lack them ──

export function assignPositions(nodes: TreeNode[]): void {
  // Group by parentId
  const groups = new Map<string, TreeNode[]>();
  for (const n of nodes) {
    const key = n.parentId ?? "__ROOT__";
    const list = groups.get(key) ?? [];
    list.push(n);
    groups.set(key, list);
  }

  // Assign positions in row order within each group
  for (const siblings of groups.values()) {
    let prev: string | null = null;
    for (const node of siblings) {
      if (!node.position) {
        node.position = generateKeyBetween(prev, null);
      }
      prev = node.position;
    }
  }
}
