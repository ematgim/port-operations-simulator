export interface TugboatPosition {
  tugboatId: string;
  tugboatName: string;
  timestamp: Date;
  position: { x: number; y: number };
  status: string;
  assignedVesselId?: string;
  speed: number;
}

export interface VesselPosition {
  vesselId: string;
  vesselName: string;
  vesselType: string;
  position: { x: number; y: number };
  status: string;
  assignedTugboatId?: string;
  estimatedArrivalTime?: Date;
}

export interface AssignmentEvent {
  vesselId: string;
  vesselName: string;
  tugboatId: string;
  tugboatName: string;
  timestamp: Date;
  eventType: string;
  estimatedArrivalTime?: Date;
}

export interface StreamUpdate {
  type: 'TUGBOAT_POSITION' | 'VESSEL_REQUEST' | 'VESSEL_ARRIVED' | 'VESSEL_DOCKED' | 'VESSEL_DEPARTED' | 'ASSIGNMENT' | 'TUGBOAT_ARRIVED' | 'ASSISTANCE_COMPLETE' | 'PORT_STATUS' | 'SNAPSHOT';
  timestamp: Date;
  data: TugboatPosition | VesselPosition | AssignmentEvent | {
    tugboats: TugboatPosition[];
    vessels: VesselPosition[];
  };
}
