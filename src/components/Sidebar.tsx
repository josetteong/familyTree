import { useState } from 'react';
import { FamilyTree } from '../lib/kinship';
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

  const people = [...tree.people.values()].filter(p => !p.id.startsWith('__vp__'));

  if (typeof view === 'object') {
    const person = tree.people.get(view.edit);
    if (!person) { setView('list'); return null; }
    return (
      <EditPanel
        personId={view.edit}
        tree={tree}
        egoId={egoId}
        onBack={() => setView('list')}
        onSetEgo={() => onCardClick(view.edit)}
        onUpdate={onUpdatePerson}
        onDelete={async (id) => { await onDeletePerson(id); setView('list'); return null; }}
      />
    );
  }

  return (
    <aside style={s.aside}>
      <div style={s.tabs}>
        <button style={{ ...s.tab, ...(view === 'list' ? s.tabOn : {}) }} onClick={() => setView('list')}>People</button>
        <button style={{ ...s.tab, ...(view === 'add'  ? s.tabOn : {}) }} onClick={() => setView('add')}>+ Add</button>
      </div>

      {view === 'list' && (
        <div style={s.panel}>
          {people.map(p => (
            <div
              key={p.id}
              style={{ ...s.item, ...(p.id === egoId ? s.itemEgo : {}), ...(p.id === targetId && p.id !== egoId ? s.itemTgt : {}) }}
              onClick={() => setView({ edit: p.id })}
            >
              <div style={{ ...s.av, ...(p.gender === 'M' ? s.avM : s.avF) }}>
                {p.gender === 'M' ? '👨' : '👩'}
              </div>
              <span style={s.pname}>{p.name}</span>
              {p.id === egoId && <span style={{ ...s.badge, ...s.badgeEgo }}>Me</span>}
              {p.id === targetId && p.id !== egoId && <span style={{ ...s.badge, ...s.badgeTgt }}>→</span>}
              <button style={s.btnDel} onClick={e => { e.stopPropagation(); onDeletePerson(p.id); }} title="Delete">✕</button>
            </div>
          ))}
        </div>
      )}

      {view === 'add' && (
        <AddForm people={people} egoId={egoId} onAdd={onAddPerson} onDone={() => setView('list')} />
      )}
    </aside>
  );
}

// ── Edit Panel ────────────────────────────────────────────────────────────────

function EditPanel({ personId, tree, egoId, onBack, onSetEgo, onUpdate, onDelete }: {
  personId: string;
  tree: FamilyTree;
  egoId: string | null;
  onBack: () => void;
  onSetEgo: () => void;
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
  const father  = isReal(person.fatherId)  ? tree.people.get(person.fatherId!)  : null;
  const mother  = isReal(person.motherId)  ? tree.people.get(person.motherId!)  : null;
  const spouse  = isReal(person.spouseId)  ? tree.people.get(person.spouseId!)  : null;
  const children = [...tree.people.values()].filter(p =>
    !p.id.startsWith('__vp__') && (p.fatherId === personId || p.motherId === personId)
  );

  async function saveInfo() {
    setSaving(true); setErr('');
    const e = await onUpdate(personId, {
      name,
      gender,
      birthYear: birthYear ? parseInt(birthYear) : null,
    });
    setSaving(false);
    if (e) setErr(e);
  }

  async function removeLink(field: 'fatherId' | 'motherId' | 'spouseId') {
    setErr('');
    const e = await onUpdate(personId, { [field]: null });
    if (e) setErr(e);
  }

  async function addLink() {
    if (!linkTarget) return;
    setErr('');
    let e: string | null;
    if (linkType === 'childId') {
      // Update the child to point back to this person as a parent
      const field = gender === 'M' ? 'fatherId' : 'motherId';
      e = await onUpdate(linkTarget, { [field]: personId });
    } else {
      e = await onUpdate(personId, { [linkType]: linkTarget });
    }
    if (e) setErr(e);
    else setLinkTarget('');
  }

  const isEgo = personId === egoId;

  return (
    <aside style={s.aside}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderBottom: '1px solid #d8cfc4' }}>
        <button style={s.btnBack} onClick={onBack}>← Back</button>
        <button
          style={{ ...s.btnMe, ...(isEgo ? s.btnMeOn : {}) }}
          onClick={onSetEgo}
        >{isEgo ? '★ Me' : '☆ Set as Me'}</button>
      </div>

      <div style={s.panel}>
        {/* Basic info */}
        <Field label="Name">
          <input style={s.input} value={name} onChange={e => setName(e.target.value)} />
        </Field>
        <Field label="Gender">
          <select style={s.input} value={gender} onChange={e => setGender(e.target.value as 'M' | 'F')}>
            <option value="M">Male 男</option>
            <option value="F">Female 女</option>
          </select>
        </Field>
        <Field label="Birth Year">
          <input style={s.input} type="number" value={birthYear} onChange={e => setBirthYear(e.target.value)} placeholder="optional" />
        </Field>
        <button style={s.btnSave} onClick={saveInfo} disabled={saving}>{saving ? 'Saving…' : 'Save Info'}</button>

        <hr style={s.hr} />

        {/* Relationships */}
        <div style={s.secLabel}>Relationships</div>

        {father  && <RelRow label="Father"   person={father}  onRemove={() => removeLink('fatherId')} />}
        {mother  && <RelRow label="Mother"   person={mother}  onRemove={() => removeLink('motherId')} />}
        {spouse  && <RelRow label="Spouse"   person={spouse}  onRemove={() => removeLink('spouseId')} />}
        {children.length > 0 && (
          <div style={s.childList}>
            <span style={s.relLabel}>Children</span>
            <span style={{ color: '#666', fontSize: '0.78rem' }}>{children.map(c => c.name).join(', ')}</span>
          </div>
        )}

        <hr style={s.hr} />

        {/* Add link */}
        <div style={s.secLabel}>Add relationship</div>
        <Field label="Type">
          <select style={s.input} value={linkType} onChange={e => setLinkType(e.target.value as typeof linkType)}>
            <option value="fatherId">Father</option>
            <option value="motherId">Mother</option>
            <option value="spouseId">Spouse</option>
            <option value="childId">Child</option>
          </select>
        </Field>
        <Field label="Person">
          <select style={s.input} value={linkTarget} onChange={e => setLinkTarget(e.target.value)}>
            <option value="">— choose —</option>
            {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <button style={s.btnSave} onClick={addLink}>Link</button>

        {err && <p style={s.err}>{err}</p>}

        <hr style={s.hr} />
        <button style={s.btnDelete} onClick={() => onDelete(personId)}>Delete {person.name}</button>
      </div>
    </aside>
  );
}

function RelRow({ label, person, onRemove }: { label: string; person: { name: string } | null | undefined; onRemove?: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', padding: '2px 0' }}>
      <span style={s.relLabel}>{label}</span>
      <span style={{ flex: 1, color: person ? '#2c2c2c' : '#ccc' }}>{person?.name ?? '—'}</span>
      {onRemove && <button style={s.btnDel} onClick={onRemove} title="Remove">✕</button>}
    </div>
  );
}

// ── Add Form ──────────────────────────────────────────────────────────────────

function AddForm({ people, egoId: _egoId, onAdd, onDone }: {
  people: ReturnType<FamilyTree['people']['values']> extends IterableIterator<infer T> ? T[] : never;
  egoId: string | null;
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
    <div style={s.panel}>
      <Field label="Name"><input style={s.input} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Grandpa" /></Field>
      <Field label="Gender">
        <select style={s.input} value={gender} onChange={e => setGender(e.target.value as 'M' | 'F')}>
          <option value="M">Male 男</option>
          <option value="F">Female 女</option>
        </select>
      </Field>
      <Field label="Birth Year (optional)">
        <input style={s.input} type="number" value={birthYear} onChange={e => setBirthYear(e.target.value)} placeholder="1960" />
      </Field>
      {!isEmpty && (
        <>
          <hr style={s.hr} />
          <Field label="Relationship">
            <select style={s.input} value={relType} onChange={e => setRelType(e.target.value as RelType)}>
              <option value="child_of">Child of →</option>
              <option value="parent_of">Parent of →</option>
              <option value="spouse_of">Spouse of →</option>
              <option value="sibling_of">Sibling of →</option>
            </select>
          </Field>
          <Field label="Which person?">
            <select style={s.input} value={relId} onChange={e => setRelId(e.target.value)}>
              <option value="">— choose —</option>
              {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <p style={s.note}>Sibling: shares both parents with chosen person.</p>
        </>
      )}
      <button style={s.btnSave} onClick={handleAdd} disabled={saving}>{saving ? 'Saving…' : 'Add to Tree'}</button>
      {error && <p style={s.err}>{error}</p>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {children}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  aside:    { width: 250, flexShrink: 0, background: '#faf5ee', borderRight: '1px solid #d8cfc4', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  tabs:     { display: 'flex', borderBottom: '1px solid #d8cfc4' },
  tab:      { flex: 1, padding: '9px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, color: '#aaa', borderBottom: '2px solid transparent' },
  tabOn:    { color: '#7a4f2e', borderBottom: '2px solid #7a4f2e' },
  panel:    { flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 },
  item:     { display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', borderRadius: 7, cursor: 'pointer', border: '2px solid transparent', background: 'white' },
  itemEgo:  { borderColor: '#7a4f2e', background: '#fef3e2' },
  itemTgt:  { borderColor: '#4a7a2e', background: '#eef5e8' },
  av:       { width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 },
  avM:      { background: '#dce8ff' },
  avF:      { background: '#ffd8e8' },
  pname:    { flex: 1, fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  badge:    { fontSize: '0.62rem', padding: '1px 5px', borderRadius: 9, fontWeight: 700, flexShrink: 0 },
  badgeEgo: { background: '#7a4f2e', color: '#fff' },
  badgeTgt: { background: '#4a7a2e', color: '#fff' },
  btnDel:   { background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: '0.75rem', padding: '0 2px', lineHeight: 1, flexShrink: 0 },
  btnBack:  { background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#7a4f2e', fontWeight: 600, padding: '2px 4px' },
  btnMe:    { marginLeft: 'auto', fontSize: '0.75rem', padding: '3px 10px', borderRadius: 12, border: '1px solid #ccc', background: 'white', cursor: 'pointer', fontWeight: 600, color: '#888' },
  btnMeOn:  { background: '#7a4f2e', color: '#fff', border: '1px solid #7a4f2e' },
  btnSave:  { padding: '7px 0', background: '#7a4f2e', color: '#fff', border: 'none', borderRadius: 7, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' },
  btnDelete:{ padding: '7px 0', background: 'none', color: '#c04040', border: '1px solid #e0a0a0', borderRadius: 7, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' },
  input:    { padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6, fontSize: '0.84rem' },
  hr:       { border: 'none', borderTop: '1px solid #eee', margin: '2px 0' },
  err:      { color: '#c04040', fontSize: '0.75rem', margin: 0 },
  note:     { fontSize: '0.7rem', color: '#bbb', lineHeight: 1.4, margin: 0 },
  secLabel: { fontSize: '0.68rem', fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.05em' },
  relLabel: { fontSize: '0.72rem', color: '#aaa', width: 46, flexShrink: 0 },
  childList:{ display: 'flex', gap: 6, alignItems: 'flex-start', flexWrap: 'wrap' },
};
