import { TugboatSimulator } from '../../src/services/tugboat.simulator';
import { TugboatStatus } from '../../src/models/tugboat.model';

describe('TugboatSimulator', () => {
  let simulator: TugboatSimulator;

  beforeEach(() => {
    simulator = new TugboatSimulator();
  });

  describe('initialization', () => {
    it('should initialize with tugboats', () => {
      const tugboats = simulator.getTugboats();

      expect(tugboats.length).toBeGreaterThan(0);
      expect(tugboats.length).toBe(5);
    });

    it('should initialize all tugboats as IDLE', () => {
      const tugboats = simulator.getTugboats();

      tugboats.forEach((tugboat) => {
        expect(tugboat.status).toBe(TugboatStatus.IDLE);
      });
    });

    it('should initialize tugboats at base position', () => {
      const tugboats = simulator.getTugboats();

      tugboats.forEach((tugboat) => {
        expect(tugboat.position.x).toBe(500);
        expect(tugboat.position.y).toBe(500);
      });
    });

    it('should initialize tugboats with correct properties', () => {
      const tugboats = simulator.getTugboats();

      tugboats.forEach((tugboat) => {
        expect(tugboat.id).toBeDefined();
        expect(tugboat.name).toBeDefined();
        expect(tugboat.capacity).toBeGreaterThan(0);
        expect(tugboat.speed).toBeGreaterThan(0);
        expect(tugboat.position).toBeDefined();
        expect(tugboat.status).toBeDefined();
      });
    });

    it('should initialize expected tugboats by name', () => {
      const tugboats = simulator.getTugboats();
      const names = tugboats.map((t) => t.name);

      expect(names).toContain('Hercules');
      expect(names).toContain('Titan');
      expect(names).toContain('Atlas');
      expect(names).toContain('Neptune');
      expect(names).toContain('Poseidon');
    });
  });

  describe('getTugboats', () => {
    it('should return all tugboats', () => {
      const tugboats = simulator.getTugboats();

      expect(Array.isArray(tugboats)).toBe(true);
      expect(tugboats.length).toBe(5);
    });

    it('should return a new array each time', () => {
      const tugboats1 = simulator.getTugboats();
      const tugboats2 = simulator.getTugboats();

      expect(tugboats1).not.toBe(tugboats2);
      expect(tugboats1).toEqual(tugboats2);
    });
  });

  describe('getTugboat', () => {
    it('should return tugboat by id', () => {
      const tugboats = simulator.getTugboats();
      const firstTugboat = tugboats[0];

      const tugboat = simulator.getTugboat(firstTugboat.id);

      expect(tugboat).toBeDefined();
      expect(tugboat?.id).toBe(firstTugboat.id);
      expect(tugboat?.name).toBe(firstTugboat.name);
    });

    it('should return undefined for non-existent id', () => {
      const tugboat = simulator.getTugboat('INVALID_ID');

      expect(tugboat).toBeUndefined();
    });
  });

  describe('updateTugboat', () => {
    it('should update tugboat position', () => {
      const tugboats = simulator.getTugboats();
      const tugboatId = tugboats[0].id;
      const newPosition = { x: 100, y: 200 };

      simulator.updateTugboat(tugboatId, { position: newPosition });

      const updated = simulator.getTugboat(tugboatId);
      expect(updated?.position).toEqual(newPosition);
    });

    it('should update tugboat status', () => {
      const tugboats = simulator.getTugboats();
      const tugboatId = tugboats[0].id;

      simulator.updateTugboat(tugboatId, { status: TugboatStatus.MOVING });

      const updated = simulator.getTugboat(tugboatId);
      expect(updated?.status).toBe(TugboatStatus.MOVING);
    });

    it('should update multiple properties at once', () => {
      const tugboats = simulator.getTugboats();
      const tugboatId = tugboats[0].id;

      simulator.updateTugboat(tugboatId, {
        position: { x: 300, y: 400 },
        status: TugboatStatus.ASSISTING,
      });

      const updated = simulator.getTugboat(tugboatId);
      expect(updated?.position).toEqual({ x: 300, y: 400 });
      expect(updated?.status).toBe(TugboatStatus.ASSISTING);
    });

    it('should not throw error for non-existent tugboat', () => {
      expect(() => {
        simulator.updateTugboat('INVALID_ID', { status: TugboatStatus.MOVING });
      }).not.toThrow();
    });

    it('should preserve unchanged properties', () => {
      const tugboats = simulator.getTugboats();
      const tugboatId = tugboats[0].id;
      const originalName = tugboats[0].name;
      const originalCapacity = tugboats[0].capacity;

      simulator.updateTugboat(tugboatId, { status: TugboatStatus.MOVING });

      const updated = simulator.getTugboat(tugboatId);
      expect(updated?.name).toBe(originalName);
      expect(updated?.capacity).toBe(originalCapacity);
    });
  });

  describe('assignTugboatToVessel', () => {
    it('should assign tugboat to vessel', () => {
      const tugboatId = '1';
      const vesselId = 'VESSEL_01';

      simulator.assignTugboatToVessel(tugboatId, vesselId);

      const assignment = simulator.getAssignment(tugboatId);
      expect(assignment).toBeDefined();
      expect(assignment?.tugboatId).toBe(tugboatId);
      expect(assignment?.vesselId).toBe(vesselId);
      expect(assignment?.assignedAt).toBeInstanceOf(Date);
    });

    it('should overwrite previous assignment', () => {
      const tugboatId = '1';

      simulator.assignTugboatToVessel(tugboatId, 'VESSEL_01');
      simulator.assignTugboatToVessel(tugboatId, 'VESSEL_02');

      const assignment = simulator.getAssignment(tugboatId);
      expect(assignment?.vesselId).toBe('VESSEL_02');
    });
  });

  describe('unassignTugboat', () => {
    it('should remove tugboat assignment', () => {
      const tugboatId = '1';
      const vesselId = 'VESSEL_01';

      simulator.assignTugboatToVessel(tugboatId, vesselId);
      simulator.unassignTugboat(tugboatId);

      const assignment = simulator.getAssignment(tugboatId);
      expect(assignment).toBeUndefined();
    });

    it('should not throw error for non-existent assignment', () => {
      expect(() => {
        simulator.unassignTugboat('INVALID_ID');
      }).not.toThrow();
    });
  });

  describe('getAssignment', () => {
    it('should return assignment for assigned tugboat', () => {
      const tugboatId = '1';
      const vesselId = 'VESSEL_01';

      simulator.assignTugboatToVessel(tugboatId, vesselId);
      const assignment = simulator.getAssignment(tugboatId);

      expect(assignment).toBeDefined();
      expect(assignment?.tugboatId).toBe(tugboatId);
      expect(assignment?.vesselId).toBe(vesselId);
    });

    it('should return undefined for unassigned tugboat', () => {
      const assignment = simulator.getAssignment('1');

      expect(assignment).toBeUndefined();
    });
  });

  describe('createMovementEvent', () => {
    it('should create movement event without assigned vessel', () => {
      const tugboats = simulator.getTugboats();
      const tugboat = tugboats[0];

      const event = simulator.createMovementEvent(tugboat);

      expect(event.tugboatId).toBe(tugboat.id);
      expect(event.tugboatName).toBe(tugboat.name);
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.position).toEqual(tugboat.position);
      expect(event.status).toBe(tugboat.status);
      expect(event.speed).toBe(tugboat.speed);
      expect(event.assignedVesselId).toBeUndefined();
    });

    it('should create movement event with assigned vessel', () => {
      const tugboats = simulator.getTugboats();
      const tugboat = tugboats[0];
      const vesselId = 'VESSEL_01';

      const event = simulator.createMovementEvent(tugboat, vesselId);

      expect(event.assignedVesselId).toBe(vesselId);
    });

    it('should create new position object (not reference)', () => {
      const tugboats = simulator.getTugboats();
      const tugboat = tugboats[0];

      const event = simulator.createMovementEvent(tugboat);

      expect(event.position).not.toBe(tugboat.position);
      expect(event.position).toEqual(tugboat.position);
    });

    it('should capture current timestamp', () => {
      const tugboats = simulator.getTugboats();
      const tugboat = tugboats[0];
      const before = Date.now();

      const event = simulator.createMovementEvent(tugboat);

      const after = Date.now();
      const eventTime = event.timestamp.getTime();

      expect(eventTime).toBeGreaterThanOrEqual(before);
      expect(eventTime).toBeLessThanOrEqual(after);
    });
  });

  describe('assignment workflow', () => {
    it('should handle complete assignment lifecycle', () => {
      const tugboatId = '1';
      const vesselId = 'VESSEL_01';

      // Assign
      simulator.assignTugboatToVessel(tugboatId, vesselId);
      expect(simulator.getAssignment(tugboatId)).toBeDefined();

      // Update status
      simulator.updateTugboat(tugboatId, { status: TugboatStatus.MOVING });
      expect(simulator.getTugboat(tugboatId)?.status).toBe(TugboatStatus.MOVING);

      // Move to vessel
      simulator.updateTugboat(tugboatId, { 
        position: { x: 100, y: 200 },
        status: TugboatStatus.ASSISTING 
      });
      
      const tugboat = simulator.getTugboat(tugboatId);
      expect(tugboat?.position).toEqual({ x: 100, y: 200 });
      expect(tugboat?.status).toBe(TugboatStatus.ASSISTING);

      // Complete assistance and unassign
      simulator.unassignTugboat(tugboatId);
      expect(simulator.getAssignment(tugboatId)).toBeUndefined();

      // Return to idle
      simulator.updateTugboat(tugboatId, { status: TugboatStatus.IDLE });
      expect(simulator.getTugboat(tugboatId)?.status).toBe(TugboatStatus.IDLE);
    });
  });
});
