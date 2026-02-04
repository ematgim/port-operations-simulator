import React from 'react';
import { Tugboat, Vessel } from '../types';
import { Badge } from './ui/Badge';

// Dock names map
const DOCK_NAMES: Record<string, string> = {
  'DOCK_01': 'Muelle A1',
  'DOCK_02': 'Muelle A2',
  'DOCK_03': 'Muelle B1',
  'DOCK_04': 'Muelle B2',
  'DOCK_05': 'Muelle C1',
  'DOCK_06': 'Muelle C2',
};

interface SidebarProps {
  tugboats: Map<string, Tugboat>;
  vessels: Map<string, Vessel>;
}

export const Sidebar: React.FC<SidebarProps> = ({ tugboats, vessels }) => {
  const idleCount = Array.from(tugboats.values()).filter((t) => t.status === 'IDLE').length;
  const assistingCount = Array.from(tugboats.values()).filter((t) => t.status === 'ASSISTING').length;

  const sortedTugboats = Array.from(tugboats.values()).sort((a, b) =>
    a.tugboatName.localeCompare(b.tugboatName)
  );

  const sortedVessels = Array.from(vessels.values())
    .filter((v) => v.status !== 'DEPARTED')
    .sort((a, b) => {
      // Define priority order
      const statusPriority: Record<string, number> = {
        'AT_ENTRY': 1,
        'REQUESTING_ASSISTANCE': 2,
        'WAITING_FOR_TUGBOAT': 3,
        'BEING_ASSISTED': 4,
        'BEING_TOWED_TO_DOCK': 5,
        'BEING_TOWED_TO_EXIT': 6,
        'DOCKED': 7,
      };
      
      const priorityA = statusPriority[a.status] || 999;
      const priorityB = statusPriority[b.status] || 999;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      return a.vesselName.localeCompare(b.vesselName);
    });

  return (
    <aside className="w-full md:w-80 lg:w-96 bg-bg-secondary border-l-2 border-border-color overflow-y-auto p-6">
      {/* Statistics Panel */}
      <div className="mb-8 stats-panel">
        <h2 className="text-lg font-semibold mb-4 text-accent-primary">📊 Statistics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-bg-tertiary p-4 rounded-lg text-center border border-border-color hover:-translate-y-0.5 hover:border-accent-primary transition-all duration-200">
            <div className="text-3xl font-bold text-accent-primary mb-1">{tugboats.size}</div>
            <div className="text-xs text-text-secondary uppercase tracking-wider">Tugboats</div>
          </div>
          <div className="bg-bg-tertiary p-4 rounded-lg text-center border border-border-color hover:-translate-y-0.5 hover:border-accent-primary transition-all duration-200">
            <div className="text-3xl font-bold text-accent-primary mb-1">{vessels.size}</div>
            <div className="text-xs text-text-secondary uppercase tracking-wider">Vessels</div>
          </div>
          <div className="bg-bg-tertiary p-4 rounded-lg text-center border border-border-color hover:-translate-y-0.5 hover:border-accent-primary transition-all duration-200">
            <div className="text-3xl font-bold text-accent-primary mb-1">{idleCount}</div>
            <div className="text-xs text-text-secondary uppercase tracking-wider">Idle</div>
          </div>
          <div className="bg-bg-tertiary p-4 rounded-lg text-center border border-border-color hover:-translate-y-0.5 hover:border-accent-primary transition-all duration-200">
            <div className="text-3xl font-bold text-accent-primary mb-1">{assistingCount}</div>
            <div className="text-xs text-text-secondary uppercase tracking-wider">Assisting</div>
          </div>
        </div>
      </div>

      {/* Legend Panel - Hidden, now in map */}
      <div className="mb-8 hidden">
        <h2 className="text-lg font-semibold mb-4 text-accent-primary">🎨 Legend</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <div className="w-5 h-5 rounded-full border-2 border-accent-primary"></div>
            <span>Tugboat - Idle</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <div className="w-5 h-5 rounded-full border-2 border-accent-primary bg-accent-primary animate-pulse-slow"></div>
            <span>Tugboat - Moving</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <div className="w-5 h-5 rounded-full border-2 border-accent-warning bg-accent-warning"></div>
            <span>Tugboat - Assisting</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <div className="w-5 h-5 rounded border-2 border-accent-secondary rotate-45 animate-blink"></div>
            <span>Vessel - Requesting</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <div className="w-5 h-5 rounded border-2 border-accent-secondary bg-accent-secondary rotate-45"></div>
            <span>Vessel - Waiting</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <div className="w-5 h-5 rounded border-2 border-accent-warning bg-accent-warning rotate-45"></div>
            <span>Vessel - Being Assisted</span>
          </div>
        </div>
      </div>

      {/* Tugboats List */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-accent-primary">🚤 Tugboats</h2>
        <div className="space-y-1 max-h-72 overflow-y-auto custom-scrollbar">
          {sortedTugboats.length === 0 ? (
            <div className="text-center py-8 text-text-secondary text-sm">No tugboats</div>
          ) : (
            sortedTugboats.map((tugboat) => {
              const assignedVessel = tugboat.assignedVesselId ? vessels.get(tugboat.assignedVesselId) : null;
              
              return (
                <div
                  key={tugboat.tugboatId}
                  className="bg-bg-tertiary p-2 rounded-md text-sm hover:bg-opacity-80 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="font-semibold text-base">{tugboat.tugboatName}</div>
                    <Badge status={tugboat.status} />
                  </div>
                  {tugboat.status === 'MOVING' && assignedVessel && (
                    <div className="text-text-secondary text-xs leading-relaxed flex items-center gap-1 mt-1">
                      <span>→</span>
                      <span>{assignedVessel.vesselName}</span>
                    </div>
                  )}
                  {tugboat.status === 'ASSISTING' && assignedVessel && (
                    <div className="text-text-secondary text-xs leading-relaxed flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <span>⚓</span>
                        <span>{assignedVessel.vesselName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{assignedVessel.status === 'BEING_TOWED_TO_DOCK' ? '📍' : '→'}</span>
                        <span>
                          {assignedVessel.status === 'BEING_TOWED_TO_DOCK' 
                            ? (assignedVessel.assignedDockId ? DOCK_NAMES[assignedVessel.assignedDockId] || 'Dock' : 'Dock')
                            : 'Exit'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Vessels List */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-accent-primary">⚓ Vessels</h2>
        <div className="space-y-1 max-h-72 overflow-y-auto custom-scrollbar">
          {sortedVessels.length === 0 ? (
            <div className="text-center py-8 text-text-secondary text-sm">No vessels</div>
          ) : (
            sortedVessels.map((vessel) => (
              <div
                key={vessel.vesselId}
                className="bg-bg-tertiary p-2 rounded-md text-sm hover:bg-opacity-80 transition-all duration-200 cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-base">{vessel.vesselName}</span>
                      <span className="text-text-secondary text-[10px]">{vessel.vesselImo}</span>
                    </div>
                    {vessel.assignedDockId && (vessel.status === 'DOCKED' || vessel.status === 'BEING_TOWED_TO_DOCK') && (
                      <div className="text-text-secondary text-xs mt-0.5">
                        📍 {DOCK_NAMES[vessel.assignedDockId] || vessel.assignedDockId}
                      </div>
                    )}
                  </div>
                  <Badge status={vessel.status} />
                </div>
                {vessel.assignedTugboatId && (
                  <div className="text-text-secondary text-xs leading-snug mt-1">
                    ← {vessel.assignedTugboatId}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};
