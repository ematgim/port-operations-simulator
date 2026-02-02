import { Tugboat, TugboatStatus, Position } from '../models/tugboat.model';
import { Vessel, VesselStatus, AssignmentEvent } from '../models/vessel.model';

export class AssignmentService {
  assignTugboatToVessel(
    tugboat: Tugboat,
    vessel: Vessel
  ): AssignmentEvent | null {
    if (tugboat.status !== TugboatStatus.IDLE) {
      return null;
    }

    const distance = this.calculateDistance(
      tugboat.position,
      vessel.position
    );
    const estimatedTime = this.calculateTravelTime(distance, tugboat.speed);
    const estimatedArrivalTime = new Date(Date.now() + estimatedTime);

    const event: AssignmentEvent = {
      vesselId: vessel.id,
      vesselName: vessel.name,
      tugboatId: tugboat.id,
      tugboatName: tugboat.name,
      timestamp: new Date(),
      eventType: 'ASSIGNMENT',
      estimatedArrivalTime,
    };

    console.log(
      `🔗 Assigned ${tugboat.name} to ${vessel.name} - ETA: ${Math.round(estimatedTime / 1000)}s`
    );

    return event;
  }

  calculateDistance(pos1: Position, pos2: Position): number {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  calculateTravelTime(distance: number, speed: number): number {
    // Speed is in arbitrary units, convert to milliseconds
    // Assuming speed represents units per second
    return (distance / speed) * 1000;
  }

  moveTugboatTowardsVessel(
    tugboat: Tugboat,
    vessel: Vessel,
    deltaTime: number
  ): boolean {
    const distance = this.calculateDistance(
      tugboat.position,
      vessel.position
    );

    // Calculate how much the tugboat can move in this time step
    const moveDistance = (tugboat.speed * deltaTime) / 1000;

    if (distance <= moveDistance || distance < 5) {
      // Tugboat has arrived
      tugboat.position = { ...vessel.position };
      return true;
    }

    // Move towards vessel with smooth interpolation
    const ratio = moveDistance / distance;
    tugboat.position = {
      x: tugboat.position.x + (vessel.position.x - tugboat.position.x) * ratio,
      y: tugboat.position.y + (vessel.position.y - tugboat.position.y) * ratio,
    };

    return false;
  }

  findBestAvailableTugboat(
    tugboats: Tugboat[],
    vessel: Vessel
  ): Tugboat | null {
    const availableTugboats = tugboats.filter(
      (t) => t.status === TugboatStatus.IDLE
    );

    if (availableTugboats.length === 0) {
      return null;
    }

    // Find the closest tugboat
    let bestTugboat = availableTugboats[0];
    let minDistance = this.calculateDistance(
      bestTugboat.position,
      vessel.position
    );

    for (const tugboat of availableTugboats.slice(1)) {
      const distance = this.calculateDistance(tugboat.position, vessel.position);
      if (distance < minDistance) {
        minDistance = distance;
        bestTugboat = tugboat;
      }
    }

    return bestTugboat;
  }
}
