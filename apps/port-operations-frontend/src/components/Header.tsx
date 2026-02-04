import React from 'react';

interface HeaderProps {
  connected: boolean;
  onToggleDebug: () => void;
}

export const Header: React.FC<HeaderProps> = ({ connected, onToggleDebug }) => {
  return (
    <header>
      <div className="header-content">
        <h1>🚢 Port Operations Monitor</h1>
        <div className="header-status">
          <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`} />
          <span id="status-text">{connected ? 'Connected' : 'Disconnected'}</span>
          <button onClick={onToggleDebug} style={{ marginLeft: '20px', padding: '5px 10px', cursor: 'pointer' }}>
            🔍 Debug
          </button>
        </div>
      </div>
    </header>
  );
};
