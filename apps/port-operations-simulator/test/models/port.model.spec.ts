import { PortLocation, LocationType, DockAssignment } from '../../src/models/port.model';
import { Position } from '../../src/models/tugboat.model';

describe('Port Model', () => {
  describe('PortLocation', () => {
    it('should create a valid PortLocation with all required fields', () => {
      const location: PortLocation = {
        id: 'DOCK_01',
        name: 'Muelle A1',
        position: { x: 100, y: 200 },
        type: LocationType.DOCK,
      };

      expect(location.id).toBe('DOCK_01');
      expect(location.name).toBe('Muelle A1');
      expect(location.position).toEqual({ x: 100, y: 200 });
      expect(location.type).toBe(LocationType.DOCK);
      expect(location.occupied).toBeUndefined();
      expect(location.occupiedBy).toBeUndefined();
    });

    it('should create a PortLocation with occupied status', () => {
      const location: PortLocation = {
        id: 'DOCK_02',
        name: 'Muelle A2',
        position: { x: 200, y: 300 },
        type: LocationType.DOCK,
        occupied: true,
        occupiedBy: 'VESSEL_01',
      };

      expect(location.occupied).toBe(true);
      expect(location.occupiedBy).toBe('VESSEL_01');
    });
  });

  describe('LocationType', () => {
    it('should have all location types defined', () => {
      expect(LocationType.ENTRY_POINT).toBe('ENTRY_POINT');
      expect(LocationType.DOCK).toBe('DOCK');
      expect(LocationType.EXIT_POINT).toBe('EXIT_POINT');
      expect(LocationType.TUGBOAT_BASE).toBe('TUGBOAT_BASE');
    });
  });

  describe('DockAssignment', () => {
    it('should create a valid DockAssignment', () => {
      const now = new Date();
      const estimatedDeparture = new Date(now.getTime() + 120000);

      const assignment: DockAssignment = {
        dockId: 'DOCK_01',
        vesselId: 'VESSEL_01',
        assignedAt: now,
        estimatedDepartureTime: estimatedDeparture,
      };

      expect(assignment.dockId).toBe('DOCK_01');
      expect(assignment.vesselId).toBe('VESSEL_01');
      expect(assignment.assignedAt).toBe(now);
      expect(assignment.estimatedDepartureTime).toBe(estimatedDeparture);
    });

    it('should create a DockAssignment without estimated departure time', () => {
      const now = new Date();

      const assignment: DockAssignment = {
        dockId: 'DOCK_01',
        vesselId: 'VESSEL_01',
        assignedAt: now,
      };

      expect(assignment.estimatedDepartureTime).toBeUndefined();
    });
  });
});
