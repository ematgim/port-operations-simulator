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
      className="fixed bottom-3 right-3 bg-black/90 text-green-400 w-full max-w-md h-80 overflow-y-auto font-mono text-xs border-2 border-green-400 p-3 z-[1000] rounded-lg shadow-2xl"
    >
      <div className="whitespace-pre-wrap break-all">
        {logs.join('\n')}
      </div>
    </div>
  );
};
