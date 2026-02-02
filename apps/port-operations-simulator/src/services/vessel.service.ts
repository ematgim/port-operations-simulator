import { Vessel, VesselType, VesselStatus } from '../models/vessel.model';
import { Position } from '../models/tugboat.model';
import { PortService } from './port.service';

export class VesselService {
  private vessels: Map<string, Vessel> = new Map();
  private vesselIdCounter = 1;
  private portService: PortService;

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

  constructor(portService: PortService) {
    this.portService = portService;
  }

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
      position: this.getEntryPointPosition(),
      status: VesselStatus.ARRIVING,
      requestTime: new Date(),
    };

    this.vessels.set(vessel.id, vessel);
    console.log(
      `🚢 New vessel arriving at port: ${vessel.name} (${vessel.type}) at entry point`
    );

    return vessel;
  }

  private getEntryPointPosition(): Position {
    const entryPoint = this.portService.getEntryPoint();
    // Añadir pequeña variación aleatoria para que no estén exactamente en el mismo punto
    return {
      x: entryPoint.position.x + (Math.random() - 0.5) * 20,
      y: entryPoint.position.y + (Math.random() - 0.5) * 20,
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
      (v) => v.status === VesselStatus.REQUESTING_ASSISTANCE || v.status === VesselStatus.ARRIVING
    );
  }

  getVesselsWaitingForTugboat(): Vessel[] {
    return Array.from(this.vessels.values()).filter(
      (v) => v.status === VesselStatus.WAITING_FOR_TUGBOAT
    );
  }

  getVesselsWaitingForDeparture(): Vessel[] {
    return Array.from(this.vessels.values()).filter(
      (v) => v.status === VesselStatus.WAITING_FOR_DEPARTURE
    );
  }

  getDockedVessels(): Vessel[] {
    return Array.from(this.vessels.values()).filter(
      (v) => v.status === VesselStatus.DOCKED
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
