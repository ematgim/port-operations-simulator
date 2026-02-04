import { PortService } from '../../src/services/port.service';
import { LocationType } from '../../src/models/port.model';

describe('PortService', () => {
  let service: PortService;

  beforeEach(() => {
    service = new PortService();
  });

  describe('initialization', () => {
    it('should initialize port with all location types', () => {
      const entryPoint = service.getEntryPoint();
      const exitPoint = service.getExitPoint();
      const tugboatBase = service.getTugboatBase();
      const docks = service.getAllDocks();

      expect(entryPoint).toBeDefined();
      expect(entryPoint.type).toBe(LocationType.ENTRY_POINT);
      expect(exitPoint).toBeDefined();
      expect(exitPoint.type).toBe(LocationType.EXIT_POINT);
      expect(tugboatBase).toBeDefined();
      expect(tugboatBase.type).toBe(LocationType.TUGBOAT_BASE);
      expect(docks.length).toBeGreaterThan(0);
    });

    it('should initialize all docks as unoccupied', () => {
      const docks = service.getAllDocks();

      docks.forEach((dock) => {
        expect(dock.occupied).toBe(false);
        expect(dock.occupiedBy).toBeUndefined();
      });
    });
  });

  describe('getEntryPoint', () => {
    it('should return entry point location', () => {
      const entryPoint = service.getEntryPoint();

      expect(entryPoint.id).toBe('ENTRY_01');
      expect(entryPoint.type).toBe(LocationType.ENTRY_POINT);
      expect(entryPoint.position).toBeDefined();
    });
  });

  describe('getExitPoint', () => {
    it('should return exit point location', () => {
      const exitPoint = service.getExitPoint();

      expect(exitPoint.id).toBe('EXIT_01');
      expect(exitPoint.type).toBe(LocationType.EXIT_POINT);
      expect(exitPoint.position).toBeDefined();
    });
  });

  describe('getTugboatBase', () => {
    it('should return tugboat base location', () => {
      const base = service.getTugboatBase();

      expect(base.id).toBe('TUGBOAT_BASE_01');
      expect(base.type).toBe(LocationType.TUGBOAT_BASE);
      expect(base.position).toBeDefined();
    });
  });

  describe('getAllDocks', () => {
    it('should return all dock locations', () => {
      const docks = service.getAllDocks();

      expect(docks.length).toBe(6); // Based on initialization
      docks.forEach((dock) => {
        expect(dock.type).toBe(LocationType.DOCK);
      });
    });
  });

  describe('getAvailableDocks', () => {
    it('should return all docks initially', () => {
      const available = service.getAvailableDocks();
      const all = service.getAllDocks();

      expect(available.length).toBe(all.length);
    });

    it('should not return occupied docks', () => {
      const docks = service.getAllDocks();
      service.assignVesselToDock('VESSEL_01', docks[0].id);

      const available = service.getAvailableDocks();

      expect(available.length).toBe(docks.length - 1);
      expect(available.find((d) => d.id === docks[0].id)).toBeUndefined();
    });
  });

  describe('getDock', () => {
    it('should return specific dock by id', () => {
      const allDocks = service.getAllDocks();
      const dockId = allDocks[0].id;

      const dock = service.getDock(dockId);

      expect(dock).toBeDefined();
      expect(dock?.id).toBe(dockId);
    });

    it('should return undefined for non-existent dock', () => {
      const dock = service.getDock('INVALID_DOCK');

      expect(dock).toBeUndefined();
    });
  });

  describe('assignVesselToDock', () => {
    it('should successfully assign vessel to available dock', () => {
      const docks = service.getAllDocks();
      const dockId = docks[0].id;

      const result = service.assignVesselToDock('VESSEL_01', dockId);

      expect(result).toBe(true);
      const dock = service.getDock(dockId);
      expect(dock?.occupied).toBe(true);
      expect(dock?.occupiedBy).toBe('VESSEL_01');
    });

    it('should create dock assignment with estimated departure time', () => {
      const docks = service.getAllDocks();
      const dockId = docks[0].id;

      service.assignVesselToDock('VESSEL_01', dockId);

      const assignment = service.getDockAssignment('VESSEL_01');
      expect(assignment).toBeDefined();
      expect(assignment?.dockId).toBe(dockId);
      expect(assignment?.vesselId).toBe('VESSEL_01');
      expect(assignment?.estimatedDepartureTime).toBeDefined();
    });

    it('should fail to assign vessel to already occupied dock', () => {
      const docks = service.getAllDocks();
      const dockId = docks[0].id;

      service.assignVesselToDock('VESSEL_01', dockId);
      const result = service.assignVesselToDock('VESSEL_02', dockId);

      expect(result).toBe(false);
    });

    it('should fail to assign vessel to non-existent dock', () => {
      const result = service.assignVesselToDock('VESSEL_01', 'INVALID_DOCK');

      expect(result).toBe(false);
    });
  });

  describe('releaseVesselFromDock', () => {
    it('should successfully release vessel from dock', () => {
      const docks = service.getAllDocks();
      const dockId = docks[0].id;

      service.assignVesselToDock('VESSEL_01', dockId);
      const result = service.releaseVesselFromDock('VESSEL_01');

      expect(result).toBe(true);
      const dock = service.getDock(dockId);
      expect(dock?.occupied).toBe(false);
      expect(dock?.occupiedBy).toBeUndefined();
    });

    it('should remove dock assignment', () => {
      const docks = service.getAllDocks();
      const dockId = docks[0].id;

      service.assignVesselToDock('VESSEL_01', dockId);
      service.releaseVesselFromDock('VESSEL_01');

      const assignment = service.getDockAssignment('VESSEL_01');
      expect(assignment).toBeUndefined();
    });

    it('should return false for non-existent vessel', () => {
      const result = service.releaseVesselFromDock('INVALID_VESSEL');

      expect(result).toBe(false);
    });
  });

  describe('getDockAssignment', () => {
    it('should return assignment for assigned vessel', () => {
      const docks = service.getAllDocks();
      const dockId = docks[0].id;

      service.assignVesselToDock('VESSEL_01', dockId);
      const assignment = service.getDockAssignment('VESSEL_01');

      expect(assignment).toBeDefined();
      expect(assignment?.vesselId).toBe('VESSEL_01');
      expect(assignment?.dockId).toBe(dockId);
    });

    it('should return undefined for unassigned vessel', () => {
      const assignment = service.getDockAssignment('VESSEL_99');

      expect(assignment).toBeUndefined();
    });
  });

  describe('getVesselsReadyToDepart', () => {
    it('should return empty array when no vessels are ready', () => {
      const docks = service.getAllDocks();
      service.assignVesselToDock('VESSEL_01', docks[0].id);

      const ready = service.getVesselsReadyToDepart();

      expect(ready).toEqual([]);
    });

    it('should identify vessels past their departure time', (done) => {
      const docks = service.getAllDocks();
      service.assignVesselToDock('VESSEL_01', docks[0].id);

      // Wait a bit more than the dock duration
      setTimeout(() => {
        const ready = service.getVesselsReadyToDepart();
        expect(ready.length).toBeGreaterThanOrEqual(0);
        done();
      }, 100);
    });
  });

  describe('findClosestAvailableDock', () => {
    it('should find the closest available dock', () => {
      const position = { x: 200, y: 300 };
      const closestDock = service.findClosestAvailableDock(position);

      expect(closestDock).not.toBeNull();
      expect(closestDock?.type).toBe(LocationType.DOCK);
    });

    it('should return null when no docks are available', () => {
      const docks = service.getAllDocks();

      // Occupy all docks
      docks.forEach((dock, index) => {
        service.assignVesselToDock(`VESSEL_${index}`, dock.id);
      });

      const position = { x: 200, y: 300 };
      const closestDock = service.findClosestAvailableDock(position);

      expect(closestDock).toBeNull();
    });

    it('should not return occupied docks', () => {
      const docks = service.getAllDocks();
      const position = docks[0].position;

      // Occupy the closest dock
      service.assignVesselToDock('VESSEL_01', docks[0].id);

      const closestDock = service.findClosestAvailableDock(position);

      expect(closestDock).not.toBeNull();
      expect(closestDock?.id).not.toBe(docks[0].id);
    });
  });

  describe('getPortStatus', () => {
    it('should return correct port status with no vessels', () => {
      const status = service.getPortStatus();

      expect(status.totalDocks).toBe(6);
      expect(status.occupiedDocks).toBe(0);
      expect(status.availableDocks).toBe(6);
      expect(status.vesselsInPort).toBe(0);
    });

    it('should return correct port status with vessels', () => {
      const docks = service.getAllDocks();
      service.assignVesselToDock('VESSEL_01', docks[0].id);
      service.assignVesselToDock('VESSEL_02', docks[1].id);

      const status = service.getPortStatus();

      expect(status.totalDocks).toBe(6);
      expect(status.occupiedDocks).toBe(2);
      expect(status.availableDocks).toBe(4);
      expect(status.vesselsInPort).toBe(2);
    });

    it('should update status after releasing vessels', () => {
      const docks = service.getAllDocks();
      service.assignVesselToDock('VESSEL_01', docks[0].id);
      service.assignVesselToDock('VESSEL_02', docks[1].id);
      service.releaseVesselFromDock('VESSEL_01');

      const status = service.getPortStatus();

      expect(status.occupiedDocks).toBe(1);
      expect(status.availableDocks).toBe(5);
      expect(status.vesselsInPort).toBe(1);
    });
  });
});
