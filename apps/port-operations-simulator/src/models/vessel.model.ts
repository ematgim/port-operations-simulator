import { Position } from './tugboat.model';

export interface Vessel {
  id: string;
  name: string;
  imo: string;
  type: VesselType;
  position: Position;
  status: VesselStatus;
  assignedTugboatId?: string;
  requestTime: Date;
  estimatedArrivalTime?: Date;
  assignedDockId?: string;
  dockedAt?: Date;
  departureTime?: Date;
}

export enum VesselType {
  CARGO = 'CARGO',
  CONTAINER = 'CONTAINER',
  TANKER = 'TANKER',
  CRUISE = 'CRUISE',
}

export enum VesselStatus {
  AT_ENTRY = 'AT_ENTRY', // En el punto de entrada esperando remolcador
  BEING_TOWED_TO_DOCK = 'BEING_TOWED_TO_DOCK', // Siendo remolcado hacia el muelle
  DOCKED = 'DOCKED', // Atracado en el muelle
  BEING_TOWED_TO_EXIT = 'BEING_TOWED_TO_EXIT', // Siendo remolcado hacia la salida
  DEPARTED = 'DEPARTED', // Ha salido del puerto
}

export interface AssignmentEvent {
  vesselId: string;
  vesselName: string;
  tugboatId: string;
  tugboatName: string;
  timestamp: Date;
  eventType: 'ASSIGNMENT' | 'TUGBOAT_ARRIVED' | 'ASSISTANCE_COMPLETE' | 'DOCKED';
  estimatedArrivalTime?: Date;
}
