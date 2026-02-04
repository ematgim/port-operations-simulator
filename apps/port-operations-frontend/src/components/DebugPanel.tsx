import React from 'react';

interface DebugPanelProps {
  visible: boolean;
  logs: string[];
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ visible, logs }) => {
  if (!visible) return null;

  return (
    <div
      id="debug-panel"
      style={{
        display: 'block',
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: '#1a1a1a',
        color: '#00ff00',
        maxWidth: '400px',
        height: '300px',
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: '11px',
        border: '2px solid #00ff00',
        padding: '10px',
        zIndex: 1000,
      }}
    >
      <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {logs.join('\n')}
      </div>
    </div>
  );
};
