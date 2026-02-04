import { Position } from './tugboat.model';

export interface PortLocation {
  id: string;
  name: string;
  position: Position;
  type: LocationType;
  occupied?: boolean;
  occupiedBy?: string; // vessel id
}

export enum LocationType {
  ENTRY_POINT = 'ENTRY_POINT',
  DOCK = 'DOCK',
  EXIT_POINT = 'EXIT_POINT',
  TUGBOAT_BASE = 'TUGBOAT_BASE',
}

export interface DockAssignment {
  dockId: string;
  vesselId: string;
  assignedAt: Date;
  estimatedDepartureTime?: Date;
}
