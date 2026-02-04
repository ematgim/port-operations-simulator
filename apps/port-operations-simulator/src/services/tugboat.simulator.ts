import {
  Tugboat,
  TugboatStatus,
  Position,
  MovementEvent,
} from '../models/tugboat.model';
import { Vessel } from '../models/vessel.model';

interface TugboatAssignment {
  tugboatId: string;
  vesselId: string;
  assignedAt: Date;
}

export class TugboatSimulator {
  private tugboats: Map<string, Tugboat> = new Map();
  private assignments: Map<string, TugboatAssignment> = new Map();
  private portBounds = {
    minX: 0,
    maxX: 1000,
    minY: 0,
    maxY: 1000,
  };

  constructor() {
    this.initializeTugboats();
  }

  private initializeTugboats(): void {
    const tugboatData = [
      { id: '1', name: 'Hercules', capacity: 50, speed: 10 },
    ];

    tugboatData.forEach((data) => {
      const tugboat: Tugboat = {
        ...data,
        position: { x: 500, y: 500 }, // Posición fija en el centro del puerto
        status: TugboatStatus.IDLE,
      };
      this.tugboats.set(data.id, tugboat);
    });

    console.log(`🚢 Initialized ${this.tugboats.size} tugboat(s) at port`);
  }

  private randomPosition(): Position {
    return {
      x: Math.floor(
        Math.random() * (this.portBounds.maxX - this.portBounds.minX) +
          this.portBounds.minX
      ),
      y: Math.floor(
        Math.random() * (this.portBounds.maxY - this.portBounds.minY) +
          this.portBounds.minY
      ),
    };
  }

  getTugboats(): Tugboat[] {
    return Array.from(this.tugboats.values());
  }

  getTugboat(id: string): Tugboat | undefined {
    return this.tugboats.get(id);
  }

  updateTugboat(id: string, updates: Partial<Tugboat>): void {
    const tugboat = this.tugboats.get(id);
    if (tugboat) {
      Object.assign(tugboat, updates);
    }
  }

  assignTugboatToVessel(tugboatId: string, vesselId: string): void {
    this.assignments.set(tugboatId, {
      tugboatId,
      vesselId,
      assignedAt: new Date(),
    });
  }

  unassignTugboat(tugboatId: string): void {
    this.assignments.delete(tugboatId);
  }

  getAssignment(tugboatId: string): TugboatAssignment | undefined {
    return this.assignments.get(tugboatId);
  }

  createMovementEvent(tugboat: Tugboat, assignedVesselId?: string): MovementEvent {
    return {
      tugboatId: tugboat.id,
      tugboatName: tugboat.name,
      timestamp: new Date(),
      position: { ...tugboat.position },
      status: tugboat.status,
      assignedVesselId,
      speed: tugboat.speed,
    };
  }
}
