import { Vessel, VesselType, VesselStatus } from '../models/vessel.model';
import { Position } from '../models/tugboat.model';
import { PortService } from './port.service';
import { VESSELS_CATALOG, VesselCatalogEntry } from '../data/vessels-catalog';

export class VesselService {
  private vessels: Map<string, Vessel> = new Map();
  private vesselIdCounter = 1;
  private portService: PortService;
  private vesselsCatalog: VesselCatalogEntry[];
  private catalogIndex = 0;

  constructor(portService: PortService) {
    this.portService = portService;
    this.vesselsCatalog = this.shuffleArray([...VESSELS_CATALOG]);
    console.log(`✅ Loaded ${this.vesselsCatalog.length} vessels from catalog`);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  generateVessel(): Vessel {
    // Get next vessel from catalog
    const catalogEntry = this.vesselsCatalog[this.catalogIndex];
    this.catalogIndex = (this.catalogIndex + 1) % this.vesselsCatalog.length;

    // If we've cycled through all vessels, reshuffle
    if (this.catalogIndex === 0) {
      this.vesselsCatalog = this.shuffleArray([...this.vesselsCatalog]);
    }

    const vessel: Vessel = {
      id: `V${this.vesselIdCounter++}`,
      name: catalogEntry.name,
      type: catalogEntry.type as VesselType,
      position: this.getEntryPointPosition(),
      status: VesselStatus.AT_ENTRY,
      requestTime: new Date(),
    };

    this.vessels.set(vessel.id, vessel);

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

  getVessel(id: string): Vessel | undefined {
    return this.vessels.get(id);
  }

  updateVessel(id: string, updates: Partial<Vessel>): void {
    const vessel = this.vessels.get(id);
    if (vessel) {
      Object.assign(vessel, updates);
    }
  }

  getAllVessels(): Vessel[] {
    return Array.from(this.vessels.values());
  }

  getVesselsInPort(): Vessel[] {
    // Obtener buques que están en el puerto (no incluye los que han partido)
    return Array.from(this.vessels.values()).filter(
      (vessel) => vessel.status !== VesselStatus.DEPARTED
    );
  }

  removeVessel(id: string): void {
    const vessel = this.vessels.get(id);
    if (vessel) {
      this.vessels.delete(id);
    }
  }
}
