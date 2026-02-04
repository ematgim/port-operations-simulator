import React, { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PortMap } from './components/PortMap';
import { DebugPanel } from './components/DebugPanel';
import { usePortData } from './hooks/usePortData';
import './styles.css';

const App: React.FC = () => {
  const { tugboats, vessels, connected, debugLogs } = usePortData();
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="flex flex-col h-screen">
      <Header connected={connected} onToggleDebug={() => setShowDebug(!showDebug)} />
      <DebugPanel visible={showDebug} logs={debugLogs} />
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <Sidebar tugboats={tugboats} vessels={vessels} />
        <main className="flex-1 relative bg-bg-primary">
          <PortMap tugboats={tugboats} vessels={vessels} />
        </main>
      </div>
    </div>
  );
};

export default App;
