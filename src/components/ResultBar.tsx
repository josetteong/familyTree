import { FamilyTree } from '../lib/kinship';

interface Props {
  tree: FamilyTree;
  egoId: string | null;
  targetId: string | null;
}

export default function ResultBar({ tree, egoId, targetId }: Props) {
  if (!egoId) return null;

  const egoName = tree.people.get(egoId)?.name ?? egoId;

  if (!targetId) {
    return (
      <div style={styles.bar}>
        <span style={styles.hint}>
          Click any person to see what <b style={styles.name}>{egoName}</b> calls them →
        </span>
      </div>
    );
  }

  try {
    const t = tree.getTerm(egoId, targetId);
    const tgtName = tree.people.get(targetId)?.name ?? targetId;

    return (
      <div style={styles.bar}>
        <div style={styles.zh}>{t.zh || '—'}</div>
        <div>
          <div style={styles.pinyin}>{t.pinyin ?? ''}</div>
          <div style={styles.en}>{t.en}</div>
        </div>
        <div style={styles.detail}>
          <div style={styles.names}>
            <b style={styles.name}>{egoName}</b>
            <span style={styles.arrow}>→</span>
            <b style={styles.name}>{tgtName}</b>
          </div>
          <div style={styles.path}>{t.path}</div>
          {(t.assumptions ?? []).length > 0 && (
            <div style={styles.warn}>⚠ {t.assumptions[0]}</div>
          )}
        </div>
      </div>
    );
  } catch (e) {
    return (
      <div style={styles.bar}>
        <span style={{ color: '#c04040', fontSize: '0.85rem' }}>
          Error: {(e as Error).message}
        </span>
      </div>
    );
  }
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    background: '#fff',
    borderBottom: '1px solid #d8cfc4',
    padding: '8px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    flexShrink: 0,
    minHeight: 56,
  },
  hint: { fontSize: '0.82rem', color: '#bbb', fontStyle: 'italic' },
  zh: { fontSize: '2.2rem', fontWeight: 700, color: '#3d2b1f', lineHeight: 1, flexShrink: 0 },
  pinyin: { fontSize: '0.9rem', color: '#888' },
  en: { fontSize: '0.8rem', color: '#666' },
  detail: { marginLeft: 'auto', textAlign: 'right' },
  names: { fontSize: '0.78rem', color: '#999', display: 'flex', alignItems: 'center', gap: 5 },
  name: { color: '#3d2b1f' },
  arrow: { color: '#bbb' },
  path: { fontSize: '0.72rem', color: '#bbb', marginTop: 2 },
  warn: { fontSize: '0.7rem', color: '#d08030', marginTop: 1 },
};
