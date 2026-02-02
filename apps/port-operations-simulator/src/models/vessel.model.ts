import { Position } from './tugboat.model';

export interface Vessel {
  id: string;
  name: string;
  type: VesselType;
  position: Position;
  status: VesselStatus;
  assignedTugboatId?: string;
  requestTime: Date;
  estimatedArrivalTime?: Date;
}

export enum VesselType {
  CARGO = 'CARGO',
  CONTAINER = 'CONTAINER',
  TANKER = 'TANKER',
  CRUISE = 'CRUISE',
}

export enum VesselStatus {
  REQUESTING_ASSISTANCE = 'REQUESTING_ASSISTANCE',
  WAITING_FOR_TUGBOAT = 'WAITING_FOR_TUGBOAT',
  BEING_ASSISTED = 'BEING_ASSISTED',
  COMPLETED = 'COMPLETED',
}

export interface AssignmentEvent {
  vesselId: string;
  vesselName: string;
  tugboatId: string;
  tugboatName: string;
  timestamp: Date;
  eventType: 'ASSIGNMENT' | 'TUGBOAT_ARRIVED' | 'ASSISTANCE_COMPLETE';
  estimatedArrivalTime?: Date;
}
