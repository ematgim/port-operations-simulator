import { TugboatPosition, VesselPosition } from '../types';

export class StateManager {
  private tugboats: Map<string, TugboatPosition> = new Map();
  private vessels: Map<string, VesselPosition> = new Map();

  updateTugboat(tugboat: TugboatPosition): void {
    this.tugboats.set(tugboat.tugboatId, tugboat);
  }

  updateVessel(vessel: VesselPosition): void {
    this.vessels.set(vessel.vesselId, vessel);
  }

  removeVessel(vesselId: string): void {
    this.vessels.delete(vesselId);
  }

  getTugboats(): TugboatPosition[] {
    return Array.from(this.tugboats.values());
  }

  getVessels(): VesselPosition[] {
    return Array.from(this.vessels.values());
  }

  getTugboat(tugboatId: string): TugboatPosition | undefined {
    return this.tugboats.get(tugboatId);
  }

  getVessel(vesselId: string): VesselPosition | undefined {
    return this.vessels.get(vesselId);
  }

  getSnapshot() {
    return {
      tugboats: this.getTugboats(),
      vessels: this.getVessels().filter(v => v.status !== 'DEPARTED'),
    };
  }
}
