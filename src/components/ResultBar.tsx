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
      <div className="card bg-base-100 shadow-xl pointer-events-auto">
        <div className="card-body p-3 py-2">
          <p className="text-sm text-base-content/50 italic">
            Click any person to see what <strong className="text-base-content">{egoName}</strong> calls them →
          </p>
        </div>
      </div>
    );
  }

  try {
    const t = tree.getTerm(egoId, targetId);
    const tgtName = tree.people.get(targetId)?.name ?? targetId;

    return (
      <div className="card bg-base-100 shadow-xl pointer-events-auto">
        <div className="card-body p-4 flex-row items-center gap-4">
          {t.zh ? (
            <>
              <span className="text-5xl font-bold text-primary leading-none">{t.zh}</span>
              <div>
                <div className="text-base text-base-content/60 italic">{t.pinyin ?? ''}</div>
                <div className="text-sm text-base-content/80">{t.en}</div>
              </div>
            </>
          ) : (
            <div>
              <div className="text-sm font-semibold text-warning">No standard term</div>
              <div className="text-xs text-base-content/50 mt-0.5">{t.en}</div>
            </div>
          )}
          <div className="ml-auto text-right shrink-0">
            <div className="text-xs text-base-content/50 flex items-center gap-1 justify-end">
              <strong>{egoName}</strong>
              <span className="opacity-40">→</span>
              <strong>{tgtName}</strong>
            </div>
            <div className="text-xs text-base-content/30 mt-0.5">{t.path}</div>
            {(t.assumptions ?? []).length > 0 && (
              <div className="text-xs text-warning mt-0.5">⚠ {t.assumptions[0]}</div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (e) {
    return (
      <div className="card bg-base-100 shadow-xl pointer-events-auto">
        <div className="card-body p-3">
          <p className="text-error text-sm">Error: {(e as Error).message}</p>
        </div>
      </div>
    );
  }
}
