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
    <div id="app">
      <Header connected={connected} onToggleDebug={() => setShowDebug(!showDebug)} />
      <DebugPanel visible={showDebug} logs={debugLogs} />
      <div className="main-container">
        <Sidebar tugboats={tugboats} vessels={vessels} />
        <main className="map-section">
          <PortMap tugboats={tugboats} vessels={vessels} />
        </main>
      </div>
    </div>
  );
};

export default App;
