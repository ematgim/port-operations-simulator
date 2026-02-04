import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { StatusIndicator } from './ui/StatusIndicator';
import { Button } from './ui/Button';

interface HeaderProps {
  connected: boolean;
  onToggleDebug: () => void;
}

export const Header: React.FC<HeaderProps> = ({ connected, onToggleDebug }) => {
  return (
    <header className="bg-bg-secondary border-b-2 border-border-color px-8 py-4 shadow-lg">
      <div className="flex justify-between items-center max-w-full">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
          🚢 Port Operations Monitor
        </h1>
        <div className="flex items-center gap-2 text-sm">
          <StatusIndicator connected={connected} />
          <span id="status-text">{connected ? 'Connected' : 'Disconnected'}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleDebug}
            className="ml-4"
          >
            <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
            Debug
          </Button>
        </div>
      </div>
    </header>
  );
};
