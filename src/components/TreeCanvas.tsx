import { useMemo } from 'react';
import { FamilyTree } from '../lib/kinship';
import { computeLayout, LayoutNode, CW, CH, SP, midX } from '../lib/layout';

interface Props {
  tree: FamilyTree;
  version: number;  // bumped whenever tree mutates, triggers re-memo
  egoId: string | null;
  targetId: string | null;
  onCardClick: (id: string) => void;
}

export default function TreeCanvas({ tree, version, egoId, targetId, onCardClick }: Props) {
  const { nodes, forest, canvasW, canvasH } = useMemo(
    () => computeLayout(tree),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tree, version]
  );

  return (
    <div style={s.wrap}>
      <svg
        style={s.svg}
        width={canvasW}
        height={canvasH}
      >
        {forest.map(root => (
          <ConnectorGroup key={root.primaryId} node={root} />
        ))}
      </svg>

      <div style={{ position: 'absolute', top: 0, left: 0, width: canvasW, height: canvasH }}>
        {nodes.map(node => (
          <CardSlot
            key={node.primaryId}
            node={node}
            tree={tree}
            egoId={egoId}
            targetId={targetId}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
}

// ── SVG connector lines ───────────────────────────────────────────────────

function ConnectorGroup({ node }: { node: LayoutNode }) {
  const lines: React.ReactNode[] = [];

  function visit(n: LayoutNode) {
    // Spouse bar
    if (n.spouseId) {
      const x1 = n.x + CW, x2 = n.x + CW + SP;
      const y = n.y + CH / 2;
      lines.push(<line key={`sp-${n.primaryId}`} x1={x1} y1={y} x2={x2} y2={y} stroke="#c4956a" strokeWidth={2.5} strokeDasharray="4 3" />);
    }

    if (n.children.length) {
      const fromX = midX(n);
      const fromY = n.y + CH;
      const barY = n.y + CH + 35;

      lines.push(<line key={`dn-${n.primaryId}`} x1={fromX} y1={fromY} x2={fromX} y2={barY} stroke="#b8a090" strokeWidth={1.5} />);

      if (n.children.length === 1) {
        const toX = midX(n.children[0]);
        const toY = n.children[0].y;
        if (fromX !== toX) lines.push(<line key={`hz-${n.primaryId}`} x1={fromX} y1={barY} x2={toX} y2={barY} stroke="#b8a090" strokeWidth={1.5} />);
        lines.push(<line key={`ch0-${n.primaryId}`} x1={toX} y1={barY} x2={toX} y2={toY} stroke="#b8a090" strokeWidth={1.5} />);
      } else {
        const xs = n.children.map(midX);
        const barL = Math.min(fromX, ...xs), barR = Math.max(fromX, ...xs);
        lines.push(<line key={`bar-${n.primaryId}`} x1={barL} y1={barY} x2={barR} y2={barY} stroke="#b8a090" strokeWidth={1.5} />);
        n.children.forEach((child, i) => {
          const toX = midX(child);
          lines.push(<line key={`ch${i}-${n.primaryId}`} x1={toX} y1={barY} x2={toX} y2={child.y} stroke="#b8a090" strokeWidth={1.5} />);
        });
      }
    }

    n.children.forEach(visit);
  }

  visit(node);
  return <>{lines}</>;
}

// ── Card slot (one person or couple) ─────────────────────────────────────

function CardSlot({ node, tree, egoId, targetId, onCardClick }: {
  node: LayoutNode;
  tree: FamilyTree;
  egoId: string | null;
  targetId: string | null;
  onCardClick: (id: string) => void;
}) {
  return (
    <>
      <PersonCard
        personId={node.primaryId}
        x={node.x}
        y={node.y}
        tree={tree}
        egoId={egoId}
        targetId={targetId}
        onClick={onCardClick}
      />
      {node.spouseId && (
        <PersonCard
          personId={node.spouseId}
          x={node.x + CW + SP}
          y={node.y}
          tree={tree}
          egoId={egoId}
          targetId={targetId}
          onClick={onCardClick}
        />
      )}
    </>
  );
}

// ── Single person card ────────────────────────────────────────────────────

function PersonCard({ personId, x, y, tree, egoId, targetId, onClick }: {
  personId: string;
  x: number;
  y: number;
  tree: FamilyTree;
  egoId: string | null;
  targetId: string | null;
  onClick: (id: string) => void;
}) {
  const person = tree.people.get(personId);
  if (!person) return null;

  const isEgo = personId === egoId;
  const isTgt = personId === targetId;

  let term: { zh: string; pinyin: string } | null = null;
  if (egoId && !isEgo) {
    try {
      const t = tree.getTerm(egoId, personId);
      if (t.zh) term = { zh: t.zh, pinyin: t.pinyin ?? '' };
    } catch { /* unknown relationship */ }
  }

  return (
    <div
      style={{
        ...s.card,
        left: x,
        top: y,
        ...(isEgo ? s.cardEgo : {}),
        ...(isTgt ? s.cardTgt : {}),
      }}
      onClick={() => onClick(personId)}
    >
      <div style={s.av}>{person.gender === 'M' ? '👨' : '👩'}</div>
      <div style={s.cname}>{person.name}</div>
      {term ? (
        <>
          <div style={s.czh}>{term.zh}</div>
          <div style={s.cpy}>{term.pinyin}</div>
        </>
      ) : (
        <div style={{ height: 28 }} />
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { flex: 1, position: 'relative', overflow: 'auto', background: '#ede8e1' },
  svg: { position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' },
  card: {
    position: 'absolute',
    width: CW,
    height: CH,
    background: 'white',
    border: '2px solid #ddd4c8',
    borderRadius: 9,
    padding: '5px 6px',
    cursor: 'pointer',
    textAlign: 'center',
    userSelect: 'none',
    overflow: 'hidden',
    transition: 'border-color .12s, box-shadow .12s',
    boxSizing: 'border-box',
  },
  cardEgo: { borderColor: '#7a4f2e', background: '#fef3e2' },
  cardTgt: { borderColor: '#4a7a2e', background: '#eef5e8' },
  av: { fontSize: '1.3rem', lineHeight: '1.3' },
  cname: { fontSize: '0.68rem', fontWeight: 700, color: '#2c2c2c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 1 },
  czh: { fontSize: '1.05rem', fontWeight: 700, color: '#7a4f2e', lineHeight: 1.1 },
  cpy: { fontSize: '0.57rem', color: '#bbb' },
};
