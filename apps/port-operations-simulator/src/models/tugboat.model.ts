export interface Tugboat {
  id: string;
  name: string;
  position: Position;
  status: TugboatStatus;
  capacity: number;
  speed: number;
}

export interface Position {
  x: number;
  y: number;
  dock?: string;
}

export enum TugboatStatus {
  IDLE = 'IDLE',
  MOVING = 'MOVING',
  DOCKED = 'DOCKED',
  ASSISTING = 'ASSISTING',
}

export interface MovementEvent {
  tugboatId: string;
  tugboatName: string;
  timestamp: Date;
  position: Position;
  status: TugboatStatus;
  assignedVesselId?: string;
  speed: number;
}
