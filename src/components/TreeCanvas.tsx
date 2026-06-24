import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { FamilyTree } from '../lib/kinship';
import { computeLayout, LayoutNode, CW, CH, SP, VG, midX } from '../lib/layout';

const CANVAS_BG   = '#7d8f78';
const NODE_FILL   = '#c8d4c2';
const NODE_STROKE = '#3a4e3a';
const NODE_EGO    = '#e8dfa0';
const NODE_TGT    = '#a8c0a0';
const LINE_COLOR  = '#2c3b2c';

interface Props {
  tree: FamilyTree;
  version: number;
  egoId: string | null;
  targetId: string | null;
  onCardClick: (id: string) => void;
}

interface Viewport { x: number; y: number; scale: number }

export default function TreeCanvas({ tree, version, egoId, targetId, onCardClick }: Props) {
  const [vp, setVp] = useState<Viewport>({ x: 60, y: 60, scale: 1 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ active: false, lastX: 0, lastY: 0, moved: false });
  const containerRef = useRef<HTMLDivElement>(null);

  const { nodes, forest, canvasW, canvasH } = useMemo(
    () => computeLayout(tree),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tree, version]
  );

  // ── pan ─────────────────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    drag.current = { active: true, lastX: e.clientX, lastY: e.clientY, moved: false };
    setDragging(true);
    e.preventDefault();
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.lastX;
    const dy = e.clientY - drag.current.lastY;
    drag.current.lastX = e.clientX;
    drag.current.lastY = e.clientY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) drag.current.moved = true;
    setVp(v => ({ ...v, x: v.x + dx, y: v.y + dy }));
  }, []);

  const onMouseUp = useCallback(() => {
    drag.current.active = false;
    drag.current.moved = false;   // reset so next card click isn't blocked
    setDragging(false);
  }, []);

  // ── zoom toward cursor ───────────────────────────────────────────────────────
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setVp(v => {
      const s = Math.min(Math.max(v.scale * factor, 0.15), 3);
      return {
        x: mx - (mx - v.x) * (s / v.scale),
        y: my - (my - v.y) * (s / v.scale),
        scale: s,
      };
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  // Don't fire card click if the mouse actually moved (was a drag)
  const handleCardClick = useCallback((id: string) => {
    if (!drag.current.moved) onCardClick(id);
  }, [onCardClick]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden',
               background: CANVAS_BG, cursor: dragging ? 'grabbing' : 'grab' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Single transform layer — everything moves together */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.scale})`,
        transformOrigin: '0 0',
      }}>
        <svg style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', pointerEvents: 'none' }}
             width={canvasW} height={canvasH}>
          {forest.map(root => <ConnectorGroup key={root.primaryId} node={root} />)}
        </svg>

        <div style={{ position: 'absolute', top: 0, left: 0, width: canvasW, height: canvasH }}>
          {nodes.map(node => (
            <CardSlot key={node.primaryId} node={node} tree={tree}
              egoId={egoId} targetId={targetId} onCardClick={handleCardClick} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SVG connectors ────────────────────────────────────────────────────────────

function ConnectorGroup({ node }: { node: LayoutNode }) {
  const lines: React.ReactNode[] = [];

  function visit(n: LayoutNode) {
    if (n.spouseId) {
      const x1 = n.x + CW, x2 = n.x + CW + SP;
      const y  = n.y + CH / 2;
      lines.push(
        <line key={`sp-${n.primaryId}`}
          x1={x1} y1={y} x2={x2} y2={y}
          stroke={LINE_COLOR} strokeWidth={2} strokeDasharray="5 4" />
      );
    }

    if (n.children.length) {
      const fromX = midX(n), fromY = n.y + CH;
      const barY  = n.y + CH + Math.round(VG * 0.42);

      lines.push(<line key={`dn-${n.primaryId}`}
        x1={fromX} y1={fromY} x2={fromX} y2={barY}
        stroke={LINE_COLOR} strokeWidth={1.8} />);

      if (n.children.length === 1) {
        const toX = midX(n.children[0]), toY = n.children[0].y;
        if (fromX !== toX)
          lines.push(<line key={`hz-${n.primaryId}`}
            x1={fromX} y1={barY} x2={toX} y2={barY}
            stroke={LINE_COLOR} strokeWidth={1.8} />);
        lines.push(<line key={`ch0-${n.primaryId}`}
          x1={toX} y1={barY} x2={toX} y2={toY}
          stroke={LINE_COLOR} strokeWidth={1.8} />);
      } else {
        const xs = n.children.map(midX);
        const barL = Math.min(fromX, ...xs), barR = Math.max(fromX, ...xs);
        lines.push(<line key={`bar-${n.primaryId}`}
          x1={barL} y1={barY} x2={barR} y2={barY}
          stroke={LINE_COLOR} strokeWidth={1.8} />);
        n.children.forEach((child, i) => {
          const toX = midX(child);
          lines.push(<line key={`ch${i}-${n.primaryId}`}
            x1={toX} y1={barY} x2={toX} y2={child.y}
            stroke={LINE_COLOR} strokeWidth={1.8} />);
        });
      }
    }
    n.children.forEach(visit);
  }

  visit(node);
  return <>{lines}</>;
}

// ── Card slot ─────────────────────────────────────────────────────────────────

function CardSlot({ node, tree, egoId, targetId, onCardClick }: {
  node: LayoutNode; tree: FamilyTree;
  egoId: string | null; targetId: string | null;
  onCardClick: (id: string) => void;
}) {
  return (
    <>
      <PersonCard personId={node.primaryId} x={node.x} y={node.y}
        tree={tree} egoId={egoId} targetId={targetId} onClick={onCardClick} />
      {node.spouseId && (
        <PersonCard personId={node.spouseId} x={node.x + CW + SP} y={node.y}
          tree={tree} egoId={egoId} targetId={targetId} onClick={onCardClick} />
      )}
    </>
  );
}

// ── Circle person card ────────────────────────────────────────────────────────

function PersonCard({ personId, x, y, tree, egoId, targetId, onClick }: {
  personId: string; x: number; y: number;
  tree: FamilyTree; egoId: string | null; targetId: string | null;
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
    } catch { /* no path */ }
  }

  const fill   = isEgo ? NODE_EGO : isTgt ? NODE_TGT : NODE_FILL;
  const strokeW = (isEgo || isTgt) ? 3 : 1.5;

  return (
    <div
      style={{ position: 'absolute', left: x, top: y, width: CW, textAlign: 'center',
               cursor: 'pointer', userSelect: 'none' }}
      onMouseDown={e => e.stopPropagation()}   // don't start canvas drag on card
      onClick={() => onClick(personId)}
    >
      <div style={{
        width: CW, height: CH, borderRadius: '50%',
        background: fill, border: `${strokeW}px solid ${NODE_STROKE}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        boxSizing: 'border-box', transition: 'filter .12s', gap: 1,
      }}
        onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.08)')}
        onMouseLeave={e => (e.currentTarget.style.filter = '')}
      >
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2c3b2c',
          lineHeight: 1.2, padding: '0 6px', textAlign: 'center', wordBreak: 'break-word' }}>
          {person.name}
        </span>
        {term && (
          <>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#1a2e1a', lineHeight: 1.1 }}>
              {term.zh}
            </span>
            <span style={{ fontSize: '0.55rem', color: '#4a6a4a', lineHeight: 1.1, opacity: 0.8 }}>
              {term.pinyin}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
