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
        <div className="flex items-center gap-3">
          <svg className="w-8 h-8 text-accent-primary" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.15.52-.06.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z"/>
          </svg>
          <h1 className="text-3xl font-bold text-accent-primary">
            PortSim
          </h1>
        </div>
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
