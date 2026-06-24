import { useFamilyTree } from './hooks/useFamilyTree';
import Sidebar from './components/Sidebar';
import TreeCanvas from './components/TreeCanvas';
import ResultBar from './components/ResultBar';

export default function App() {
  const { tree, version, loading, apiError, egoId, targetId, handleCardClick, addPerson, updatePerson, deletePerson } = useFamilyTree();
  const egoName = egoId ? tree.people.get(egoId)?.name : null;

  if (loading) {
    return <Splash>Loading family tree…</Splash>;
  }

  if (apiError) {
    return (
      <Splash>
        <div style={{ color: '#c04040', marginBottom: 8 }}>⚠ Cannot reach API</div>
        <code style={{ fontSize: '0.78rem', color: '#555', whiteSpace: 'pre-wrap', maxWidth: 480 }}>{apiError}</code>
        <div style={{ marginTop: 12, fontSize: '0.78rem', color: '#999' }}>
          Make sure the server is running (<code>npm run dev</code>) and <code>.env</code> has the correct MySQL credentials.
        </div>
      </Splash>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', fontFamily: 'system-ui, sans-serif', color: '#2c2c2c', background: '#ede8e1' }}>
      {/* Header */}
      <header style={{ background: '#3d2b1f', color: '#f9e8d0', padding: '0 20px', height: 46, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <h1 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 600 }}>家谱 · Family Tree</h1>
        <div style={{ marginLeft: 'auto', fontSize: '0.8rem', background: '#6a3f22', padding: '3px 12px', borderRadius: 14 }}>
          Me: <b style={{ color: '#ffe0a0' }}>{egoName ?? '—'}</b>
        </div>
      </header>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          tree={tree}
          egoId={egoId}
          targetId={targetId}
          onCardClick={handleCardClick}
          onAddPerson={addPerson}
          onUpdatePerson={updatePerson}
          onDeletePerson={deletePerson}
        />

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <ResultBar tree={tree} egoId={egoId} targetId={targetId} />
          <TreeCanvas
            tree={tree}
            version={version}
            egoId={egoId}
            targetId={targetId}
            onCardClick={handleCardClick}
          />
        </main>
      </div>
    </div>
  );
}

function Splash({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', color: '#888', background: '#ede8e1', padding: 24, textAlign: 'center' }}>
      {children}
    </div>
  );
}
