import { VesselService } from '../../src/services/vessel.service';
import { PortService } from '../../src/services/port.service';
import { VesselStatus, VesselType } from '../../src/models/vessel.model';

describe('VesselService', () => {
  let service: VesselService;
  let portService: PortService;

  beforeEach(() => {
    portService = new PortService();
    service = new VesselService(portService);
  });

  describe('initialization', () => {
    it('should initialize with empty vessel list', () => {
      const vessels = service.getAllVessels();
      expect(vessels.length).toBe(0);
    });

    it('should load vessels catalog', () => {
      // The constructor should log that vessels were loaded
      expect(service).toBeDefined();
    });
  });

  describe('generateVessel', () => {
    it('should generate a vessel with all required properties', () => {
      const vessel = service.generateVessel();

      expect(vessel.id).toBeDefined();
      expect(vessel.name).toBeDefined();
      expect(vessel.type).toBeDefined();
      expect(vessel.position).toBeDefined();
      expect(vessel.status).toBe(VesselStatus.AT_ENTRY);
      expect(vessel.requestTime).toBeInstanceOf(Date);
    });

    it('should generate vessel at entry point position', () => {
      const entryPoint = portService.getEntryPoint();
      const vessel = service.generateVessel();

      // Position should be near entry point (with small random variation of up to 20 units)
      expect(Math.abs(vessel.position.x - entryPoint.position.x)).toBeLessThanOrEqual(20);
      expect(Math.abs(vessel.position.y - entryPoint.position.y)).toBeLessThanOrEqual(20);
    });

    it('should generate unique vessel IDs', () => {
      const vessel1 = service.generateVessel();
      const vessel2 = service.generateVessel();
      const vessel3 = service.generateVessel();

      expect(vessel1.id).not.toBe(vessel2.id);
      expect(vessel2.id).not.toBe(vessel3.id);
      expect(vessel1.id).not.toBe(vessel3.id);
    });

    it('should increment vessel ID counter', () => {
      const vessel1 = service.generateVessel();
      const vessel2 = service.generateVessel();

      const id1 = parseInt(vessel1.id.substring(1));
      const id2 = parseInt(vessel2.id.substring(1));

      expect(id2).toBe(id1 + 1);
    });

    it('should add vessel to internal collection', () => {
      const vessel = service.generateVessel();
      const found = service.getVessel(vessel.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(vessel.id);
    });

    it('should generate vessels with valid types', () => {
      const vessels = Array.from({ length: 10 }, () => service.generateVessel());
      const validTypes = Object.values(VesselType);

      vessels.forEach((vessel) => {
        expect(validTypes).toContain(vessel.type);
      });
    });

    it('should use names from catalog', () => {
      const vessel = service.generateVessel();
      expect(vessel.name).toBeTruthy();
      expect(typeof vessel.name).toBe('string');
    });
  });

  describe('getVessel', () => {
    it('should return vessel by id', () => {
      const vessel = service.generateVessel();
      const found = service.getVessel(vessel.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(vessel.id);
      expect(found?.name).toBe(vessel.name);
    });

    it('should return undefined for non-existent vessel', () => {
      const found = service.getVessel('INVALID_ID');
      expect(found).toBeUndefined();
    });
  });

  describe('updateVessel', () => {
    it('should update vessel status', () => {
      const vessel = service.generateVessel();

      service.updateVessel(vessel.id, { status: VesselStatus.BEING_TOWED_TO_DOCK });

      const updated = service.getVessel(vessel.id);
      expect(updated?.status).toBe(VesselStatus.BEING_TOWED_TO_DOCK);
    });

    it('should update vessel position', () => {
      const vessel = service.generateVessel();
      const newPosition = { x: 300, y: 400 };

      service.updateVessel(vessel.id, { position: newPosition });

      const updated = service.getVessel(vessel.id);
      expect(updated?.position).toEqual(newPosition);
    });

    it('should update assigned tugboat', () => {
      const vessel = service.generateVessel();

      service.updateVessel(vessel.id, { assignedTugboatId: 'TUG_01' });

      const updated = service.getVessel(vessel.id);
      expect(updated?.assignedTugboatId).toBe('TUG_01');
    });

    it('should update assigned dock', () => {
      const vessel = service.generateVessel();
      const docks = portService.getAllDocks();

      service.updateVessel(vessel.id, { 
        assignedDockId: docks[0].id,
        status: VesselStatus.DOCKED,
        dockedAt: new Date(),
      });

      const updated = service.getVessel(vessel.id);
      expect(updated?.assignedDockId).toBe(docks[0].id);
      expect(updated?.status).toBe(VesselStatus.DOCKED);
      expect(updated?.dockedAt).toBeInstanceOf(Date);
    });

    it('should not throw error for non-existent vessel', () => {
      expect(() => {
        service.updateVessel('INVALID_ID', { status: VesselStatus.DOCKED });
      }).not.toThrow();
    });

    it('should update multiple properties at once', () => {
      const vessel = service.generateVessel();

      service.updateVessel(vessel.id, {
        status: VesselStatus.BEING_TOWED_TO_DOCK,
        assignedTugboatId: 'TUG_01',
        position: { x: 100, y: 200 },
      });

      const updated = service.getVessel(vessel.id);
      expect(updated?.status).toBe(VesselStatus.BEING_TOWED_TO_DOCK);
      expect(updated?.assignedTugboatId).toBe('TUG_01');
      expect(updated?.position).toEqual({ x: 100, y: 200 });
    });
  });

  describe('getAllVessels', () => {
    it('should return empty array initially', () => {
      const vessels = service.getAllVessels();
      expect(vessels).toEqual([]);
    });

    it('should return all vessels', () => {
      service.generateVessel();
      service.generateVessel();
      service.generateVessel();

      const vessels = service.getAllVessels();
      expect(vessels.length).toBe(3);
    });

    it('should return array copy, not reference', () => {
      service.generateVessel();

      const vessels1 = service.getAllVessels();
      const vessels2 = service.getAllVessels();

      expect(vessels1).not.toBe(vessels2);
      expect(vessels1).toEqual(vessels2);
    });
  });

  describe('getVesselsInPort', () => {
    it('should return all vessels except departed ones', () => {
      const vessel1 = service.generateVessel();
      const vessel2 = service.generateVessel();
      const vessel3 = service.generateVessel();

      service.updateVessel(vessel2.id, { status: VesselStatus.DEPARTED });

      const inPort = service.getVesselsInPort();

      expect(inPort.length).toBe(2);
      expect(inPort.find((v) => v.id === vessel1.id)).toBeDefined();
      expect(inPort.find((v) => v.id === vessel3.id)).toBeDefined();
      expect(inPort.find((v) => v.id === vessel2.id)).toBeUndefined();
    });

    it('should include docked vessels', () => {
      const vessel = service.generateVessel();
      service.updateVessel(vessel.id, { status: VesselStatus.DOCKED });

      const inPort = service.getVesselsInPort();

      expect(inPort.length).toBe(1);
      expect(inPort[0].status).toBe(VesselStatus.DOCKED);
    });

    it('should include vessels being towed', () => {
      const vessel = service.generateVessel();
      service.updateVessel(vessel.id, { status: VesselStatus.BEING_TOWED_TO_DOCK });

      const inPort = service.getVesselsInPort();

      expect(inPort.length).toBe(1);
      expect(inPort[0].status).toBe(VesselStatus.BEING_TOWED_TO_DOCK);
    });

    it('should include vessels at entry', () => {
      const vessel = service.generateVessel();

      const inPort = service.getVesselsInPort();

      expect(inPort.length).toBe(1);
      expect(inPort[0].status).toBe(VesselStatus.AT_ENTRY);
    });
  });

  describe('removeVessel', () => {
    it('should remove vessel from collection', () => {
      const vessel = service.generateVessel();

      service.removeVessel(vessel.id);

      const found = service.getVessel(vessel.id);
      expect(found).toBeUndefined();
    });

    it('should not affect other vessels', () => {
      const vessel1 = service.generateVessel();
      const vessel2 = service.generateVessel();
      const vessel3 = service.generateVessel();

      service.removeVessel(vessel2.id);

      expect(service.getVessel(vessel1.id)).toBeDefined();
      expect(service.getVessel(vessel3.id)).toBeDefined();
    });

    it('should not throw error for non-existent vessel', () => {
      expect(() => {
        service.removeVessel('INVALID_ID');
      }).not.toThrow();
    });
  });

  describe('vessel lifecycle', () => {
    it('should handle complete vessel lifecycle', () => {
      // Generate vessel at entry
      const vessel = service.generateVessel();
      expect(vessel.status).toBe(VesselStatus.AT_ENTRY);

      // Assign tugboat and start towing to dock
      service.updateVessel(vessel.id, {
        assignedTugboatId: 'TUG_01',
        status: VesselStatus.BEING_TOWED_TO_DOCK,
      });
      let updated = service.getVessel(vessel.id);
      expect(updated?.status).toBe(VesselStatus.BEING_TOWED_TO_DOCK);

      // Arrive and dock
      const docks = portService.getAllDocks();
      service.updateVessel(vessel.id, {
        status: VesselStatus.DOCKED,
        assignedDockId: docks[0].id,
        dockedAt: new Date(),
        position: docks[0].position,
      });
      updated = service.getVessel(vessel.id);
      expect(updated?.status).toBe(VesselStatus.DOCKED);
      expect(updated?.assignedDockId).toBeDefined();

      // Start departure
      service.updateVessel(vessel.id, {
        status: VesselStatus.BEING_TOWED_TO_EXIT,
        assignedTugboatId: 'TUG_02',
      });
      updated = service.getVessel(vessel.id);
      expect(updated?.status).toBe(VesselStatus.BEING_TOWED_TO_EXIT);

      // Depart
      service.updateVessel(vessel.id, {
        status: VesselStatus.DEPARTED,
        departureTime: new Date(),
      });
      updated = service.getVessel(vessel.id);
      expect(updated?.status).toBe(VesselStatus.DEPARTED);
      expect(updated?.departureTime).toBeInstanceOf(Date);
    });
  });

  describe('catalog cycling', () => {
    it('should cycle through catalog when generating many vessels', () => {
      // Generate more vessels than catalog size to test cycling
      const vessels = Array.from({ length: 100 }, () => service.generateVessel());

      // All should have valid names and types
      vessels.forEach((vessel) => {
        expect(vessel.name).toBeTruthy();
        expect(Object.values(VesselType)).toContain(vessel.type);
      });
    });

    it('should generate different vessels from catalog', () => {
      const vessel1 = service.generateVessel();
      const vessel2 = service.generateVessel();

      // They might have different names (unless we're unlucky with shuffling)
      // But they should definitely have different IDs
      expect(vessel1.id).not.toBe(vessel2.id);
    });
  });
});
