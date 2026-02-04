import { AssignmentService } from '../../src/services/assignment.service';
import { Tugboat, TugboatStatus } from '../../src/models/tugboat.model';
import { Vessel, VesselStatus, VesselType } from '../../src/models/vessel.model';

describe('AssignmentService', () => {
  let service: AssignmentService;

  beforeEach(() => {
    service = new AssignmentService();
  });

  describe('assignTugboatToVessel', () => {
    it('should successfully assign an idle tugboat to a vessel', () => {
      const tugboat: Tugboat = {
        id: 'TUG_01',
        name: 'Hercules',
        position: { x: 500, y: 500 },
        status: TugboatStatus.IDLE,
        capacity: 50,
        speed: 10,
      };

      const vessel: Vessel = {
        id: 'VESSEL_01',
        name: 'MSC Meraviglia',
        imo: 'IMO9999999',
        type: VesselType.CRUISE,
        position: { x: 500, y: 50 },
        status: VesselStatus.AT_ENTRY,
        requestTime: new Date(),
      };

      const event = service.assignTugboatToVessel(tugboat, vessel);

      expect(event).not.toBeNull();
      expect(event?.vesselId).toBe('VESSEL_01');
      expect(event?.vesselName).toBe('MSC Meraviglia');
      expect(event?.tugboatId).toBe('TUG_01');
      expect(event?.tugboatName).toBe('Hercules');
      expect(event?.eventType).toBe('ASSIGNMENT');
      expect(event?.estimatedArrivalTime).toBeDefined();
    });

    it('should return null when tugboat is not idle', () => {
      const tugboat: Tugboat = {
        id: 'TUG_01',
        name: 'Hercules',
        position: { x: 500, y: 500 },
        status: TugboatStatus.MOVING,
        capacity: 50,
        speed: 10,
      };

      const vessel: Vessel = {
        id: 'VESSEL_01',
        name: 'MSC Meraviglia',
        imo: 'IMO9999999',
        type: VesselType.CRUISE,
        position: { x: 500, y: 50 },
        status: VesselStatus.AT_ENTRY,
        requestTime: new Date(),
      };

      const event = service.assignTugboatToVessel(tugboat, vessel);

      expect(event).toBeNull();
    });

    it('should calculate correct estimated arrival time', () => {
      const tugboat: Tugboat = {
        id: 'TUG_01',
        name: 'Hercules',
        position: { x: 0, y: 0 },
        status: TugboatStatus.IDLE,
        capacity: 50,
        speed: 10,
      };

      const vessel: Vessel = {
        id: 'VESSEL_01',
        name: 'MSC Meraviglia',
        imo: 'IMO9999999',
        type: VesselType.CRUISE,
        position: { x: 100, y: 0 },
        status: VesselStatus.AT_ENTRY,
        requestTime: new Date(),
      };

      const beforeTime = Date.now();
      const event = service.assignTugboatToVessel(tugboat, vessel);
      const afterTime = Date.now();

      expect(event).not.toBeNull();
      expect(event?.estimatedArrivalTime).toBeDefined();
      
      // The estimated arrival time should be in the future
      const eta = event?.estimatedArrivalTime?.getTime() || 0;
      expect(eta).toBeGreaterThan(beforeTime);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 3, y: 4 };

      const distance = service.calculateDistance(pos1, pos2);

      expect(distance).toBe(5); // 3-4-5 triangle
    });

    it('should return 0 for same position', () => {
      const pos = { x: 100, y: 200 };

      const distance = service.calculateDistance(pos, pos);

      expect(distance).toBe(0);
    });

    it('should calculate distance with negative coordinates', () => {
      const pos1 = { x: -3, y: -4 };
      const pos2 = { x: 0, y: 0 };

      const distance = service.calculateDistance(pos1, pos2);

      expect(distance).toBe(5);
    });
  });

  describe('calculateTravelTime', () => {
    it('should calculate travel time correctly', () => {
      const distance = 100;
      const speed = 10;

      const time = service.calculateTravelTime(distance, speed);

      expect(time).toBe(10000); // (100 / 10) * 1000 = 10000ms
    });

    it('should handle zero distance', () => {
      const time = service.calculateTravelTime(0, 10);

      expect(time).toBe(0);
    });

    it('should handle different speeds', () => {
      const distance = 100;

      const timeSlow = service.calculateTravelTime(distance, 5);
      const timeFast = service.calculateTravelTime(distance, 20);

      expect(timeSlow).toBe(20000);
      expect(timeFast).toBe(5000);
      expect(timeSlow).toBeGreaterThan(timeFast);
    });
  });

  describe('moveTugboatTowardsVessel', () => {
    it('should move tugboat towards vessel', () => {
      const tugboat: Tugboat = {
        id: 'TUG_01',
        name: 'Hercules',
        position: { x: 0, y: 0 },
        status: TugboatStatus.MOVING,
        capacity: 50,
        speed: 10,
      };

      const vessel: Vessel = {
        id: 'VESSEL_01',
        name: 'MSC Meraviglia',
        imo: 'IMO9999999',
        type: VesselType.CRUISE,
        position: { x: 100, y: 0 },
        status: VesselStatus.AT_ENTRY,
        requestTime: new Date(),
      };

      const arrived = service.moveTugboatTowardsVessel(tugboat, vessel, 1000);

      expect(arrived).toBe(false);
      expect(tugboat.position.x).toBeGreaterThan(0);
      expect(tugboat.position.x).toBeLessThan(100);
    });

    it('should return true when tugboat arrives at vessel', () => {
      const tugboat: Tugboat = {
        id: 'TUG_01',
        name: 'Hercules',
        position: { x: 95, y: 0 },
        status: TugboatStatus.MOVING,
        capacity: 50,
        speed: 10,
      };

      const vessel: Vessel = {
        id: 'VESSEL_01',
        name: 'MSC Meraviglia',
        imo: 'IMO9999999',
        type: VesselType.CRUISE,
        position: { x: 100, y: 0 },
        status: VesselStatus.AT_ENTRY,
        requestTime: new Date(),
      };

      const arrived = service.moveTugboatTowardsVessel(tugboat, vessel, 1000);

      expect(arrived).toBe(true);
      expect(tugboat.position.x).toBe(vessel.position.x);
      expect(tugboat.position.y).toBe(vessel.position.y);
    });

    it('should handle tugboat already at vessel position', () => {
      const tugboat: Tugboat = {
        id: 'TUG_01',
        name: 'Hercules',
        position: { x: 100, y: 100 },
        status: TugboatStatus.MOVING,
        capacity: 50,
        speed: 10,
      };

      const vessel: Vessel = {
        id: 'VESSEL_01',
        name: 'MSC Meraviglia',
        imo: 'IMO9999999',
        type: VesselType.CRUISE,
        position: { x: 100, y: 100 },
        status: VesselStatus.AT_ENTRY,
        requestTime: new Date(),
      };

      const arrived = service.moveTugboatTowardsVessel(tugboat, vessel, 1000);

      expect(arrived).toBe(true);
    });
  });

  describe('findBestAvailableTugboat', () => {
    it('should find the closest available tugboat', () => {
      const tugboats: Tugboat[] = [
        {
          id: 'TUG_01',
          name: 'Hercules',
          position: { x: 100, y: 100 },
          status: TugboatStatus.IDLE,
          capacity: 50,
          speed: 10,
        },
        {
          id: 'TUG_02',
          name: 'Titan',
          position: { x: 50, y: 50 },
          status: TugboatStatus.IDLE,
          capacity: 45,
          speed: 12,
        },
        {
          id: 'TUG_03',
          name: 'Atlas',
          position: { x: 200, y: 200 },
          status: TugboatStatus.IDLE,
          capacity: 55,
          speed: 9,
        },
      ];

      const vessel: Vessel = {
        id: 'VESSEL_01',
        name: 'MSC Meraviglia',
        imo: 'IMO9999999',
        type: VesselType.CRUISE,
        position: { x: 60, y: 60 },
        status: VesselStatus.AT_ENTRY,
        requestTime: new Date(),
      };

      const bestTugboat = service.findBestAvailableTugboat(tugboats, vessel);

      expect(bestTugboat).not.toBeNull();
      expect(bestTugboat?.id).toBe('TUG_02'); // TUG_02 is closest
    });

    it('should return null when no tugboats are available', () => {
      const tugboats: Tugboat[] = [
        {
          id: 'TUG_01',
          name: 'Hercules',
          position: { x: 100, y: 100 },
          status: TugboatStatus.MOVING,
          capacity: 50,
          speed: 10,
        },
        {
          id: 'TUG_02',
          name: 'Titan',
          position: { x: 50, y: 50 },
          status: TugboatStatus.ASSISTING,
          capacity: 45,
          speed: 12,
        },
      ];

      const vessel: Vessel = {
        id: 'VESSEL_01',
        name: 'MSC Meraviglia',
        imo: 'IMO9999999',
        type: VesselType.CRUISE,
        position: { x: 60, y: 60 },
        status: VesselStatus.AT_ENTRY,
        requestTime: new Date(),
      };

      const bestTugboat = service.findBestAvailableTugboat(tugboats, vessel);

      expect(bestTugboat).toBeNull();
    });

    it('should return null when tugboat array is empty', () => {
      const vessel: Vessel = {
        id: 'VESSEL_01',
        name: 'MSC Meraviglia',
        imo: 'IMO9999999',
        type: VesselType.CRUISE,
        position: { x: 60, y: 60 },
        status: VesselStatus.AT_ENTRY,
        requestTime: new Date(),
      };

      const bestTugboat = service.findBestAvailableTugboat([], vessel);

      expect(bestTugboat).toBeNull();
    });

    it('should only consider idle tugboats', () => {
      const tugboats: Tugboat[] = [
        {
          id: 'TUG_01',
          name: 'Hercules',
          position: { x: 10, y: 10 }, // Closest but busy
          status: TugboatStatus.MOVING,
          capacity: 50,
          speed: 10,
        },
        {
          id: 'TUG_02',
          name: 'Titan',
          position: { x: 100, y: 100 }, // Farther but available
          status: TugboatStatus.IDLE,
          capacity: 45,
          speed: 12,
        },
      ];

      const vessel: Vessel = {
        id: 'VESSEL_01',
        name: 'MSC Meraviglia',
        imo: 'IMO9999999',
        type: VesselType.CRUISE,
        position: { x: 0, y: 0 },
        status: VesselStatus.AT_ENTRY,
        requestTime: new Date(),
      };

      const bestTugboat = service.findBestAvailableTugboat(tugboats, vessel);

      expect(bestTugboat).not.toBeNull();
      expect(bestTugboat?.id).toBe('TUG_02');
    });
  });
});
