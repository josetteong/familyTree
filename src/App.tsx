import { useState } from 'react';
import { useFamilyTree } from './hooks/useFamilyTree';
import Sidebar from './components/Sidebar';
import TreeCanvas from './components/TreeCanvas';
import ResultBar from './components/ResultBar';

export default function App() {
  const { tree, version, loading, apiError, egoId, targetId, handleCardClick, addPerson, updatePerson, deletePerson } = useFamilyTree();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const egoName = egoId ? tree.people.get(egoId)?.name : null;

  // Sidebar is 320px (w-80) + 12px margin; collapsed strip is ~40px + 12px margin
  const resultLeft = sidebarCollapsed ? 64 : 344;

  if (loading) return <Splash>Loading…</Splash>;
  if (apiError) {
    return (
      <Splash>
        <p className="text-error font-bold mb-2">⚠ Cannot reach API</p>
        <code className="text-sm text-base-content/60 whitespace-pre-wrap max-w-sm">{apiError}</code>
        <p className="mt-3 text-sm text-base-content/40">Check your <code>.env</code> and run <code>npm run dev</code>.</p>
      </Splash>
    );
  }

  return (
    <div className="flex flex-col h-screen" data-theme="jiapu">
      {/* Navbar */}
      <div className="navbar bg-primary text-primary-content min-h-13 px-6 shrink-0">
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-wide">家谱</h1>
        </div>
        {egoName && (
          <div className="badge badge-accent badge-lg gap-1 font-semibold">
            Me: {egoName}
          </div>
        )}
      </div>

      {/* Canvas layer */}
      <div className="relative flex-1 overflow-hidden">
        <TreeCanvas tree={tree} version={version} egoId={egoId} targetId={targetId} onCardClick={handleCardClick} />

        {/* Floating sidebar */}
        <div className="absolute top-3 left-3 bottom-3 z-10">
          <Sidebar
            tree={tree} egoId={egoId} targetId={targetId}
            collapsed={sidebarCollapsed}
            onCollapse={setSidebarCollapsed}
            onCardClick={handleCardClick}
            onAddPerson={addPerson}
            onUpdatePerson={updatePerson}
            onDeletePerson={deletePerson}
          />
        </div>

        {/* Legend — bottom right */}
        <div className="absolute bottom-3 right-3 z-10 card bg-base-100 shadow-xl pointer-events-none">
          <div className="card-body p-3 gap-2">
            <p className="text-xs font-bold text-base-content/60 uppercase tracking-widest">Legend</p>
            <div className="flex items-center gap-2 text-xs text-base-content/70">
              <svg width="40" height="10"><line x1="0" y1="5" x2="40" y2="5" stroke="#2c3b2c" strokeWidth="1.5" strokeDasharray="4 3"/></svg>
              Married
            </div>
            <div className="flex items-center gap-2 text-xs text-base-content/70">
              <svg width="40" height="10"><line x1="0" y1="5" x2="40" y2="5" stroke="#2c3b2c" strokeWidth="1.5"/></svg>
              Direct
            </div>
            <div className="flex items-center gap-2 text-xs text-base-content/70">
              <span className="w-4 h-4 rounded-full inline-block shrink-0" style={{ background: '#e8c0bc' }} />
              Female
            </div>
            <div className="flex items-center gap-2 text-xs text-base-content/70">
              <span className="w-4 h-4 rounded-full inline-block shrink-0" style={{ background: '#c8d4c2' }} />
              Male
            </div>
          </div>
        </div>

        {/* Floating result bar — widens when sidebar collapses */}
        <div
          className="absolute top-3 right-3 z-10 pointer-events-none"
          style={{ left: resultLeft, transition: 'left 0.2s ease' }}
        >
          <ResultBar tree={tree} egoId={egoId} targetId={targetId} />
        </div>
      </div>
    </div>
  );
}

function Splash({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-3 p-8 text-center"
         style={{ background: '#7d8f78' }} data-theme="jiapu">
      {children}
    </div>
  );
}
