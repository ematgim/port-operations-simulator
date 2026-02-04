import { PortLocation, LocationType, DockAssignment } from '../models/port.model';
import { Position } from '../models/tugboat.model';

export class PortService {
  private locations: Map<string, PortLocation> = new Map();
  private dockAssignments: Map<string, DockAssignment> = new Map();
  
  // Tiempo que un buque permanece en el dock (en milisegundos)
  private readonly DOCK_DURATION = 120000; // 120 segundos (2 minutos)

  constructor() {
    this.initializePortLocations();
  }

  private initializePortLocations(): void {
    // Punto de entrada del puerto (zona norte del mapa)
    const entryPoint: PortLocation = {
      id: 'ENTRY_01',
      name: 'Puerto Entrada Principal',
      position: { x: 500, y: 50 },
      type: LocationType.ENTRY_POINT,
    };

    // Múltiples docks distribuidos por el puerto
    const docks: PortLocation[] = [
      {
        id: 'DOCK_01',
        name: 'Muelle A1',
        position: { x: 200, y: 300 },
        type: LocationType.DOCK,
        occupied: false,
      },
      {
        id: 'DOCK_02',
        name: 'Muelle A2',
        position: { x: 400, y: 350 },
        type: LocationType.DOCK,
        occupied: false,
      },
      {
        id: 'DOCK_03',
        name: 'Muelle B1',
        position: { x: 600, y: 300 },
        type: LocationType.DOCK,
        occupied: false,
      },
      {
        id: 'DOCK_04',
        name: 'Muelle B2',
        position: { x: 800, y: 350 },
        type: LocationType.DOCK,
        occupied: false,
      },
      {
        id: 'DOCK_05',
        name: 'Muelle C1',
        position: { x: 300, y: 600 },
        type: LocationType.DOCK,
        occupied: false,
      },
      {
        id: 'DOCK_06',
        name: 'Muelle C2',
        position: { x: 700, y: 600 },
        type: LocationType.DOCK,
        occupied: false,
      },
    ];

    // Punto de salida del puerto (zona sur del mapa)
    const exitPoint: PortLocation = {
      id: 'EXIT_01',
      name: 'Puerto Salida Principal',
      position: { x: 500, y: 950 },
      type: LocationType.EXIT_POINT,
    };

    // Base de remolcadores (centro del puerto)
    const tugboatBase: PortLocation = {
      id: 'TUGBOAT_BASE_01',
      name: 'Base de Remolcadores',
      position: { x: 500, y: 500 },
      type: LocationType.TUGBOAT_BASE,
    };

    // Agregar todas las ubicaciones al mapa
    this.locations.set(entryPoint.id, entryPoint);
    docks.forEach(dock => this.locations.set(dock.id, dock));
    this.locations.set(exitPoint.id, exitPoint);
    this.locations.set(tugboatBase.id, tugboatBase);

    console.log(`⚓ Puerto inicializado con:`);
    console.log(`   - 1 punto de entrada: ${entryPoint.name}`);
    console.log(`   - ${docks.length} muelles disponibles`);
    console.log(`   - 1 punto de salida: ${exitPoint.name}`);
  }

  getEntryPoint(): PortLocation {
    return Array.from(this.locations.values()).find(
      loc => loc.type === LocationType.ENTRY_POINT
    )!;
  }

  getExitPoint(): PortLocation {
    return Array.from(this.locations.values()).find(
      loc => loc.type === LocationType.EXIT_POINT
    )!;
  }
  getTugboatBase(): PortLocation {
    return Array.from(this.locations.values()).find(
      (loc) => loc.type === LocationType.TUGBOAT_BASE
    )!;
  }
  getAllDocks(): PortLocation[] {
    return Array.from(this.locations.values()).filter(
      loc => loc.type === LocationType.DOCK
    );
  }

  getAvailableDocks(): PortLocation[] {
    return this.getAllDocks().filter(dock => !dock.occupied);
  }

  getDock(dockId: string): PortLocation | undefined {
    return this.locations.get(dockId);
  }

  assignVesselToDock(vesselId: string, dockId: string): boolean {
    const dock = this.locations.get(dockId);
    
    if (!dock || dock.type !== LocationType.DOCK) {
      console.error(`❌ Dock ${dockId} no encontrado`);
      return false;
    }

    if (dock.occupied) {
      console.error(`❌ Dock ${dockId} ya está ocupado`);
      return false;
    }

    dock.occupied = true;
    dock.occupiedBy = vesselId;

    const estimatedDepartureTime = new Date(Date.now() + this.DOCK_DURATION);

    const assignment: DockAssignment = {
      dockId,
      vesselId,
      assignedAt: new Date(),
      estimatedDepartureTime,
    };

    this.dockAssignments.set(vesselId, assignment);

    console.log(
      `⚓ Buque ${vesselId} asignado a ${dock.name} - Salida estimada en ${this.DOCK_DURATION / 1000}s`
    );

    return true;
  }

  releaseVesselFromDock(vesselId: string): boolean {
    const assignment = this.dockAssignments.get(vesselId);
    
    if (!assignment) {
      return false;
    }

    const dock = this.locations.get(assignment.dockId);
    if (dock) {
      dock.occupied = false;
      dock.occupiedBy = undefined;
      console.log(`🚢 Buque ${vesselId} liberado de ${dock.name}`);
    }

    this.dockAssignments.delete(vesselId);
    return true;
  }

  getDockAssignment(vesselId: string): DockAssignment | undefined {
    return this.dockAssignments.get(vesselId);
  }

  getVesselsReadyToDepart(): string[] {
    const now = Date.now();
    const readyVessels: string[] = [];

    this.dockAssignments.forEach((assignment) => {
      if (
        assignment.estimatedDepartureTime &&
        assignment.estimatedDepartureTime.getTime() <= now
      ) {
        readyVessels.push(assignment.vesselId);
      }
    });

    return readyVessels;
  }

  findClosestAvailableDock(position: Position): PortLocation | null {
    const availableDocks = this.getAvailableDocks();
    
    if (availableDocks.length === 0) {
      return null;
    }

    let closestDock = availableDocks[0];
    let minDistance = this.calculateDistance(position, closestDock.position);

    for (const dock of availableDocks.slice(1)) {
      const distance = this.calculateDistance(position, dock.position);
      if (distance < minDistance) {
        minDistance = distance;
        closestDock = dock;
      }
    }

    return closestDock;
  }

  private calculateDistance(pos1: Position, pos2: Position): number {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getPortStatus() {
    const docks = this.getAllDocks();
    const occupiedDocks = docks.filter(d => d.occupied).length;
    
    return {
      totalDocks: docks.length,
      occupiedDocks,
      availableDocks: docks.length - occupiedDocks,
      vesselsInPort: this.dockAssignments.size,
    };
  }
}
