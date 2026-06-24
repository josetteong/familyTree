import { TERMS, SPOUSE_OF, lookup, TermRecord } from './terms';

export interface Person {
  id: string;
  name: string;
  gender: 'M' | 'F';
  birthYear: number | null;
  birthOrder: number | null;
  fatherId: string | null;
  motherId: string | null;
  spouseId: string | null;
}

export interface KinshipResult extends TermRecord {
  key: string;
  path: string;
  assumptions: string[];
}

interface LCA {
  lcaId: string;
  a: number;
  b: number;
  egoChain: Person[];
  targetChain: Person[];
  total: number;
}

interface Ctx {
  assumptions: string[];
  assume(msg: string): void;
}

export class FamilyTree {
  people = new Map<string, Person>();

  addPerson(p: { id: string; name?: string; gender: 'M' | 'F'; birthYear?: number | null; birthOrder?: number | null }): this {
    if (p.gender !== 'M' && p.gender !== 'F') throw new Error(`Person "${p.id}" needs gender 'M' or 'F'`);
    this.people.set(p.id, {
      id: p.id,
      name: p.name ?? p.id,
      gender: p.gender,
      birthYear: p.birthYear ?? null,
      birthOrder: p.birthOrder ?? null,
      fatherId: null,
      motherId: null,
      spouseId: null,
    });
    return this;
  }

  setParents(childId: string, { fatherId = null, motherId = null }: { fatherId?: string | null; motherId?: string | null } = {}): this {
    const c = this._get(childId);
    if (fatherId) c.fatherId = fatherId;
    if (motherId) c.motherId = motherId;
    return this;
  }

  setSpouse(aId: string, bId: string): this {
    this._get(aId).spouseId = bId;
    this._get(bId).spouseId = aId;
    return this;
  }

  getTerm(egoId: string, targetId: string): KinshipResult {
    const ego = this._get(egoId);
    const target = this._get(targetId);
    const ctx: Ctx = { assumptions: [], assume(m) { this.assumptions.push(m); } };

    if (egoId === targetId) return { ...lookup('self'), path: 'yourself', assumptions: [] };

    const lca = this._lca(egoId, targetId);
    if (lca) {
      const term = this._resolveBlood(lca, ego, target, ctx);
      return { ...term, path: this._describe(lca, ctx), assumptions: ctx.assumptions };
    }

    if (ego.spouseId === targetId) {
      return { ...lookup(target.gender === 'M' ? 'husband' : 'wife'), path: 'your spouse', assumptions: [] };
    }

    if (target.spouseId) {
      const lcaB = this._lca(egoId, target.spouseId);
      if (lcaB) {
        const relative = this._get(target.spouseId);
        const blood = this._resolveBlood(lcaB, ego, relative, ctx);
        const spouseKey = SPOUSE_OF[blood.key];
        if (spouseKey) {
          return {
            ...lookup(spouseKey),
            path: `${this._describe(lcaB, ctx)}'s ${target.gender === 'M' ? 'husband' : 'wife'}`,
            assumptions: ctx.assumptions,
          };
        }
      }
    }

    if (ego.spouseId) {
      const spouse = this._get(ego.spouseId);
      const lcaI = this._lca(ego.spouseId, targetId);
      if (lcaI) {
        const blood = this._resolveBlood(lcaI, spouse, target, ctx);
        const inlaw = this._inLawKey(blood.key, ego.gender);
        if (inlaw) {
          return {
            ...lookup(inlaw),
            path: `your ${ego.gender === 'M' ? 'wife' : 'husband'}'s ${this._describe(lcaI, ctx, true)}`,
            assumptions: ctx.assumptions,
          };
        }
      }
    }

    return {
      key: 'unknown',
      zh: '' as unknown as string,
      pinyin: '',
      en: `no standard term — path: ${this._rawPath(egoId, targetId)}`,
      side: 'direct',
      path: this._rawPath(egoId, targetId),
      assumptions: ctx.assumptions,
    } as KinshipResult;
  }

  label(egoId: string, targetId: string): string {
    const t = this.getTerm(egoId, targetId);
    if (!t.zh) return t.en;
    return `${t.zh} (${t.pinyin}) — ${t.en}`;
  }

  private _resolveBlood(lca: LCA, ego: Person, target: Person, ctx: Ctx): TermRecord & { key: string } {
    const { a, b, egoChain, targetChain } = lca;
    if (b === 0) return this._ancestorTerm(a, egoChain, target);
    if (a === 0) return this._descendantTerm(b, targetChain, target);
    if (a === 1 && b === 1) return this._siblingTerm(ego, target, ctx);
    if (a === 2 && b === 1) return this._parentSiblingTerm(egoChain, target, ctx);
    if (a === 1 && b === 2) return this._siblingChildTerm(targetChain, target);
    if (a === 2 && b === 2) return this._cousinTerm(egoChain, targetChain, ego, target, ctx);
    if (a === 3 && b === 1) return this._grandparentSiblingTerm(egoChain, target, ctx);
    return { key: 'generic', zh: '' as unknown as string, pinyin: '', en: `distant relative (${a} up, ${b} down)`, side: 'direct' } as TermRecord & { key: string };
  }

  private _ancestorTerm(a: number, egoChain: Person[], target: Person): TermRecord & { key: string } {
    const paternal = egoChain[1].gender === 'M';
    const m = target.gender === 'M';
    if (a === 1) return lookup(m ? 'father' : 'mother');
    if (a === 2) return lookup(paternal ? (m ? 'paternal_grandfather' : 'paternal_grandmother') : (m ? 'maternal_grandfather' : 'maternal_grandmother'));
    if (a === 3) return lookup(paternal ? (m ? 'paternal_great_grandfather' : 'paternal_great_grandmother') : (m ? 'maternal_great_grandfather' : 'maternal_great_grandmother'));
    if (a === 4) return lookup(paternal ? (m ? 'paternal_great_great_grandfather' : 'paternal_great_great_grandmother') : (m ? 'maternal_great_great_grandfather' : 'maternal_great_great_grandmother'));
    return { key: 'generic', zh: '' as unknown as string, pinyin: '', en: `${a}-gen ancestor`, side: paternal ? 'paternal' : 'maternal' } as TermRecord & { key: string };
  }

  private _descendantTerm(b: number, targetChain: Person[], target: Person): TermRecord & { key: string } {
    const m = target.gender === 'M';
    if (b === 1) return lookup(m ? 'son' : 'daughter');
    if (b === 2) {
      const viaSon = targetChain[b - 1].gender === 'M';
      return lookup(viaSon ? (m ? 'grandson_via_son' : 'granddaughter_via_son') : (m ? 'grandson_via_daughter' : 'granddaughter_via_daughter'));
    }
    return { key: 'generic', zh: '' as unknown as string, pinyin: '', en: `${b}-gen descendant`, side: 'direct' } as TermRecord & { key: string };
  }

  private _siblingTerm(ego: Person, target: Person, ctx: Ctx): TermRecord & { key: string } {
    const older = this._isOlder(target.id, ego.id, ctx);
    if (target.gender === 'M') return lookup(older ? 'older_brother' : 'younger_brother');
    return lookup(older ? 'older_sister' : 'younger_sister');
  }

  private _parentSiblingTerm(egoChain: Person[], target: Person, ctx: Ctx): TermRecord & { key: string } {
    const parent = egoChain[1];
    if (parent.gender === 'M') {
      if (target.gender === 'M') {
        const older = this._isOlder(target.id, parent.id, ctx);
        return lookup(older ? 'father_older_brother' : 'father_younger_brother');
      }
      return lookup('father_sister');
    }
    return lookup(target.gender === 'M' ? 'mother_brother' : 'mother_sister');
  }

  private _siblingChildTerm(targetChain: Person[], target: Person): TermRecord & { key: string } {
    const sibling = targetChain[1];
    if (sibling.gender === 'M') return lookup(target.gender === 'M' ? 'brother_son' : 'brother_daughter');
    return lookup(target.gender === 'M' ? 'sister_son' : 'sister_daughter');
  }

  private _cousinTerm(egoChain: Person[], targetChain: Person[], ego: Person, target: Person, ctx: Ctx): TermRecord & { key: string } {
    const egoParent = egoChain[1];
    const targetParent = targetChain[1];
    const tang = egoParent.gender === 'M' && targetParent.gender === 'M';
    const older = this._isOlder(target.id, ego.id, ctx);
    const g = target.gender === 'M' ? 'male' : 'female';
    return lookup(`${tang ? 'tang' : 'biao'}_${older ? 'older' : 'younger'}_${g}`);
  }

  private _grandparentSiblingTerm(egoChain: Person[], target: Person, ctx: Ctx): TermRecord & { key: string } {
    const paternal = egoChain[1].gender === 'M';
    const grandparentMale = egoChain[2].gender === 'M';
    const m = target.gender === 'M';
    const older = this._isOlder(target.id, egoChain[2].id, ctx);

    if (paternal) {
      if (grandparentMale) {
        if (m) return lookup(older ? 'paternal_grandfather_older_brother' : 'paternal_grandfather_younger_brother');
        return lookup('paternal_grandfather_sister');
      } else {
        if (m) return lookup('paternal_grandmother_brother');
        return lookup('paternal_grandmother_sister');
      }
    } else {
      if (grandparentMale) {
        if (m) return lookup('maternal_grandfather_brother');
        return lookup('maternal_grandfather_sister');
      } else {
        if (m) return lookup('maternal_grandmother_brother');
        return lookup('maternal_grandmother_sister');
      }
    }
  }

  private _inLawKey(bloodKey: string, egoGender: 'M' | 'F'): string | null {
    if (bloodKey === 'father') return egoGender === 'M' ? 'wife_father' : 'husband_father';
    if (bloodKey === 'mother') return egoGender === 'M' ? 'wife_mother' : 'husband_mother';
    return null;
  }

  private _get(id: string): Person {
    const p = this.people.get(id);
    if (!p) throw new Error(`Unknown person "${id}"`);
    return p;
  }

  private _ancestors(id: string): Map<string, { dist: number; chain: Person[] }> {
    const out = new Map<string, { dist: number; chain: Person[] }>();
    const start = this._get(id);
    out.set(id, { dist: 0, chain: [start] });
    let frontier: { node: Person; chain: Person[] }[] = [{ node: start, chain: [start] }];
    let dist = 0;
    while (frontier.length) {
      dist++;
      const next: typeof frontier = [];
      for (const { node, chain } of frontier) {
        for (const pid of [node.fatherId, node.motherId] as (string | null)[]) {
          if (pid && !out.has(pid)) {
            const pnode = this._get(pid);
            const nchain = [...chain, pnode];
            out.set(pid, { dist, chain: nchain });
            next.push({ node: pnode, chain: nchain });
          }
        }
      }
      frontier = next;
    }
    return out;
  }

  private _lca(egoId: string, targetId: string): LCA | null {
    const ea = this._ancestors(egoId);
    const ta = this._ancestors(targetId);
    let best: LCA | null = null;
    for (const [aid, e] of ea) {
      const t = ta.get(aid);
      if (!t) continue;
      const total = e.dist + t.dist;
      if (!best || total < best.total) {
        best = { lcaId: aid, a: e.dist, b: t.dist, egoChain: e.chain, targetChain: t.chain, total };
      }
    }
    return best;
  }

  private _compareAge(aId: string, bId: string): 'older' | 'younger' | 'same' | 'unknown' {
    const A = this._get(aId), B = this._get(bId);
    if (A.birthYear != null && B.birthYear != null) return A.birthYear < B.birthYear ? 'older' : A.birthYear > B.birthYear ? 'younger' : 'same';
    if (A.birthOrder != null && B.birthOrder != null) return A.birthOrder < B.birthOrder ? 'older' : A.birthOrder > B.birthOrder ? 'younger' : 'same';
    return 'unknown';
  }

  private _isOlder(aId: string, bId: string, ctx?: Ctx): boolean {
    const c = this._compareAge(aId, bId);
    if (c === 'unknown') {
      ctx?.assume(`Birth order of "${this._get(aId).name}" vs "${this._get(bId).name}" unknown — assumed younger.`);
      return false;
    }
    return c === 'older';
  }

  private _describe(lca: LCA, ctx: Ctx, fromSpouse = false): string {
    const { a, b, egoChain, targetChain } = lca;
    const parent = (n: Person) => n.gender === 'M' ? 'father' : 'mother';
    const child  = (n: Person) => n.gender === 'M' ? 'son' : 'daughter';
    const parts: string[] = [];
    if (b === 0) {
      for (let i = 0; i < a; i++) parts.push(parent(egoChain[i + 1]));
    } else if (a === 0) {
      for (let i = b; i >= 1; i--) parts.push(child(targetChain[i - 1]));
    } else {
      for (let i = 0; i < a - 1; i++) parts.push(parent(egoChain[i + 1]));
      const tgtApex = targetChain[b - 1];
      const egoApex = egoChain[a - 1];
      const older = this._isOlder(tgtApex.id, egoApex.id, ctx);
      parts.push(tgtApex.gender === 'M' ? (older ? 'elder brother' : 'younger brother') : (older ? 'elder sister' : 'younger sister'));
      for (let i = b - 1; i >= 1; i--) parts.push(child(targetChain[i - 1]));
    }
    const phrase = parts.join("'s ");
    return fromSpouse ? phrase : `your ${phrase}`;
  }

  private _rawPath(egoId: string, targetId: string): string {
    const lca = this._lca(egoId, targetId);
    if (!lca) return 'connected only by marriage';
    return this._describe(lca, { assumptions: [], assume() {} });
  }
}
