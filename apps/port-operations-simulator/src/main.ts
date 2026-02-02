import { RabbitMQService } from './services/rabbitmq.service';
import { TugboatSimulator } from './services/tugboat.simulator';
import { VesselService } from './services/vessel.service';
import { AssignmentService } from './services/assignment.service';
import { PortService } from './services/port.service';
import { TugboatStatus } from './models/tugboat.model';
import { VesselStatus, AssignmentEvent } from './models/vessel.model';
import { LocationType } from './models/port.model';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const SIMULATION_INTERVAL = parseInt(
  process.env.SIMULATION_INTERVAL || '1000',
  10
);
const VESSEL_SPAWN_INTERVAL = parseInt(
  process.env.VESSEL_SPAWN_INTERVAL || '20000',
  10
);
const POSITION_UPDATE_INTERVAL = parseInt(
  process.env.POSITION_UPDATE_INTERVAL || '3000',
  10
);
const TOWING_TO_DOCK_DURATION = parseInt(
  process.env.TOWING_TO_DOCK_DURATION || '10000',
  10
);
const TOWING_TO_EXIT_DURATION = parseInt(
  process.env.TOWING_TO_EXIT_DURATION || '8000',
  10
);

async function main() {
  console.log('🚢 Port Operations Simulator Starting...');
  console.log(`📡 RabbitMQ URL: ${RABBITMQ_URL}`);
  console.log(`⏱️  Simulation Interval: ${SIMULATION_INTERVAL}ms`);
  console.log(`🚢 Vessel Spawn Interval: ${VESSEL_SPAWN_INTERVAL}ms`);

  const rabbitMQ = new RabbitMQService();
  const portService = new PortService();
  const tugboatSimulator = new TugboatSimulator();
  const vesselService = new VesselService(portService);
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
    let lastPositionUpdateTime = 0;
    // Spawn vessels periodically at entry point
    const vesselSpawnInterval = setInterval(() => {
      // Limit to max 6 vessels
      if (vesselService.getAllVessels().length >= 6) {
        return;
      }
      
      const vessel = vesselService.generateVessel();
      rabbitMQ.publishMovement({
        type: 'VESSEL_ARRIVED',
        vesselId: vessel.id,
        vesselName: vessel.name,
        vesselType: vessel.type,
        position: vessel.position,
        status: vessel.status,
        timestamp: new Date(),
      }).catch((error) => {
        console.error('Failed to publish vessel arrival:', error);
      });

      // Automatically request assistance after arrival
      setTimeout(() => {
        vesselService.updateVessel(vessel.id, {
          status: VesselStatus.REQUESTING_ASSISTANCE,
        });
      }, 2000);
    }, VESSEL_SPAWN_INTERVAL);

    // Main simulation loop
    const simulationInterval = setInterval(() => {
      // 1. Assign tugboats to vessels requesting assistance (to tow to dock)
      const requestingVessels = vesselService.getVesselsRequestingAssistance()
        .filter(v => !v.assignedTugboatId); // Only assign if not already assigned
      requestingVessels.forEach((vessel) => {
        const availableDock = portService.findClosestAvailableDock(vessel.position);
        
        if (!availableDock) {
          console.log(`⏳ No docks available for ${vessel.name}, waiting...`);
          return;
        }

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
            // Assign dock to vessel
            portService.assignVesselToDock(vessel.id, availableDock.id);

            // Update states - IMPORTANT: Update vessel status FIRST to avoid reassignment
            vesselService.updateVessel(vessel.id, {
              status: VesselStatus.WAITING_FOR_TUGBOAT,
              assignedTugboatId: tugboat.id,
              assignedDockId: availableDock.id,
              estimatedArrivalTime: event.estimatedArrivalTime,
            });

            // Then update tugboat status
            tugboatSimulator.updateTugboat(tugboat.id, {
              status: TugboatStatus.MOVING,
            });
            tugboatSimulator.assignTugboatToVessel(tugboat.id, vessel.id);

            console.log(`🎯 ${vessel.name} will be towed to ${availableDock.name}`);

            rabbitMQ.publishMovement({
              type: 'ASSIGNMENT',
              ...event,
              destinationType: 'DOCK',
              destination: availableDock.name,
            }).catch((error) => {
              console.error('Failed to publish assignment event:', error);
            });
          }
        }
      });

      // 2. Move tugboats towards vessels (to start towing to dock)
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
            `✅ ${tugboat.name} arrived at ${vessel.name} - Starting towing to dock`
          );

          tugboatSimulator.updateTugboat(tugboat.id, {
            status: TugboatStatus.ASSISTING,
          });
          vesselService.updateVessel(vessel.id, {
            status: VesselStatus.BEING_TOWED_TO_DOCK,
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
        }
      });

      // 3. Move vessels towards docks when being towed
      const vesselBeingTowedToDock = vesselService.getAllVessels().filter(
        v => v.status === VesselStatus.BEING_TOWED_TO_DOCK && v.assignedDockId
      );
      
      vesselBeingTowedToDock.forEach((vessel) => {
        if (!vessel.assignedDockId || !vessel.assignedTugboatId) return;
        
        const dock = portService.getDock(vessel.assignedDockId);
        const tugboat = tugboatSimulator.getTugboat(vessel.assignedTugboatId);
        
        if (!dock || !tugboat) return;
        
        // Move vessel towards dock
        const arrived = assignmentService.moveTugboatTowardsVessel(
          vessel as any,
          { position: dock.position } as any,
          SIMULATION_INTERVAL
        );
        
        if (arrived) {
          console.log(
            `⚓ ${vessel.name} has been docked at ${dock.name} by ${tugboat.name}`
          );

          // Update vessel position to dock position
          vesselService.updateVessel(vessel.id, {
            position: { ...dock.position },
            status: VesselStatus.DOCKED,
            dockedAt: new Date(),
          });

          // Release tugboat
          tugboatSimulator.updateTugboat(tugboat.id, {
            status: TugboatStatus.IDLE,
          });
          tugboatSimulator.unassignTugboat(tugboat.id);

          const dockingEvent: AssignmentEvent = {
            vesselId: vessel.id,
            vesselName: vessel.name,
            tugboatId: tugboat.id,
            tugboatName: tugboat.name,
            timestamp: new Date(),
            eventType: 'DOCKED',
          };

          rabbitMQ.publishMovement({
            type: 'VESSEL_DOCKED',
            ...dockingEvent,
            position: { ...dock.position },
            dockName: dock.name,
          }).catch((error) => {
            console.error('Failed to publish docking event:', error);
          });
        }
      });

      // 4. Check for vessels ready to depart and assign tugboats
      const vesselsReadyToDepart = portService.getVesselsReadyToDepart();
      vesselsReadyToDepart.forEach((vesselId) => {
        const vessel = vesselService.getVessel(vesselId);
        if (!vessel || vessel.status !== VesselStatus.DOCKED) return;

        // Update vessel status to waiting for departure
        vesselService.updateVessel(vesselId, {
          status: VesselStatus.WAITING_FOR_DEPARTURE,
        });

        console.log(`🚢 ${vessel.name} is ready to depart`);
      });

      // 5. Assign tugboats to vessels waiting for departure
      const departingVessels = vesselService.getVesselsWaitingForDeparture().filter(
        v => !v.assignedTugboatId
      );
      
      departingVessels.forEach((vessel) => {
        const tugboat = assignmentService.findBestAvailableTugboat(
          tugboatSimulator.getTugboats(),
          vessel
        );

        if (tugboat) {
          const exitPoint = portService.getExitPoint();
          const event = assignmentService.assignTugboatToVessel(
            tugboat,
            vessel
          );

          if (event) {
            // Update vessel status FIRST to avoid reassignment
            vesselService.updateVessel(vessel.id, {
              assignedTugboatId: tugboat.id,
              estimatedArrivalTime: event.estimatedArrivalTime,
            });

            // Then update tugboat status
            tugboatSimulator.updateTugboat(tugboat.id, {
              status: TugboatStatus.MOVING,
            });
            tugboatSimulator.assignTugboatToVessel(tugboat.id, vessel.id);

            console.log(`🎯 ${tugboat.name} assigned to tow ${vessel.name} to exit`);

            rabbitMQ.publishMovement({
              type: 'ASSIGNMENT',
              ...event,
              destinationType: 'EXIT',
              destination: exitPoint.name,
            }).catch((error) => {
              console.error('Failed to publish departure assignment:', error);
            });
          }
        }
      });

      // 6. Move tugboats towards vessels waiting for departure
      const vesselsWaitingDepartureTugboat = vesselService
        .getVesselsWaitingForDeparture()
        .filter(v => v.assignedTugboatId);

      vesselsWaitingDepartureTugboat.forEach((vessel) => {
        if (!vessel.assignedTugboatId) return;

        const tugboat = tugboatSimulator.getTugboat(vessel.assignedTugboatId);
        if (!tugboat) return;

        // Only move if tugboat is not already assisting
        if (tugboat.status === TugboatStatus.MOVING) {
          const arrived = assignmentService.moveTugboatTowardsVessel(
            tugboat,
            vessel,
            SIMULATION_INTERVAL
          );

          if (arrived) {
            console.log(
              `✅ ${tugboat.name} arrived at ${vessel.name} - Starting towing to exit`
            );

            tugboatSimulator.updateTugboat(tugboat.id, {
              status: TugboatStatus.ASSISTING,
            });
            vesselService.updateVessel(vessel.id, {
              status: VesselStatus.BEING_TOWED_TO_EXIT,
            });

            // Release vessel from dock
            if (vessel.assignedDockId) {
              portService.releaseVesselFromDock(vessel.id);
            }

            rabbitMQ.publishMovement({
              type: 'TUGBOAT_ARRIVED',
              vesselId: vessel.id,
              vesselName: vessel.name,
              tugboatId: tugboat.id,
              tugboatName: tugboat.name,
              timestamp: new Date(),
              eventType: 'TUGBOAT_ARRIVED',
            }).catch((error) => {
              console.error('Failed to publish arrival event:', error);
            });

            // Schedule towing to exit completion
            setTimeout(() => {
              const exitPoint = portService.getExitPoint();

              console.log(
                `🌊 ${vessel.name} has departed the port via ${exitPoint.name}`
              );

              // Update vessel position to exit position
              vesselService.updateVessel(vessel.id, {
                position: { ...exitPoint.position },
                status: VesselStatus.DEPARTED,
                departureTime: new Date(),
              });

              // Release tugboat
              tugboatSimulator.updateTugboat(tugboat.id, {
                status: TugboatStatus.IDLE,
              });
              tugboatSimulator.unassignTugboat(tugboat.id);

              rabbitMQ.publishMovement({
                type: 'VESSEL_DEPARTED',
                vesselId: vessel.id,
                vesselName: vessel.name,
                tugboatId: tugboat.id,
                tugboatName: tugboat.name,
                timestamp: new Date(),
                eventType: 'ASSISTANCE_COMPLETE',
                exitPoint: exitPoint.name,
              }).catch((error) => {
                console.error('Failed to publish departure event:', error);
              });

              // Remove departed vessel after a delay
              setTimeout(() => {
                vesselService.removeVessel(vessel.id);
              }, 5000);
            }, TOWING_TO_EXIT_DURATION);
          }
        }
      });

      // Publish real-time position updates for all tugboats (throttled)
      const now = Date.now();
      if (now - lastPositionUpdateTime >= POSITION_UPDATE_INTERVAL) {
        lastPositionUpdateTime = now;
        
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

        // Publish port status periodically
        const portStatus = portService.getPortStatus();
        rabbitMQ.publishMovement({
          type: 'PORT_STATUS',
          ...portStatus,
          timestamp: new Date(),
        }).catch((error) => {
          console.error('Failed to publish port status:', error);
        });
      }
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
