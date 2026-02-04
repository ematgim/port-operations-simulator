export interface Position {
  x: number;
  y: number;
}

export interface Tugboat {
  tugboatId: string;
  tugboatName: string;
  position: Position;
  speed: number;
  status: 'IDLE' | 'MOVING' | 'ASSISTING';
  assignedVesselId?: string;
  timestamp: Date;
}

export interface Vessel {
  vesselId: string;
  vesselName: string;
  vesselImo: string;
  vesselType: string;
  position: Position;
  status: 'AT_ENTRY' | 'BEING_TOWED_TO_DOCK' | 'BEING_TOWED_TO_EXIT' | 'DOCKED' | 'DEPARTED' | 'REQUESTING_ASSISTANCE' | 'WAITING_FOR_TUGBOAT' | 'BEING_ASSISTED' | 'UNKNOWN';
  assignedTugboatId?: string;
  assignedDockId?: string;
  timestamp: Date;
}

export interface Dock {
  id: string;
  name: string;
  position: Position;
}

export interface UpdateEvent {
  type: 'SNAPSHOT' | 'TUGBOAT_POSITION' | 'VESSEL_POSITION' | 'VESSEL_REQUEST' | 'VESSEL_ARRIVED' | 'VESSEL_DOCKED' | 'VESSEL_DEPARTED' | 'ASSIGNMENT' | 'TUGBOAT_ARRIVED' | 'ASSISTANCE_COMPLETE' | 'PORT_STATUS';
  data: any;
}

export interface SnapshotData {
  tugboats: Tugboat[];
  vessels: Vessel[];
}
