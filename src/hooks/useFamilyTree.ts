import { useRef, useState, useCallback, useEffect } from 'react';
import { FamilyTree } from '../lib/kinship';

export type RelType = 'child_of' | 'parent_of' | 'spouse_of' | 'sibling_of';

export interface AddPersonArgs {
  name: string;
  gender: 'M' | 'F';
  birthYear?: number;
  relType?: RelType;
  relId?: string;
}

interface PersonRow {
  id: string; name: string; gender: string;
  birth_year: number | null; birth_order: number | null;
  father_id: string | null; mother_id: string | null; spouse_id: string | null;
}

function buildTree(rows: PersonRow[]): FamilyTree {
  const tree = new FamilyTree();
  for (const r of rows) {
    tree.addPerson({
      id: r.id, name: r.name,
      gender: r.gender as 'M' | 'F',
      birthYear: r.birth_year,
      birthOrder: r.birth_order,
    });
  }
  for (const r of rows) {
    if (r.father_id || r.mother_id)
      tree.setParents(r.id, { fatherId: r.father_id, motherId: r.mother_id });
    if (r.spouse_id && !tree.people.get(r.id)!.spouseId)
      tree.setSpouse(r.id, r.spouse_id);
  }
  return tree;
}

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, init);
  const text = await res.text();
  if (!text) throw new Error(`API returned empty response (HTTP ${res.status}). Is the server running?`);
  let data: unknown;
  try { data = JSON.parse(text); }
  catch { throw new Error(`API returned non-JSON (HTTP ${res.status}): ${text.slice(0, 120)}`); }
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  return data;
}

export function useFamilyTree() {
  const treeRef = useRef<FamilyTree>(new FamilyTree());
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [egoId, setEgoId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const rows = await apiFetch('/api/persons') as PersonRow[];
      treeRef.current = buildTree(rows);
      setApiError(null);
      setVersion(v => v + 1);
    } catch (e) {
      setApiError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const handleCardClick = useCallback((id: string) => {
    setEgoId(prev => {
      if (!prev)       { setTargetId(null); return id; }
      if (id === prev) { setTargetId(null); return null; }
      setTargetId(id); return prev;
    });
  }, []);

  const addPerson = useCallback(async (args: AddPersonArgs): Promise<string | null> => {
    try {
      await apiFetch('/api/persons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: args.name, gender: args.gender,
          birth_year: args.birthYear ?? null,
          rel_type: args.relType, rel_id: args.relId,
        }),
      });
      await reload();
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  }, [reload]);

  const updatePerson = useCallback(async (id: string, changes: {
    name?: string; gender?: 'M' | 'F'; birthYear?: number | null;
    fatherId?: string | null; motherId?: string | null; spouseId?: string | null;
  }): Promise<string | null> => {
    try {
      await apiFetch(`/api/persons/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: changes.name,
          gender: changes.gender,
          birth_year: changes.birthYear,
          father_id: changes.fatherId,
          mother_id: changes.motherId,
          spouse_id: changes.spouseId,
        }),
      });
      await reload();
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  }, [reload]);

  const deletePerson = useCallback(async (id: string): Promise<string | null> => {
    try {
      await apiFetch(`/api/persons/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (egoId === id) setEgoId(null);
      if (targetId === id) setTargetId(null);
      await reload();
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  }, [reload, egoId, targetId]);

  return { tree: treeRef.current, version, loading, apiError, egoId, targetId, handleCardClick, addPerson, updatePerson, deletePerson };
}
