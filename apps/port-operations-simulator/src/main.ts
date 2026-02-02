import { RabbitMQService } from './services/rabbitmq.service';
import { TugboatSimulator } from './services/tugboat.simulator';
import { VesselService } from './services/vessel.service';
import { AssignmentService } from './services/assignment.service';
import { TugboatStatus } from './models/tugboat.model';
import { VesselStatus, AssignmentEvent } from './models/vessel.model';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const SIMULATION_INTERVAL = parseInt(
  process.env.SIMULATION_INTERVAL || '5000',
  10
);
const VESSEL_SPAWN_INTERVAL = parseInt(
  process.env.VESSEL_SPAWN_INTERVAL || '15000',
  10
);
const ASSISTANCE_DURATION = parseInt(
  process.env.ASSISTANCE_DURATION || '10000',
  10
);

async function main() {
  console.log('🚢 Port Operations Simulator Starting...');
  console.log(`📡 RabbitMQ URL: ${RABBITMQ_URL}`);
  console.log(`⏱️  Simulation Interval: ${SIMULATION_INTERVAL}ms`);
  console.log(`🚢 Vessel Spawn Interval: ${VESSEL_SPAWN_INTERVAL}ms`);

  const rabbitMQ = new RabbitMQService();
  const tugboatSimulator = new TugboatSimulator();
  const vesselService = new VesselService();
  const assignmentService = new AssignmentService();

  try {
    await rabbitMQ.connect(RABBITMQ_URL);

    console.log('\n📊 Initial Tugboat Status:');
    tugboatSimulator.getTugboats().forEach((tugboat) => {
      console.log(
        `  - ${tugboat.name} (${tugboat.id}): ${tugboat.status} at (${tugboat.position.x}, ${tugboat.position.y})`
      );
    });

    console.log('\n🎮 Starting simulation...\n');

    // Spawn vessels periodically
    const vesselSpawnInterval = setInterval(() => {
      const vessel = vesselService.generateVessel();
      rabbitMQ.publishMovement({
        type: 'VESSEL_REQUEST',
        vesselId: vessel.id,
        vesselName: vessel.name,
        vesselType: vessel.type,
        position: vessel.position,
        timestamp: new Date(),
      }).catch((error) => {
        console.error('Failed to publish vessel request:', error);
      });
    }, VESSEL_SPAWN_INTERVAL);

    // Main simulation loop
    const simulationInterval = setInterval(() => {
      // Check for vessels requesting assistance and assign tugboats
      const requestingVessels = vesselService.getVesselsRequestingAssistance();
      requestingVessels.forEach((vessel) => {
        const tugboat = assignmentService.findBestAvailableTugboat(
          tugboatSimulator.getTugboats(),
          vessel
        );

        if (tugboat) {
          const event = assignmentService.assignTugboatToVessel(
            tugboat,
            vessel
          );
          if (event) {
            // Update states
            tugboatSimulator.updateTugboat(tugboat.id, {
              status: TugboatStatus.MOVING,
            });
            tugboatSimulator.assignTugboatToVessel(tugboat.id, vessel.id);
            vesselService.updateVessel(vessel.id, {
              status: VesselStatus.WAITING_FOR_TUGBOAT,
              assignedTugboatId: tugboat.id,
              estimatedArrivalTime: event.estimatedArrivalTime,
            });

            rabbitMQ.publishMovement(event).catch((error) => {
              console.error('Failed to publish assignment event:', error);
            });
          }
        }
      });

      // Move tugboats towards their assigned vessels
      const waitingVessels = vesselService.getVesselsWaitingForTugboat();
      waitingVessels.forEach((vessel) => {
        if (!vessel.assignedTugboatId) return;

        const tugboat = tugboatSimulator.getTugboat(vessel.assignedTugboatId);
        if (!tugboat) return;

        const arrived = assignmentService.moveTugboatTowardsVessel(
          tugboat,
          vessel,
          SIMULATION_INTERVAL
        );

        if (arrived) {
          console.log(
            `✅ ${tugboat.name} arrived at ${vessel.name} - Starting assistance`
          );

          tugboatSimulator.updateTugboat(tugboat.id, {
            status: TugboatStatus.ASSISTING,
          });
          vesselService.updateVessel(vessel.id, {
            status: VesselStatus.BEING_ASSISTED,
          });

          const arrivalEvent: AssignmentEvent = {
            vesselId: vessel.id,
            vesselName: vessel.name,
            tugboatId: tugboat.id,
            tugboatName: tugboat.name,
            timestamp: new Date(),
            eventType: 'TUGBOAT_ARRIVED',
          };

          rabbitMQ.publishMovement(arrivalEvent).catch((error) => {
            console.error('Failed to publish arrival event:', error);
          });

          // Schedule assistance completion
          setTimeout(() => {
            console.log(
              `✅ ${tugboat.name} completed assistance of ${vessel.name}`
            );

            tugboatSimulator.updateTugboat(tugboat.id, {
              status: TugboatStatus.IDLE,
            });
            tugboatSimulator.unassignTugboat(tugboat.id);
            vesselService.updateVessel(vessel.id, {
              status: VesselStatus.COMPLETED,
            });

            const completionEvent: AssignmentEvent = {
              vesselId: vessel.id,
              vesselName: vessel.name,
              tugboatId: tugboat.id,
              tugboatName: tugboat.name,
              timestamp: new Date(),
              eventType: 'ASSISTANCE_COMPLETE',
            };

            rabbitMQ.publishMovement(completionEvent).catch((error) => {
              console.error('Failed to publish completion event:', error);
            });

            // Remove completed vessel after a delay
            setTimeout(() => {
              vesselService.removeVessel(vessel.id);
            }, 2000);
          }, ASSISTANCE_DURATION);
        }
      });

      // Publish real-time position updates for all tugboats
      tugboatSimulator.getTugboats().forEach((tugboat) => {
        const assignment = tugboatSimulator.getAssignment(tugboat.id);
        const movementEvent = tugboatSimulator.createMovementEvent(
          tugboat,
          assignment?.vesselId
        );
        
        rabbitMQ.publishMovement({
          type: 'TUGBOAT_POSITION',
          ...movementEvent,
        }).catch((error) => {
          console.error('Failed to publish tugboat position:', error);
        });
      });
    }, SIMULATION_INTERVAL);

    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down gracefully...');
      clearInterval(vesselSpawnInterval);
      clearInterval(simulationInterval);
      await rabbitMQ.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down gracefully...');
      clearInterval(vesselSpawnInterval);
      clearInterval(simulationInterval);
      await rabbitMQ.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
