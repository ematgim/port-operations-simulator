import { RabbitMQService } from './services/rabbitmq.service';
import { TugboatSimulator } from './services/tugboat.simulator';
import { VesselService } from './services/vessel.service';
import { AssignmentService } from './services/assignment.service';
import { PortService } from './services/port.service';
import { TugboatStatus } from './models/tugboat.model';
import { VesselStatus } from './models/vessel.model';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const PUBLISH_EVENTS = process.env.PUBLISH_EVENTS === 'true';
const SIMULATION_INTERVAL = parseInt(
  process.env.SIMULATION_INTERVAL || '100',
  10
);
const VESSEL_SPAWN_INTERVAL = parseInt(
  process.env.VESSEL_SPAWN_INTERVAL || '30000',
  10
);
const DOCK_DURATION = parseInt(
  process.env.DOCK_DURATION || '60000',
  10
);
const POSITION_PUBLISH_INTERVAL = parseInt(
  process.env.POSITION_PUBLISH_INTERVAL || '1000',
  10
);

async function main() {
  console.log('🚢 Port Operations Simulator Starting...');
  console.log(`📡 RabbitMQ URL: ${RABBITMQ_URL}`);
  console.log(`📢 Publish Events: ${PUBLISH_EVENTS}`);
  console.log(`⏱️  Simulation Interval: ${SIMULATION_INTERVAL}ms`);
  console.log(`🚢 Vessel Spawn Interval: ${VESSEL_SPAWN_INTERVAL}ms`);
  console.log(`⏱️  Dock Duration: ${DOCK_DURATION}ms`);
  console.log(`📍 Position Publish Interval: ${POSITION_PUBLISH_INTERVAL}ms`);

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

    // Spawn vessels periodically at entry point
    const vesselSpawnInterval = setInterval(() => {
      // Limit: maximum docks + 2 vessels in port
      const maxVesselsInPort = portService.getAllDocks().length + 2;
      const vesselsInPort = vesselService.getVesselsInPort().length;
      
      if (vesselsInPort >= maxVesselsInPort) {
        return;
      }
      
      const vessel = vesselService.generateVessel();
      // rabbitMQ.publishMovement({
      //   type: 'VESSEL_ARRIVED',
      //   vesselId: vessel.id,
      //   vesselName: vessel.name,
      //   vesselType: vessel.type,
      //   position: vessel.position,
      //   status: vessel.status,
      //   timestamp: new Date(),
      // }).catch((error) => {
      //   console.error('Failed to publish vessel arrival:', error);
      // });

      console.log(`\n🚢 ${vessel.name} arrived at entry point (${Math.round(vessel.position.x)}, ${Math.round(vessel.position.y)})`);
    }, VESSEL_SPAWN_INTERVAL);

    // Main simulation loop
    let lastVesselPositionPublishTime = 0;
    const simulationInterval = setInterval(async () => {
      // Get all tugboats and vessels
      const tugboats = tugboatSimulator.getTugboats();
      const vessels = vesselService.getAllVessels();

      // PRIORITY 1: Handle vessels ready to depart (SALIDA tiene prioridad)
      const vesselsReadyToDepart = vessels.filter(
        (v) =>
          v.status === VesselStatus.DOCKED &&
          v.dockedAt &&
          Date.now() - v.dockedAt.getTime() >= DOCK_DURATION &&
          !v.assignedTugboatId
      );

      // Assign tugboats to departing vessels first
      for (const vessel of vesselsReadyToDepart) {
        const availableTugboat = tugboats.find((t) => t.status === TugboatStatus.IDLE);

        if (availableTugboat) {
          // Assign tugboat to tow vessel to exit
          vessel.assignedTugboatId = availableTugboat.id;
          availableTugboat.status = TugboatStatus.MOVING;

          tugboatSimulator.assignTugboatToVessel(availableTugboat.id, vessel.id);

          const exitPoint = portService.getExitPoint();
          console.log(
            `\n🎯 PRIORITY DEPARTURE: ${availableTugboat.name} assigned to tow ${vessel.name}`
          );
          console.log(
            `   Destination: ${exitPoint.name} at (${exitPoint.position.x}, ${exitPoint.position.y})`
          );
          console.log(
            `   Tugboat at (${Math.round(availableTugboat.position.x)}, ${Math.round(availableTugboat.position.y)})`
          );
          console.log(
            `   Vessel at (${Math.round(vessel.position.x)}, ${Math.round(vessel.position.y)})`
          );
        }
      }

      // Process each vessel based on its status
      for (const vessel of vessels) {
        
        // CASE 1: Vessel at entry, assign tugboat to tow to dock
        if (vessel.status === VesselStatus.AT_ENTRY && !vessel.assignedTugboatId) {
          const availableTugboat = tugboats.find(t => t.status === TugboatStatus.IDLE);
          const availableDock = portService.findClosestAvailableDock(vessel.position);
          
          if (availableTugboat && availableDock) {
            // Assign tugboat to vessel
            vessel.assignedTugboatId = availableTugboat.id;
            vessel.assignedDockId = availableDock.id;
            availableTugboat.status = TugboatStatus.MOVING;
            
            tugboatSimulator.assignTugboatToVessel(availableTugboat.id, vessel.id);
            portService.assignVesselToDock(vessel.id, availableDock.id);
            
            console.log(`\n🎯 ASSIGNMENT: ${availableTugboat.name} assigned to tow ${vessel.name} to ${availableDock.name}`);
            console.log(`   Tugboat at (${Math.round(availableTugboat.position.x)}, ${Math.round(availableTugboat.position.y)})`);
            console.log(`   Vessel at (${Math.round(vessel.position.x)}, ${Math.round(vessel.position.y)})`);
            console.log(`   Dock at (${availableDock.position.x}, ${availableDock.position.y})`);
            
            if (PUBLISH_EVENTS) {
              await rabbitMQ.publishMovement({
                type: 'ASSIGNMENT',
                vesselId: vessel.id,
                vesselName: vessel.name,
                vesselImo: vessel.imo,
                tugboatId: availableTugboat.id,
                tugboatName: availableTugboat.name,
                timestamp: new Date(),
                eventType: 'ASSIGNMENT',
                destinationType: 'DOCK',
                destination: availableDock.name,
              });
            }
          }
        }
        
        // CASE 2: Tugboat moving to vessel at entry
        if (vessel.status === VesselStatus.AT_ENTRY && vessel.assignedTugboatId) {
          const tugboat = tugboatSimulator.getTugboat(vessel.assignedTugboatId);
          
          if (tugboat && tugboat.status === TugboatStatus.MOVING) {
            // Move tugboat towards vessel
            const distanceBefore = assignmentService.calculateDistance(tugboat.position, vessel.position);
            const arrived = assignmentService.moveTugboatTowardsVessel(
              tugboat,
              vessel,
              SIMULATION_INTERVAL
            );
            
            if (!arrived && Math.random() < 0.05) { // Log 5% of the time to avoid spam
              console.log(`   🚤 ${tugboat.name} moving to vessel... Distance: ${Math.round(distanceBefore)} -> Pos: (${Math.round(tugboat.position.x)}, ${Math.round(tugboat.position.y)})`);
            }
            
            if (arrived) {
              // Tugboat reached vessel, start towing to dock
              tugboat.status = TugboatStatus.ASSISTING;
              vessel.status = VesselStatus.BEING_TOWED_TO_DOCK;
              
              console.log(`\n✅ TUGBOAT ARRIVED: ${tugboat.name} reached ${vessel.name}`);
              console.log(`   Starting tow to dock ${vessel.assignedDockId}`);
              console.log(`   Position: (${Math.round(tugboat.position.x)}, ${Math.round(tugboat.position.y)})`);
              
              if (PUBLISH_EVENTS) {
                await rabbitMQ.publishMovement({
                  type: 'TUGBOAT_ARRIVED',
                  vesselId: vessel.id,
                  vesselName: vessel.name,                  vesselImo: vessel.imo,                  tugboatId: tugboat.id,
                  tugboatName: tugboat.name,
                  timestamp: new Date(),
                  eventType: 'TUGBOAT_ARRIVED',
                });
              }
            }
          }
        }
        
        // CASE 3: Towing vessel to dock
        if (vessel.status === VesselStatus.BEING_TOWED_TO_DOCK && vessel.assignedDockId) {
          const tugboat = tugboatSimulator.getTugboat(vessel.assignedTugboatId!);
          const dock = portService.getDock(vessel.assignedDockId);
          
          if (tugboat && dock) {
            // Move both tugboat and vessel towards dock
            const distanceBefore = assignmentService.calculateDistance(tugboat.position, dock.position);
            const arrived = assignmentService.moveTugboatTowardsVessel(
              tugboat,
              { position: dock.position } as any,
              SIMULATION_INTERVAL
            );
            
            // Update vessel position to follow tugboat
            vessel.position = { ...tugboat.position };
            
            if (!arrived && Math.random() < 0.05) { // Log 5% of the time
              console.log(`   🚢➡️🏗️  Towing ${vessel.name} to dock... Distance: ${Math.round(distanceBefore)} -> Pos: (${Math.round(vessel.position.x)}, ${Math.round(vessel.position.y)})`);
            }
            
            if (arrived) {
              // Vessel reached dock
              vessel.status = VesselStatus.DOCKED;
              vessel.position = { ...dock.position };
              vessel.dockedAt = new Date();
              
              // Release tugboat
              tugboat.status = TugboatStatus.IDLE;
              tugboatSimulator.unassignTugboat(tugboat.id);
              vessel.assignedTugboatId = undefined;
              
              console.log(`\n⚓ VESSEL DOCKED: ${vessel.name} docked at ${dock.name}`);
              console.log(`   Position: (${vessel.position.x}, ${vessel.position.y})`);
              console.log(`   ${tugboat.name} released and now IDLE`);
              console.log(`   Will stay for ${DOCK_DURATION / 1000} seconds`);
              
              if (PUBLISH_EVENTS) {
                await rabbitMQ.publishMovement({
                  type: 'VESSEL_DOCKED',
                  vesselId: vessel.id,
                  vesselName: vessel.name,
                  vesselImo: vessel.imo,
                  tugboatId: tugboat.id,
                  tugboatName: tugboat.name,
                  timestamp: new Date(),
                  eventType: 'DOCKED',
                  position: vessel.position,
                  dockName: dock.name,
                });
              }
              
              // Schedule departure
              setTimeout(() => {
                if (vessel.status === VesselStatus.DOCKED) {
                  console.log(`\n🕒 READY TO DEPART: ${vessel.name} ready to leave ${dock.name}`);
                  console.log(`   Waiting for tugboat assignment...`);
                  // Vessel will be picked up in next simulation cycle (priority queue)
                }
              }, DOCK_DURATION);
            }
          }
        }
        
        // NOTE: CASE 4 removed - departure assignment now handled by priority queue at the beginning
        
        // CASE 5: Tugboat moving to docked vessel for departure
        if (vessel.status === VesselStatus.DOCKED && vessel.assignedTugboatId) {
          const tugboat = tugboatSimulator.getTugboat(vessel.assignedTugboatId);
          
          if (tugboat && tugboat.status === TugboatStatus.MOVING) {
            // Move tugboat towards vessel
            const distanceBefore = assignmentService.calculateDistance(tugboat.position, vessel.position);
            const arrived = assignmentService.moveTugboatTowardsVessel(
              tugboat,
              vessel,
              SIMULATION_INTERVAL
            );
            
            if (!arrived && Math.random() < 0.05) { // Log 5% of the time
              console.log(`   🚤 ${tugboat.name} moving to docked vessel... Distance: ${Math.round(distanceBefore)} -> (${Math.round(tugboat.position.x)}, ${Math.round(tugboat.position.y)})`);
            }
            
            if (arrived) {
              // Tugboat reached vessel, start towing to exit
              tugboat.status = TugboatStatus.ASSISTING;
              vessel.status = VesselStatus.BEING_TOWED_TO_EXIT;
              
              // Release dock
              if (vessel.assignedDockId) {
                portService.releaseVesselFromDock(vessel.id);
                vessel.assignedDockId = undefined;
              }
              
              console.log(`\n✅ TUGBOAT ARRIVED AT DOCK: ${tugboat.name} reached ${vessel.name}`);
              console.log(`   Starting tow to exit`);
              console.log(`   Position: (${Math.round(tugboat.position.x)}, ${Math.round(tugboat.position.y)})`);
              
              if (PUBLISH_EVENTS) {
                await rabbitMQ.publishMovement({
                  type: 'TUGBOAT_ARRIVED',
                  vesselId: vessel.id,
                  vesselName: vessel.name,
                  vesselImo: vessel.imo,
                  tugboatId: tugboat.id,
                  tugboatName: tugboat.name,
                  timestamp: new Date(),
                  eventType: 'TUGBOAT_ARRIVED',
                });
              }
            }
          }
        }
        
        // CASE 6: Towing vessel to exit
        if (vessel.status === VesselStatus.BEING_TOWED_TO_EXIT) {
          const tugboat = tugboatSimulator.getTugboat(vessel.assignedTugboatId!);
          const exitPoint = portService.getExitPoint();
          
          if (tugboat && exitPoint) {
            // Move both tugboat and vessel towards exit
            const distanceBefore = assignmentService.calculateDistance(tugboat.position, exitPoint.position);
            const arrived = assignmentService.moveTugboatTowardsVessel(
              tugboat,
              { position: exitPoint.position } as any,
              SIMULATION_INTERVAL
            );
            
            // Update vessel position to follow tugboat
            vessel.position = { ...tugboat.position };
            
            if (!arrived && Math.random() < 0.05) { // Log 5% of the time
              console.log(`   🚢➡️🌊 Towing ${vessel.name} to exit... Distance: ${Math.round(distanceBefore)} -> Pos: (${Math.round(vessel.position.x)}, ${Math.round(vessel.position.y)})`);
            }
            
            if (arrived) {
              // Vessel reached exit
              vessel.status = VesselStatus.DEPARTED;
              vessel.position = { ...exitPoint.position };
              vessel.departureTime = new Date();
              
              console.log(`\n🌊 VESSEL DEPARTED: ${vessel.name} departed via ${exitPoint.name}`);
              console.log(`   Exit position: (${exitPoint.position.x}, ${exitPoint.position.y})`);
              console.log(`   ${tugboat.name} released and now IDLE`);
              
              if (PUBLISH_EVENTS) {
                await rabbitMQ.publishMovement({
                  type: 'VESSEL_DEPARTED',
                  vesselId: vessel.id,
                  vesselName: vessel.name,
                  vesselImo: vessel.imo,
                  tugboatId: tugboat.id,
                  tugboatName: tugboat.name,
                  timestamp: new Date(),
                  eventType: 'ASSISTANCE_COMPLETE',
                  exitPoint: exitPoint.name,
                });
              }
              
              // Release tugboat
              tugboat.status = TugboatStatus.IDLE;
              tugboatSimulator.unassignTugboat(tugboat.id);
              
              // Remove vessel after a short delay
              setTimeout(() => {
                vesselService.removeVessel(vessel.id);
                console.log(`🗑️  ${vessel.name} removed from simulation`);
              }, 5000);
            }
          }
        }
      }

      // CASE 7: Move idle tugboats to base (only if not assigned to any vessel)
      for (const tugboat of tugboats) {
        if (tugboat.status === TugboatStatus.IDLE) {
          // Check if tugboat is assigned to any vessel
          const assignment = tugboatSimulator.getAssignment(tugboat.id);
          
          // Only move to base if not assigned
          if (!assignment) {
            const tugboatBase = portService.getTugboatBase();
            const distanceToBase = assignmentService.calculateDistance(tugboat.position, tugboatBase.position);
            
            // Only move if not already at base (distance > 5 units)
            if (distanceToBase > 5) {
              assignmentService.moveTugboatTowardsVessel(
                tugboat,
                { position: tugboatBase.position } as any,
                SIMULATION_INTERVAL
              );
              
              // Log occasionally to avoid spam
              if (Math.random() < 0.02) {
                console.log(`   🏠 ${tugboat.name} returning to base... Distance: ${Math.round(distanceToBase)}`);
              }
            }
          }
        }
      }

      // Publish vessel and tugboat positions every 1 second
      if (PUBLISH_EVENTS) {
        const now = Date.now();
        if (now - lastVesselPositionPublishTime >= POSITION_PUBLISH_INTERVAL) {
          lastVesselPositionPublishTime = now;
          for (const vessel of vessels) {
            await rabbitMQ.publishMovement({
              type: 'VESSEL_POSITION',
              vesselId: vessel.id,
              vesselName: vessel.name,
              vesselImo: vessel.imo,
              vesselType: vessel.type,
              position: { ...vessel.position },
              status: vessel.status,
              assignedDockId: vessel.assignedDockId,
              timestamp: new Date(),
            });
          }
          for (const tugboat of tugboats) {
            const assignment = tugboatSimulator.getAssignment(tugboat.id);
            const movementEvent = tugboatSimulator.createMovementEvent(
              tugboat,
              assignment?.vesselId
            );

            await rabbitMQ.publishMovement({
              type: 'TUGBOAT_POSITION',
              ...movementEvent,
            });
          }
        }
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
