import { Vessel, VesselType, VesselStatus } from '../models/vessel.model';
import { Position } from '../models/tugboat.model';

export class VesselService {
  private vessels: Map<string, Vessel> = new Map();
  private vesselIdCounter = 1;
  private portBounds = {
    minX: 0,
    maxX: 1000,
    minY: 0,
    maxY: 1000,
  };

  private vesselNames = [
    'MSC Maria',
    'Ever Forward',
    'Maersk Viking',
    'CMA CGM Titan',
    'Pacific Star',
    'Atlantic Queen',
    'Ocean Explorer',
    'Sea Pioneer',
    'Mediterranean Dream',
    'Baltic Trader',
  ];

  private usedNames: Set<string> = new Set();

  generateVessel(): Vessel {
    const availableNames = this.vesselNames.filter(
      (name) => !this.usedNames.has(name)
    );

    let name: string;
    if (availableNames.length > 0) {
      name = availableNames[Math.floor(Math.random() * availableNames.length)];
      this.usedNames.add(name);
    } else {
      name = `Vessel-${this.vesselIdCounter}`;
    }

    const vessel: Vessel = {
      id: `V${this.vesselIdCounter++}`,
      name,
      type: this.randomVesselType(),
      position: this.randomPosition(),
      status: VesselStatus.REQUESTING_ASSISTANCE,
      requestTime: new Date(),
    };

    this.vessels.set(vessel.id, vessel);
    console.log(
      `🚢 New vessel requesting assistance: ${vessel.name} (${vessel.type}) at (${vessel.position.x}, ${vessel.position.y})`
    );

    return vessel;
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

  private randomVesselType(): VesselType {
    const types = Object.values(VesselType);
    return types[Math.floor(Math.random() * types.length)];
  }

  getVessel(id: string): Vessel | undefined {
    return this.vessels.get(id);
  }

  updateVessel(id: string, updates: Partial<Vessel>): void {
    const vessel = this.vessels.get(id);
    if (vessel) {
      Object.assign(vessel, updates);
    }
  }

  getVesselsRequestingAssistance(): Vessel[] {
    return Array.from(this.vessels.values()).filter(
      (v) => v.status === VesselStatus.REQUESTING_ASSISTANCE
    );
  }

  getVesselsWaitingForTugboat(): Vessel[] {
    return Array.from(this.vessels.values()).filter(
      (v) => v.status === VesselStatus.WAITING_FOR_TUGBOAT
    );
  }

  getAllVessels(): Vessel[] {
    return Array.from(this.vessels.values());
  }

  removeVessel(id: string): void {
    const vessel = this.vessels.get(id);
    if (vessel) {
      this.usedNames.delete(vessel.name);
      this.vessels.delete(id);
    }
  }
}
