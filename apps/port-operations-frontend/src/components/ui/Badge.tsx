import React from 'react';

type TugboatStatus = 'IDLE' | 'MOVING' | 'ASSISTING';
type VesselStatus = 'AT_ENTRY' | 'BEING_TOWED_TO_DOCK' | 'BEING_TOWED_TO_EXIT' | 'DOCKED' | 'DEPARTED' | 'REQUESTING_ASSISTANCE' | 'WAITING_FOR_TUGBOAT' | 'BEING_ASSISTED' | 'UNKNOWN';

interface BadgeProps {
  status: TugboatStatus | VesselStatus;
  className?: string;
}

const statusConfig: Record<TugboatStatus | VesselStatus, { color: string; label: string }> = {
  // Tugboat statuses
  IDLE: { color: 'bg-text-secondary/20 text-text-secondary', label: 'IDLE' },
  MOVING: { color: 'bg-accent-primary/20 text-accent-primary', label: 'MOVING' },
  ASSISTING: { color: 'bg-accent-warning/20 text-accent-warning', label: 'ASSISTING' },
  
  // Vessel statuses
  REQUESTING_ASSISTANCE: { color: 'bg-accent-secondary/20 text-accent-secondary', label: 'REQUESTING' },
  WAITING_FOR_TUGBOAT: { color: 'bg-accent-secondary/30 text-accent-secondary', label: 'WAITING' },
  BEING_ASSISTED: { color: 'bg-accent-warning/20 text-accent-warning', label: 'BEING ASSISTED' },
  AT_ENTRY: { color: 'bg-accent-secondary/20 text-accent-secondary', label: 'AT ENTRY' },
  BEING_TOWED_TO_DOCK: { color: 'bg-accent-warning/20 text-accent-warning', label: 'TO DOCK' },
  BEING_TOWED_TO_EXIT: { color: 'bg-accent-warning/20 text-accent-warning', label: 'TO EXIT' },
  DOCKED: { color: 'bg-accent-success/20 text-accent-success', label: 'DOCKED' },
  DEPARTED: { color: 'bg-text-secondary/20 text-text-secondary', label: 'DEPARTED' },
  UNKNOWN: { color: 'bg-text-secondary/20 text-text-secondary', label: 'UNKNOWN' },
};

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const config = statusConfig[status];
  
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase ${config.color} ${className}`}>
      {config.label}
    </span>
  );
};
