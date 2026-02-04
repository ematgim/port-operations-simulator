import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Tugboat, Vessel } from '../types';
import { Badge } from './ui/Badge';

interface EntityDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  entity: Tugboat | Vessel | null;
  entityType: 'tugboat' | 'vessel' | null;
}

export const EntityDetailsDialog: React.FC<EntityDetailsDialogProps> = ({
  open,
  onClose,
  entity,
  entityType,
}) => {
  if (!entity || !entityType) return null;

  const isTugboat = entityType === 'tugboat';
  const tugboat = isTugboat ? (entity as Tugboat) : null;
  const vessel = !isTugboat ? (entity as Vessel) : null;

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-secondary border-2 border-border-color rounded-lg shadow-2xl p-6 w-[90vw] max-w-md z-50 focus:outline-none">
          <div className="flex items-start justify-between mb-4">
            <Dialog.Title className="text-xl font-bold text-accent-primary">
              {isTugboat ? '🚤 Tugboat Details' : '⚓ Vessel Details'}
            </Dialog.Title>
            <Dialog.Close className="text-text-secondary hover:text-text-primary transition-colors">
              <XMarkIcon className="w-6 h-6" />
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <div className="text-xs text-text-secondary uppercase mb-1">Name</div>
              <div className="text-lg font-semibold">
                {isTugboat ? tugboat?.tugboatName : vessel?.vesselName}
              </div>
            </div>

            {/* ID */}
            <div>
              <div className="text-xs text-text-secondary uppercase mb-1">ID</div>
              <div className="text-sm font-mono text-text-primary">
                {isTugboat ? tugboat?.tugboatId : vessel?.vesselId}
              </div>
            </div>

            {/* Vessel Type (only for vessels) */}
            {vessel && (
              <div>
                <div className="text-xs text-text-secondary uppercase mb-1">Type</div>
                <div className="text-sm">{vessel.vesselType}</div>
              </div>
            )}

            {/* Status */}
            <div>
              <div className="text-xs text-text-secondary uppercase mb-1">Status</div>
              <Badge status={entity.status} />
            </div>

            {/* Position */}
            <div>
              <div className="text-xs text-text-secondary uppercase mb-1">Position</div>
              <div className="text-sm">
                X: {Math.round(entity.position.x)}, Y: {Math.round(entity.position.y)}
              </div>
            </div>

            {/* Speed (only for tugboats) */}
            {tugboat && (
              <div>
                <div className="text-xs text-text-secondary uppercase mb-1">Speed</div>
                <div className="text-sm">{tugboat.speed} units/s</div>
              </div>
            )}

            {/* Assignments */}
            {tugboat?.assignedVesselId && (
              <div>
                <div className="text-xs text-text-secondary uppercase mb-1">Assigned Vessel</div>
                <div className="text-sm font-mono text-accent-warning">{tugboat.assignedVesselId}</div>
              </div>
            )}

            {vessel?.assignedTugboatId && (
              <div>
                <div className="text-xs text-text-secondary uppercase mb-1">Assigned Tugboat</div>
                <div className="text-sm font-mono text-accent-warning">{vessel.assignedTugboatId}</div>
              </div>
            )}

            {/* Timestamp */}
            <div>
              <div className="text-xs text-text-secondary uppercase mb-1">Last Update</div>
              <div className="text-xs text-text-secondary">
                {new Date(entity.timestamp).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-accent-primary text-bg-primary rounded-lg font-medium hover:bg-opacity-90 transition-all duration-200"
            >
              Close
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
