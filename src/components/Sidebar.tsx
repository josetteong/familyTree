import { useState } from 'react';
import { FamilyTree, Person } from '../lib/kinship';
import { RelType, AddPersonArgs } from '../hooks/useFamilyTree';

interface Props {
  tree: FamilyTree;
  egoId: string | null;
  targetId: string | null;
  onCardClick: (id: string) => void;
  onAddPerson: (args: AddPersonArgs) => Promise<string | null>;
  onUpdatePerson: (id: string, changes: Record<string, unknown>) => Promise<string | null>;
  onDeletePerson: (id: string) => Promise<string | null>;
}

type View = 'list' | 'add' | { edit: string };

export default function Sidebar(props: Props) {
  const { tree, egoId, targetId, onCardClick, onAddPerson, onUpdatePerson, onDeletePerson } = props;
  const [view, setView] = useState<View>('list');
  const [collapsed, setCollapsed] = useState(false);

  const people = [...tree.people.values()].filter(p => !p.id.startsWith('__vp__'));

  if (collapsed) {
    return (
      <div className="card bg-base-100 shadow-xl h-full w-10 flex flex-col items-center pt-2 rounded-2xl">
        <button className="btn btn-ghost btn-xs text-base-content/50 text-lg" onClick={() => setCollapsed(false)} title="Expand">›</button>
      </div>
    );
  }

  if (typeof view === 'object') {
    const person = tree.people.get(view.edit);
    if (!person) { setView('list'); return null; }
    return (
      <EditPanel
        personId={view.edit} tree={tree} egoId={egoId}
        onBack={() => setView('list')}
        onSetEgo={() => onCardClick(view.edit)}
        onCollapse={() => setCollapsed(true)}
        onUpdate={onUpdatePerson}
        onDelete={async id => { await onDeletePerson(id); setView('list'); return null; }}
      />
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl h-full w-80 flex flex-col rounded-2xl overflow-hidden relative">
      {/* Collapse button — floats top-right so it doesn't shrink the tabs */}
      <button
        className="absolute top-1 right-1 z-10 btn btn-ghost btn-xs opacity-30 hover:opacity-80 text-base leading-none"
        onClick={() => setCollapsed(true)} title="Collapse"
      >‹</button>

      {/* Tabs — each exactly 50% of sidebar width */}
      <div role="tablist" className="tabs tabs-border shrink-0">
        <button role="tab" className={`tab flex-1 ${view === 'list' ? 'tab-active font-bold' : ''}`} onClick={() => setView('list')}>
          Family
        </button>
        <button role="tab" className={`tab flex-1 ${view === 'add' ? 'tab-active font-bold' : ''}`} onClick={() => setView('add')}>
          + Add
        </button>
      </div>

      {/* People list */}
      {view === 'list' && (
        <ul className="p-3 flex-1 min-h-0 overflow-y-auto flex flex-col gap-2">
          {people.map(p => (
            <li key={p.id} className="list-none">
              <div
                className={`flex items-center gap-3 rounded-2xl cursor-pointer px-3 py-3 w-full
                  ${p.id === egoId ? 'bg-primary/15 text-primary' : 'bg-base-300/70 hover:bg-base-300'}`}
                onClick={() => setView({ edit: p.id })}
              >
                <Avatar person={p} />
                <span className="flex-1 text-base font-medium">{p.name}</span>
                {p.id === egoId && <span className="badge badge-primary badge-sm">Me</span>}
                {p.id === targetId && p.id !== egoId && <span className="badge badge-success badge-sm">→</span>}
                <button
                  className="opacity-30 hover:opacity-80 hover:text-error text-sm leading-none px-1"
                  onClick={e => { e.stopPropagation(); onDeletePerson(p.id); }}
                  title="Delete"
                >✕</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add form */}
      {view === 'add' && (
        <div className="flex-1 overflow-y-auto p-3">
          <AddForm people={people} onAdd={onAddPerson} onDone={() => setView('list')} />
        </div>
      )}
    </div>
  );
}

// ── Edit Panel ────────────────────────────────────────────────────────────────

function EditPanel({ personId, tree, egoId, onBack, onSetEgo, onCollapse, onUpdate, onDelete }: {
  personId: string; tree: FamilyTree; egoId: string | null;
  onBack: () => void; onSetEgo: () => void; onCollapse: () => void;
  onUpdate: (id: string, changes: Record<string, unknown>) => Promise<string | null>;
  onDelete: (id: string) => Promise<string | null>;
}) {
  const person = tree.people.get(personId)!;
  const [name, setName] = useState(person.name);
  const [gender, setGender] = useState(person.gender);
  const [birthYear, setBirthYear] = useState(person.birthYear?.toString() ?? '');
  const [linkType, setLinkType] = useState<'fatherId' | 'motherId' | 'spouseId' | 'childId'>('fatherId');
  const [linkTarget, setLinkTarget] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const people = [...tree.people.values()].filter(p => !p.id.startsWith('__vp__') && p.id !== personId);
  const isReal = (id: string | null | undefined) => id && !id.startsWith('__vp__');
  const father   = isReal(person.fatherId) ? tree.people.get(person.fatherId!) : null;
  const mother   = isReal(person.motherId) ? tree.people.get(person.motherId!) : null;
  const spouse   = isReal(person.spouseId) ? tree.people.get(person.spouseId!) : null;
  const children = [...tree.people.values()].filter(p =>
    !p.id.startsWith('__vp__') && (p.fatherId === personId || p.motherId === personId)
  );
  const isEgo = personId === egoId;

  async function saveInfo() {
    setSaving(true); setErr('');
    const e = await onUpdate(personId, { name, gender, birthYear: birthYear ? parseInt(birthYear) : null });
    setSaving(false);
    if (e) setErr(e);
  }

  async function removeLink(field: string) {
    const e = await onUpdate(personId, { [field]: null });
    if (e) setErr(e);
  }

  async function addLink() {
    if (!linkTarget) return;
    setErr('');
    const e = linkType === 'childId'
      ? await onUpdate(linkTarget, { [gender === 'M' ? 'fatherId' : 'motherId']: personId })
      : await onUpdate(personId, { [linkType]: linkTarget });
    if (e) setErr(e);
    else setLinkTarget('');
  }

  return (
    <div className="card bg-base-100 shadow-xl h-full w-80 flex flex-col rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-base-300 shrink-0">
        <button className="btn btn-ghost btn-xs font-bold" onClick={onBack}>← Back</button>
        <button className={`btn btn-xs ml-auto ${isEgo ? 'btn-primary' : 'btn-outline btn-primary'}`} onClick={onSetEgo}>
          {isEgo ? '★ Me' : '☆ Set as Me'}
        </button>
        <button className="btn btn-ghost btn-xs text-base-content/30 text-base" onClick={onCollapse}>‹</button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-3">
        {/* Info fields */}
        <FormField label="Name">
          <input className="input input-bordered input-sm w-full" value={name} onChange={e => setName(e.target.value)} />
        </FormField>
        <FormField label="Gender">
          <select className="select select-bordered select-sm w-full" value={gender} onChange={e => setGender(e.target.value as 'M' | 'F')}>
            <option value="M">Male 男</option>
            <option value="F">Female 女</option>
          </select>
        </FormField>
        <FormField label="Birth Year">
          <input className="input input-bordered input-sm w-full" type="number" value={birthYear} onChange={e => setBirthYear(e.target.value)} placeholder="optional" />
        </FormField>
        <button className="btn btn-primary btn-sm w-full" onClick={saveInfo} disabled={saving}>
          {saving ? <span className="loading loading-spinner loading-xs" /> : 'Save Info'}
        </button>

        <div className="divider my-0" />

        {/* Current relationships */}
        <p className="text-xs font-bold uppercase text-base-content/40 tracking-widest">Relationships</p>
        {father  && <RelRow label="Father"   name={father.name}  onRemove={() => removeLink('fatherId')} />}
        {mother  && <RelRow label="Mother"   name={mother.name}  onRemove={() => removeLink('motherId')} />}
        {spouse  && <RelRow label="Spouse"   name={spouse.name}  onRemove={() => removeLink('spouseId')} />}
        {children.length > 0 && (
          <div className="text-sm">
            <span className="text-xs text-base-content/40 mr-2">Children</span>
            {children.map(c => c.name).join(', ')}
          </div>
        )}

        <div className="divider my-0" />

        {/* Add link */}
        <p className="text-xs font-bold uppercase text-base-content/40 tracking-widest">Add relationship</p>
        <FormField label="Type">
          <select className="select select-bordered select-sm w-full" value={linkType} onChange={e => setLinkType(e.target.value as typeof linkType)}>
            <option value="fatherId">Father</option>
            <option value="motherId">Mother</option>
            <option value="spouseId">Spouse</option>
            <option value="childId">Child</option>
          </select>
        </FormField>
        <FormField label="Person">
          <select className="select select-bordered select-sm w-full" value={linkTarget} onChange={e => setLinkTarget(e.target.value)}>
            <option value="">— choose —</option>
            {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </FormField>
        <button className="btn btn-primary btn-sm w-full" onClick={addLink}>Link</button>

        {err && <div className="alert alert-error py-2 text-sm">{err}</div>}

        <div className="divider my-0" />
        <button className="btn btn-outline btn-error btn-sm w-full" onClick={() => onDelete(personId)}>
          Delete {person.name}
        </button>
      </div>
    </div>
  );
}

// ── Add Form ──────────────────────────────────────────────────────────────────

function AddForm({ people, onAdd, onDone }: {
  people: Person[];
  onAdd: (args: AddPersonArgs) => Promise<string | null>;
  onDone: () => void;
}) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [birthYear, setBirthYear] = useState('');
  const [relType, setRelType] = useState<RelType>('child_of');
  const [relId, setRelId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEmpty = people.length === 0;

  async function handleAdd() {
    setError(''); setSaving(true);
    const err = await onAdd({ name: name.trim(), gender, birthYear: birthYear ? parseInt(birthYear) : undefined, relType, relId });
    setSaving(false);
    if (err) { setError(err); return; }
    setName(''); setBirthYear('');
    onDone();
  }

  return (
    <div className="flex flex-col gap-3">
      <FormField label="Name">
        <input className="input input-bordered input-sm w-full" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Grandpa" />
      </FormField>
      <FormField label="Gender">
        <select className="select select-bordered select-sm w-full" value={gender} onChange={e => setGender(e.target.value as 'M' | 'F')}>
          <option value="M">Male 男</option>
          <option value="F">Female 女</option>
        </select>
      </FormField>
      <FormField label="Birth Year (optional)">
        <input className="input input-bordered input-sm w-full" type="number" value={birthYear} onChange={e => setBirthYear(e.target.value)} placeholder="1960" />
      </FormField>

      {!isEmpty && (
        <>
          <div className="divider my-0" />
          <FormField label="Relationship">
            <select className="select select-bordered select-sm w-full" value={relType} onChange={e => setRelType(e.target.value as RelType)}>
              <option value="child_of">Child of →</option>
              <option value="parent_of">Parent of →</option>
              <option value="spouse_of">Spouse of →</option>
              <option value="sibling_of">Sibling of →</option>
            </select>
          </FormField>
          <FormField label="Which person?">
            <select className="select select-bordered select-sm w-full" value={relId} onChange={e => setRelId(e.target.value)}>
              <option value="">— choose —</option>
              {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </FormField>
          <p className="text-xs text-base-content/40">Sibling: shares both parents with chosen person.</p>
        </>
      )}

      <button className="btn btn-primary btn-sm w-full" onClick={handleAdd} disabled={saving}>
        {saving ? <span className="loading loading-spinner loading-xs" /> : 'Add to Tree'}
      </button>
      {error && <div className="alert alert-error py-2 text-sm">{error}</div>}
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function Avatar({ person }: { person: Person }) {
  return (
    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0
      ${person.gender === 'M' ? 'bg-blue-100' : 'bg-pink-100'}`}>
      {person.gender === 'M' ? '👨' : '👩'}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="form-control w-full">
      <div className="label py-0.5">
        <span className="label-text text-xs font-bold uppercase tracking-wider text-base-content/50">{label}</span>
      </div>
      {children}
    </label>
  );
}

function RelRow({ label, name, onRemove }: { label: string; name: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-xs text-base-content/40 w-12 shrink-0">{label}</span>
      <span className="flex-1 font-medium">{name}</span>
      <button className="btn btn-ghost btn-xs text-base-content/30 hover:text-error min-h-0 h-auto" onClick={onRemove}>✕</button>
    </div>
  );
}
