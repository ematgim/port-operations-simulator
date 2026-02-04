import {
  Vessel,
  VesselType,
  VesselStatus,
  AssignmentEvent,
} from '../../src/models/vessel.model';

describe('Vessel Model', () => {
  describe('Vessel', () => {
    it('should create a valid Vessel at entry point', () => {
      const now = new Date();
      const vessel: Vessel = {
        id: 'VESSEL_01',
        name: 'MSC Meraviglia',
        imo: 'IMO9999999',
        type: VesselType.CRUISE,
        position: { x: 500, y: 50 },
        status: VesselStatus.AT_ENTRY,
        requestTime: now,
      };

      expect(vessel.id).toBe('VESSEL_01');
      expect(vessel.name).toBe('MSC Meraviglia');
      expect(vessel.type).toBe(VesselType.CRUISE);
      expect(vessel.status).toBe(VesselStatus.AT_ENTRY);
      expect(vessel.requestTime).toBe(now);
      expect(vessel.assignedTugboatId).toBeUndefined();
    });

    it('should create a Vessel with tugboat assignment', () => {
      const vessel: Vessel = {
        id: 'VESSEL_02',
        name: 'Evergreen',
        imo: 'IMO9999998',
        type: VesselType.CONTAINER,
        position: { x: 300, y: 200 },
        status: VesselStatus.BEING_TOWED_TO_DOCK,
        assignedTugboatId: 'TUG_01',
        requestTime: new Date(),
      };

      expect(vessel.assignedTugboatId).toBe('TUG_01');
      expect(vessel.status).toBe(VesselStatus.BEING_TOWED_TO_DOCK);
    });

    it('should create a docked Vessel', () => {
      const now = new Date();
      const vessel: Vessel = {
        id: 'VESSEL_03',
        name: 'Maersk',
        imo: 'IMO9999997',
        type: VesselType.CONTAINER,
        position: { x: 200, y: 300 },
        status: VesselStatus.DOCKED,
        assignedDockId: 'DOCK_01',
        dockedAt: now,
        requestTime: new Date(),
      };

      expect(vessel.status).toBe(VesselStatus.DOCKED);
      expect(vessel.assignedDockId).toBe('DOCK_01');
      expect(vessel.dockedAt).toBe(now);
    });
  });

  describe('VesselType', () => {
    it('should have all vessel types defined', () => {
      expect(VesselType.CARGO).toBe('CARGO');
      expect(VesselType.CONTAINER).toBe('CONTAINER');
      expect(VesselType.TANKER).toBe('TANKER');
      expect(VesselType.CRUISE).toBe('CRUISE');
    });
  });

  describe('VesselStatus', () => {
    it('should have all vessel statuses defined', () => {
      expect(VesselStatus.AT_ENTRY).toBe('AT_ENTRY');
      expect(VesselStatus.BEING_TOWED_TO_DOCK).toBe('BEING_TOWED_TO_DOCK');
      expect(VesselStatus.DOCKED).toBe('DOCKED');
      expect(VesselStatus.BEING_TOWED_TO_EXIT).toBe('BEING_TOWED_TO_EXIT');
      expect(VesselStatus.DEPARTED).toBe('DEPARTED');
    });
  });

  describe('AssignmentEvent', () => {
    it('should create an ASSIGNMENT event', () => {
      const now = new Date();
      const eta = new Date(now.getTime() + 60000);

      const event: AssignmentEvent = {
        vesselId: 'VESSEL_01',
        vesselName: 'MSC Meraviglia',
        tugboatId: 'TUG_01',
        tugboatName: 'Hercules',
        timestamp: now,
        eventType: 'ASSIGNMENT',
        estimatedArrivalTime: eta,
      };

      expect(event.vesselId).toBe('VESSEL_01');
      expect(event.vesselName).toBe('MSC Meraviglia');
      expect(event.tugboatId).toBe('TUG_01');
      expect(event.tugboatName).toBe('Hercules');
      expect(event.eventType).toBe('ASSIGNMENT');
      expect(event.estimatedArrivalTime).toBe(eta);
    });

    it('should create a TUGBOAT_ARRIVED event', () => {
      const event: AssignmentEvent = {
        vesselId: 'VESSEL_01',
        vesselName: 'MSC Meraviglia',
        tugboatId: 'TUG_01',
        tugboatName: 'Hercules',
        timestamp: new Date(),
        eventType: 'TUGBOAT_ARRIVED',
      };

      expect(event.eventType).toBe('TUGBOAT_ARRIVED');
      expect(event.estimatedArrivalTime).toBeUndefined();
    });

    it('should create a DOCKED event', () => {
      const event: AssignmentEvent = {
        vesselId: 'VESSEL_01',
        vesselName: 'MSC Meraviglia',
        tugboatId: 'TUG_01',
        tugboatName: 'Hercules',
        timestamp: new Date(),
        eventType: 'DOCKED',
      };

      expect(event.eventType).toBe('DOCKED');
    });

    it('should create an ASSISTANCE_COMPLETE event', () => {
      const event: AssignmentEvent = {
        vesselId: 'VESSEL_01',
        vesselName: 'MSC Meraviglia',
        tugboatId: 'TUG_01',
        tugboatName: 'Hercules',
        timestamp: new Date(),
        eventType: 'ASSISTANCE_COMPLETE',
      };

      expect(event.eventType).toBe('ASSISTANCE_COMPLETE');
    });
  });
});
