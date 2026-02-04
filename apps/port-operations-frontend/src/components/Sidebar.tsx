import React from 'react';
import { Tugboat, Vessel } from '../types';

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

  const sortedVessels = Array.from(vessels.values()).sort((a, b) =>
    a.vesselName.localeCompare(b.vesselName)
  );

  return (
    <aside className="sidebar">
      <div className="stats-panel">
        <h2>📊 Statistics</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{tugboats.size}</div>
            <div className="stat-label">Tugboats</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{vessels.size}</div>
            <div className="stat-label">Vessels</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{idleCount}</div>
            <div className="stat-label">Idle</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{assistingCount}</div>
            <div className="stat-label">Assisting</div>
          </div>
        </div>
      </div>

      <div className="legend-panel">
        <h2>🎨 Legend</h2>
        <div className="legend-item">
          <div className="legend-icon tugboat idle"></div>
          <span>Tugboat - Idle</span>
        </div>
        <div className="legend-item">
          <div className="legend-icon tugboat moving"></div>
          <span>Tugboat - Moving</span>
        </div>
        <div className="legend-item">
          <div className="legend-icon tugboat assisting"></div>
          <span>Tugboat - Assisting</span>
        </div>
        <div className="legend-item">
          <div className="legend-icon vessel requesting"></div>
          <span>Vessel - Requesting</span>
        </div>
        <div className="legend-item">
          <div className="legend-icon vessel waiting"></div>
          <span>Vessel - Waiting</span>
        </div>
        <div className="legend-item">
          <div className="legend-icon vessel being-assisted"></div>
          <span>Vessel - Being Assisted</span>
        </div>
      </div>

      <div className="entities-panel">
        <h2>🚤 Tugboats</h2>
        <div className="entity-list">
          {sortedTugboats.length === 0 ? (
            <div className="empty-state">No tugboats</div>
          ) : (
            sortedTugboats.map((tugboat) => (
              <div key={tugboat.tugboatId} className="entity-card tugboat">
                <div className="entity-name">{tugboat.tugboatName}</div>
                <div className="entity-details">
                  Position: ({Math.round(tugboat.position.x)}, {Math.round(tugboat.position.y)})<br />
                  Speed: {tugboat.speed} units/s
                  {tugboat.assignedVesselId && (
                    <>
                      <br />→ {tugboat.assignedVesselId}
                    </>
                  )}
                </div>
                <span className={`entity-status ${tugboat.status}`}>{tugboat.status}</span>
              </div>
            ))
          )}
        </div>

        <h2>⚓ Vessels</h2>
        <div className="entity-list">
          {sortedVessels.length === 0 ? (
            <div className="empty-state">No vessels</div>
          ) : (
            sortedVessels.map((vessel) => (
              <div key={vessel.vesselId} className="entity-card vessel">
                <div className="entity-name">{vessel.vesselName}</div>
                <div className="entity-details">
                  Type: {vessel.vesselType}<br />
                  Position: ({Math.round(vessel.position.x)}, {Math.round(vessel.position.y)})
                  {vessel.assignedTugboatId && (
                    <>
                      <br />← {vessel.assignedTugboatId}
                    </>
                  )}
                </div>
                <span className={`entity-status ${vessel.status}`}>{vessel.status}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};
