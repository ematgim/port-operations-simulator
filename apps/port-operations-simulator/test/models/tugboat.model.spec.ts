import {
  Tugboat,
  Position,
  TugboatStatus,
  MovementEvent,
} from '../../src/models/tugboat.model';

describe('Tugboat Model', () => {
  describe('Tugboat', () => {
    it('should create a valid Tugboat', () => {
      const tugboat: Tugboat = {
        id: 'TUG_01',
        name: 'Hercules',
        position: { x: 500, y: 500 },
        status: TugboatStatus.IDLE,
        capacity: 50,
        speed: 10,
      };

      expect(tugboat.id).toBe('TUG_01');
      expect(tugboat.name).toBe('Hercules');
      expect(tugboat.position).toEqual({ x: 500, y: 500 });
      expect(tugboat.status).toBe(TugboatStatus.IDLE);
      expect(tugboat.capacity).toBe(50);
      expect(tugboat.speed).toBe(10);
    });
  });

  describe('Position', () => {
    it('should create a position with x and y coordinates', () => {
      const position: Position = { x: 100, y: 200 };
      expect(position.x).toBe(100);
      expect(position.y).toBe(200);
      expect(position.dock).toBeUndefined();
    });

    it('should create a position with dock reference', () => {
      const position: Position = { x: 100, y: 200, dock: 'DOCK_01' };
      expect(position.x).toBe(100);
      expect(position.y).toBe(200);
      expect(position.dock).toBe('DOCK_01');
    });
  });

  describe('TugboatStatus', () => {
    it('should have all tugboat statuses defined', () => {
      expect(TugboatStatus.IDLE).toBe('IDLE');
      expect(TugboatStatus.MOVING).toBe('MOVING');
      expect(TugboatStatus.DOCKED).toBe('DOCKED');
      expect(TugboatStatus.ASSISTING).toBe('ASSISTING');
    });
  });

  describe('MovementEvent', () => {
    it('should create a valid MovementEvent without assigned vessel', () => {
      const now = new Date();
      const event: MovementEvent = {
        tugboatId: 'TUG_01',
        tugboatName: 'Hercules',
        timestamp: now,
        position: { x: 100, y: 200 },
        status: TugboatStatus.MOVING,
        speed: 10,
      };

      expect(event.tugboatId).toBe('TUG_01');
      expect(event.tugboatName).toBe('Hercules');
      expect(event.timestamp).toBe(now);
      expect(event.position).toEqual({ x: 100, y: 200 });
      expect(event.status).toBe(TugboatStatus.MOVING);
      expect(event.speed).toBe(10);
      expect(event.assignedVesselId).toBeUndefined();
    });

    it('should create a MovementEvent with assigned vessel', () => {
      const now = new Date();
      const event: MovementEvent = {
        tugboatId: 'TUG_01',
        tugboatName: 'Hercules',
        timestamp: now,
        position: { x: 100, y: 200 },
        status: TugboatStatus.ASSISTING,
        assignedVesselId: 'VESSEL_01',
        speed: 10,
      };

      expect(event.assignedVesselId).toBe('VESSEL_01');
      expect(event.status).toBe(TugboatStatus.ASSISTING);
    });
  });
});
