import React from 'react';

interface StatusIndicatorProps {
  connected: boolean;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ connected, className = '' }) => {
  return (
    <span
      className={`w-3 h-3 rounded-full ${
        connected
          ? 'bg-accent-success animate-pulse-slow'
          : 'bg-accent-secondary animate-blink'
      } ${className}`}
    />
  );
};
