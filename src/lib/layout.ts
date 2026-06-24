import { FamilyTree } from './kinship';

export const CW = 88;   // circle diameter
export const CH = 88;   // circle diameter (square bounding box)
export const SP = 16;   // spouse gap
export const HG = 32;   // horizontal gap between subtrees
export const VG = 60;   // vertical gap between generations
export const PAD = 48;  // canvas padding

export interface LayoutNode {
  primaryId: string;
  spouseId: string | null;
  children: LayoutNode[];
  x: number;
  y: number;
  sw: number;  // self width (1 or 2 cards)
  tw: number;  // total subtree width
}

export function buildForest(tree: FamilyTree): LayoutNode[] {
  const ppl = tree.people;
  const placed = new Set<string>();

  function mkNode(pid: string): LayoutNode | null {
    if (placed.has(pid)) return null;
    const p = ppl.get(pid);
    if (!p) return null;
    placed.add(pid);

    const node: LayoutNode = {
      primaryId: pid, spouseId: null,
      children: [],
      x: 0, y: 0, sw: CW, tw: 0,
    };

    if (p.spouseId && !placed.has(p.spouseId)) {
      placed.add(p.spouseId);
      node.spouseId = p.spouseId;
      node.sw = CW * 2 + SP;
    }

    const parentIds = [pid, node.spouseId].filter((q): q is string => q !== null);
    const kids = [...ppl.values()]
      .filter(c => !placed.has(c.id) && parentIds.some(q => c.fatherId === q || c.motherId === q))
      .sort((a, b) => (a.birthYear ?? a.birthOrder! * 100 ?? 5000) - (b.birthYear ?? b.birthOrder! * 100 ?? 5000));

    for (const kid of kids) {
      if (placed.has(kid.id)) continue;
      const child = mkNode(kid.id);
      if (child) node.children.push(child);
    }
    return node;
  }

  const isVirtual = (id: string) => id.startsWith('__vp__');

  // Treat virtual-parent children as roots in the layout (virtual parents are invisible)
  const hasParents = new Set(
    [...ppl.values()]
      .filter(p => (p.fatherId && !isVirtual(p.fatherId)) || (p.motherId && !isVirtual(p.motherId)))
      .map(p => p.id)
  );

  // Root = no real parents AND not a married-in spouse (whose partner has real parents)
  const roots = [...ppl.keys()].filter(id => {
    if (isVirtual(id)) return false; // never render virtual nodes
    if (hasParents.has(id)) return false;
    const p = ppl.get(id)!;
    if (p.spouseId && hasParents.has(p.spouseId)) return false;
    return true;
  });

  const hasKids = (id: string) => [...ppl.values()].some(c => c.fatherId === id || c.motherId === id);
  roots.sort((a, b) => (hasKids(b) ? 1 : 0) - (hasKids(a) ? 1 : 0));

  const forest: LayoutNode[] = [];
  for (const id of roots) {
    if (placed.has(id)) continue;
    const node = mkNode(id);
    if (node) forest.push(node);
  }
  return forest;
}

export function calcTW(node: LayoutNode): number {
  if (!node.children.length) {
    node.tw = node.sw + HG;
    return node.tw;
  }
  const childSum = node.children.reduce((s, c) => s + calcTW(c), 0);
  node.tw = Math.max(node.sw + HG, childSum);
  return node.tw;
}

export function assignPos(node: LayoutNode, left: number, y: number): void {
  node.y = y;
  if (!node.children.length) {
    node.x = left + (node.tw - node.sw) / 2;
    return;
  }
  const childSum = node.children.reduce((s, c) => s + c.tw, 0);
  let cx = left + (node.tw - childSum) / 2;
  for (const child of node.children) {
    assignPos(child, cx, y + CH + VG);
    cx += child.tw;
  }
  const fc = node.children[0];
  const lc = node.children[node.children.length - 1];
  node.x = (fc.x + lc.x + lc.sw - node.sw) / 2;
}

export function flatten(forest: LayoutNode[]): LayoutNode[] {
  const out: LayoutNode[] = [];
  const visit = (n: LayoutNode) => { out.push(n); n.children.forEach(visit); };
  forest.forEach(visit);
  return out;
}

export function computeLayout(tree: FamilyTree): { nodes: LayoutNode[]; forest: LayoutNode[]; canvasW: number; canvasH: number } {
  const forest = buildForest(tree);
  forest.forEach(calcTW);
  let cx = PAD;
  for (const root of forest) {
    assignPos(root, cx, PAD);
    cx += root.tw;
  }
  const nodes = flatten(forest);
  const canvasW = nodes.reduce((m, n) => Math.max(m, n.x + n.sw), 0) + PAD;
  const canvasH = nodes.reduce((m, n) => Math.max(m, n.y + CH), 0) + PAD;
  return { nodes, forest, canvasW, canvasH };
}

export function midX(node: LayoutNode): number {
  return node.spouseId ? node.x + node.sw / 2 : node.x + CW / 2;
}
