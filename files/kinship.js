// kinship.js
// Computes the correct Chinese kinship term between two people from the
// RELATIONSHIP PATH in a family tree — not from a flat lookup table.
//
// Strategy
// --------
// 1. Model the tree as a graph of people with father / mother / spouse links.
// 2. For a blood relationship, find the Lowest Common Ancestor (LCA). The pair
//    (a, b) = (ego's distance up to the LCA, target's distance up to the LCA)
//    plus the genders / birth-orders of the nodes along the way fully determine
//    the Mandarin term.
// 3. For relationships through marriage, resolve the blood part first, then map
//    it to the in-law / spouse term (handles 伯母, 姑父, 舅妈, 岳父, 公公 …).
//
// Rules encoded (the parts that trip people up):
//   • Only father's BROTHERS split by birth order into different roots
//     (伯父 elder vs 叔叔 younger). 姑 / 舅 / 姨 do NOT — age there is a 大/小 prefix.
//   • 堂 vs 表: children of father's brothers are 堂 (same surname line);
//     everyone else's children are 表.
//   • 内 / 外 side flips the whole term: 爷爷 vs 外公, 孙子 vs 外孙, 侄 vs 外甥.

import { TERMS, SPOUSE_OF, lookup } from './terms.js';

export class FamilyTree {
  constructor() {
    this.people = new Map();
  }

  /**
   * @param {{id:string, name?:string, gender:'M'|'F',
   *          birthYear?:number|null, birthOrder?:number|null}} p
   */
  addPerson(p) {
    if (p.gender !== 'M' && p.gender !== 'F') {
      throw new Error(`Person "${p.id}" needs gender 'M' or 'F'`);
    }
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

  setParents(childId, { fatherId = null, motherId = null } = {}) {
    const c = this._get(childId);
    if (fatherId) c.fatherId = fatherId;
    if (motherId) c.motherId = motherId;
    return this;
  }

  setSpouse(aId, bId) {
    this._get(aId).spouseId = bId;
    this._get(bId).spouseId = aId;
    return this;
  }

  // ──────────────────────────────────────────────────────────────
  //  PUBLIC API
  // ──────────────────────────────────────────────────────────────

  /**
   * How `ego` should address `target`.
   * @returns {{key:string, zh:string|null, pinyin?:string, alt?:string,
   *            en:string, side:string, path:string, assumptions:string[]}}
   */
  getTerm(egoId, targetId) {
    const ego = this._get(egoId);
    const target = this._get(targetId);
    const ctx = { assumptions: [], assume(m) { this.assumptions.push(m); } };

    if (egoId === targetId) {
      return { ...lookup('self'), path: 'yourself', assumptions: [] };
    }

    // (1) Direct blood relationship.
    const lca = this._lca(egoId, targetId);
    if (lca) {
      const term = this._resolveBlood(lca, ego, target, ctx);
      return { ...term, path: this._describe(lca, ctx), assumptions: ctx.assumptions };
    }

    // (2) ego ↔ target are spouses.
    if (ego.spouseId === targetId) {
      return {
        ...lookup(target.gender === 'M' ? 'husband' : 'wife'),
        path: 'your spouse',
        assumptions: [],
      };
    }

    // (3) target is the SPOUSE of one of ego's blood relatives  → 伯母, 姑父 …
    if (target.spouseId) {
      const lcaB = this._lca(egoId, target.spouseId);
      if (lcaB) {
        const relative = this._get(target.spouseId);
        const blood = this._resolveBlood(lcaB, ego, relative, ctx);
        const spouseKey = SPOUSE_OF[blood.key];
        if (spouseKey) {
          const desc = this._describe(lcaB, ctx);
          return {
            ...lookup(spouseKey),
            path: `${desc}'s ${target.gender === 'M' ? 'husband' : 'wife'}`,
            assumptions: ctx.assumptions,
          };
        }
      }
    }

    // (4) target is a blood relative of ego's SPOUSE  → in-laws (岳父, 公公 …)
    if (ego.spouseId) {
      const spouse = this._get(ego.spouseId);
      const lcaI = this._lca(ego.spouseId, targetId);
      if (lcaI) {
        const blood = this._resolveBlood(lcaI, spouse, target, ctx);
        const inlaw = this._inLawKey(blood.key, ego.gender);
        if (inlaw) {
          const desc = this._describe(lcaI, ctx, /*fromSpouse*/ true);
          return {
            ...lookup(inlaw),
            path: `your ${ego.gender === 'M' ? 'wife' : 'husband'}'s ${desc}`,
            assumptions: ctx.assumptions,
          };
        }
      }
    }

    // Outside the engine's covered set — degrade gracefully.
    return {
      key: 'unknown',
      zh: null,
      en: `no standard single term — relationship path: ${this._rawPath(egoId, targetId)}`,
      side: 'unknown',
      path: this._rawPath(egoId, targetId),
      assumptions: ctx.assumptions,
    };
  }

  /** Compact one-line label for UI, e.g. "舅舅 (jiùjiu) — mother's brother". */
  label(egoId, targetId) {
    const t = this.getTerm(egoId, targetId);
    if (!t.zh) return t.en;
    return `${t.zh} (${t.pinyin}) — ${t.en}`;
  }

  // ──────────────────────────────────────────────────────────────
  //  BLOOD RESOLUTION
  // ──────────────────────────────────────────────────────────────

  _resolveBlood(lca, ego, target, ctx) {
    const { a, b, egoChain, targetChain } = lca;

    if (b === 0) return this._ancestorTerm(a, egoChain, target);
    if (a === 0) return this._descendantTerm(b, targetChain, target);
    if (a === 1 && b === 1) return this._siblingTerm(ego, target, ctx);
    if (a === 2 && b === 1) return this._parentSiblingTerm(egoChain, target, ctx);
    if (a === 1 && b === 2) return this._siblingChildTerm(targetChain, target);
    if (a === 2 && b === 2) return this._cousinTerm(egoChain, targetChain, ego, target, ctx);

    // Beyond the core set (grand-uncles, removed cousins …).
    return {
      key: 'generic',
      zh: null,
      en: `distant relative (${a} up, ${b} down via common ancestor)`,
      side: 'unknown',
    };
  }

  _ancestorTerm(a, egoChain, target) {
    const paternal = egoChain[1].gender === 'M'; // first hop ego → parent
    const m = target.gender === 'M';
    if (a === 1) return lookup(m ? 'father' : 'mother');
    if (a === 2) return lookup(paternal ? (m ? 'paternal_grandfather' : 'paternal_grandmother')
                                        : (m ? 'maternal_grandfather' : 'maternal_grandmother'));
    if (a === 3) return lookup(paternal ? (m ? 'paternal_great_grandfather' : 'paternal_great_grandmother')
                                        : (m ? 'maternal_great_grandfather' : 'maternal_great_grandmother'));
    return { key: 'generic', zh: null, en: `${a}-generations-up ancestor`, side: paternal ? 'paternal' : 'maternal' };
  }

  _descendantTerm(b, targetChain, target) {
    const m = target.gender === 'M';
    if (b === 1) return lookup(m ? 'son' : 'daughter');
    if (b === 2) {
      const viaSon = targetChain[b - 1].gender === 'M'; // ego's own child on this line
      return lookup(viaSon ? (m ? 'grandson_via_son' : 'granddaughter_via_son')
                           : (m ? 'grandson_via_daughter' : 'granddaughter_via_daughter'));
    }
    return { key: 'generic', zh: null, en: `${b}-generations-down descendant`, side: 'direct' };
  }

  _siblingTerm(ego, target, ctx) {
    const older = this._isOlder(target.id, ego.id, ctx);
    if (target.gender === 'M') return lookup(older ? 'older_brother' : 'younger_brother');
    return lookup(older ? 'older_sister' : 'younger_sister');
  }

  _parentSiblingTerm(egoChain, target, ctx) {
    const parent = egoChain[1];                 // ego's parent — sibling of target
    const paternal = parent.gender === 'M';
    if (paternal) {
      if (target.gender === 'M') {
        // Birth order vs father decides 伯 (elder) vs 叔 (younger).
        const older = this._isOlder(target.id, parent.id, ctx);
        return lookup(older ? 'father_older_brother' : 'father_younger_brother');
      }
      return lookup('father_sister');           // 姑姑 — no birth-order roots
    }
    return lookup(target.gender === 'M' ? 'mother_brother' : 'mother_sister');
  }

  _siblingChildTerm(targetChain, target) {
    const sibling = targetChain[1];             // ego's sibling — parent of target
    if (sibling.gender === 'M') return lookup(target.gender === 'M' ? 'brother_son' : 'brother_daughter');
    return lookup(target.gender === 'M' ? 'sister_son' : 'sister_daughter');
  }

  _cousinTerm(egoChain, targetChain, ego, target, ctx) {
    const egoParent = egoChain[1];              // ego's parent
    const targetParent = targetChain[1];        // target's parent (ego's parent's sibling)
    const paternalSide = egoParent.gender === 'M';
    // 堂 only when both connecting parents are brothers of the same line.
    const tang = paternalSide && targetParent.gender === 'M';
    const older = this._isOlder(target.id, ego.id, ctx); // by the cousins' own ages
    const g = target.gender === 'M' ? 'male' : 'female';
    const key = `${tang ? 'tang' : 'biao'}_${older ? 'older' : 'younger'}_${g}`;
    return lookup(key);
  }

  _inLawKey(bloodKey, egoGender) {
    if (bloodKey === 'father') return egoGender === 'M' ? 'wife_father' : 'husband_father';
    if (bloodKey === 'mother') return egoGender === 'M' ? 'wife_mother' : 'husband_mother';
    return null;
  }

  // ──────────────────────────────────────────────────────────────
  //  GRAPH HELPERS
  // ──────────────────────────────────────────────────────────────

  _get(id) {
    const p = this.people.get(id);
    if (!p) throw new Error(`Unknown person "${id}"`);
    return p;
  }

  // Map ancestorId → { dist, chain:[self,…,ancestor] }, breadth-first up the tree.
  _ancestors(id) {
    const out = new Map();
    const start = this._get(id);
    out.set(id, { dist: 0, chain: [start] });
    let frontier = [{ node: start, chain: [start] }];
    let dist = 0;
    while (frontier.length) {
      dist++;
      const next = [];
      for (const { node, chain } of frontier) {
        for (const pid of [node.fatherId, node.motherId]) {
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

  // Lowest (nearest) common ancestor, minimising a + b.
  _lca(egoId, targetId) {
    const ea = this._ancestors(egoId);
    const ta = this._ancestors(targetId);
    let best = null;
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

  _compareAge(aId, bId) {
    const A = this._get(aId), B = this._get(bId);
    if (A.birthYear != null && B.birthYear != null) {
      return A.birthYear < B.birthYear ? 'older' : A.birthYear > B.birthYear ? 'younger' : 'same';
    }
    if (A.birthOrder != null && B.birthOrder != null) {
      return A.birthOrder < B.birthOrder ? 'older' : A.birthOrder > B.birthOrder ? 'younger' : 'same';
    }
    return 'unknown';
  }

  // Is `aId` older than `bId`? Unknown → assume younger, and record the assumption.
  _isOlder(aId, bId, ctx) {
    const c = this._compareAge(aId, bId);
    if (c === 'unknown') {
      ctx?.assume?.(`Birth order of "${this._get(aId).name}" vs "${this._get(bId).name}" unknown — assumed younger.`);
      return false;
    }
    return c === 'older';
  }

  // ──────────────────────────────────────────────────────────────
  //  PATH DESCRIPTION  (e.g. "your father's elder brother's son")
  // ──────────────────────────────────────────────────────────────

  _describe(lca, ctx, fromSpouse = false) {
    const { a, b, egoChain, targetChain } = lca;
    const parent = n => (n.gender === 'M' ? 'father' : 'mother');
    const child  = n => (n.gender === 'M' ? 'son' : 'daughter');
    const parts = [];

    if (b === 0) {                       // direct ancestor
      for (let i = 0; i < a; i++) parts.push(parent(egoChain[i + 1]));
    } else if (a === 0) {                // direct descendant
      for (let i = b; i >= 1; i--) parts.push(child(targetChain[i - 1]));
    } else {                             // through a common ancestor
      for (let i = 0; i < a - 1; i++) parts.push(parent(egoChain[i + 1]));
      const egoApex = egoChain[a - 1];
      const tgtApex = targetChain[b - 1];
      const older = this._isOlder(tgtApex.id, egoApex.id, ctx);
      if (tgtApex.gender === 'M') parts.push(older ? 'elder brother' : 'younger brother');
      else parts.push(older ? 'elder sister' : 'younger sister');
      for (let i = b - 1; i >= 1; i--) parts.push(child(targetChain[i - 1]));
    }

    const phrase = parts.join("'s ");
    return fromSpouse ? phrase : `your ${phrase}`;
  }

  // Fallback: bare list of links when no standard term applies.
  _rawPath(egoId, targetId) {
    const lca = this._lca(egoId, targetId);
    if (!lca) return 'connected only by marriage';
    return this._describe(lca, { assume() {} });
  }
}
