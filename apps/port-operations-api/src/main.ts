import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { RabbitMQConsumer } from './services/rabbitmq-consumer.service';
import { StateManager } from './services/state-manager.service';
import { StreamUpdate } from './types';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow all origins for development
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// State management
const stateManager = new StateManager();
const rabbitMQConsumer = new RabbitMQConsumer();

// Store active SSE clients
const clients: Set<Response> = new Set();

// Broadcast update to all connected clients
function broadcast(update: StreamUpdate): void {
  if (clients.size > 0 && update.type === 'TUGBOAT_POSITION') {
    if (Math.random() < 0.1) {
      console.log(`📤 Broadcasting ${update.type} to ${clients.size} clients:`, JSON.stringify(update.data).substring(0, 200));
    }
  } else if (clients.size > 0 && update.type !== 'PORT_STATUS') {
    console.log(`📤 Broadcasting ${update.type} to ${clients.size} clients`);
  }
  const data = `data: ${JSON.stringify(update)}\n\n`;
  clients.forEach((client) => {
    try {
      client.write(data);
    } catch (error) {
      console.error('Error broadcasting to client:', error);
      clients.delete(client);
    }
  });
}

// Setup RabbitMQ event handlers
rabbitMQConsumer.on('tugboat-position', (tugboat: any) => {
  // Log every 10th message to avoid spam
  if (Math.random() < 0.1) {
    console.log(`📥 Received tugboat position:`, JSON.stringify(tugboat));
  }
  stateManager.updateTugboat(tugboat);
  broadcast({
    type: 'TUGBOAT_POSITION',
    timestamp: new Date(),
    data: tugboat,
  });
});

rabbitMQConsumer.on('vessel-position', (vessel: any) => {
  // Log every 10th message to avoid spam
  if (Math.random() < 0.1) {
    console.log(`📥 Received vessel position:`, JSON.stringify(vessel));
  }
  stateManager.updateVessel(vessel);
  broadcast({
    type: 'VESSEL_POSITION',
    timestamp: new Date(),
    data: vessel,
  });
});

rabbitMQConsumer.on('vessel-request', (vessel: any) => {
  const vesselData = {
    vesselId: vessel.vesselId,
    vesselName: vessel.vesselName,
    vesselType: vessel.vesselType,
    position: vessel.position,
    status: vessel.status || 'REQUESTING_ASSISTANCE',
  };
  stateManager.updateVessel(vesselData);
  broadcast({
    type: 'VESSEL_REQUEST',
    timestamp: new Date(),
    data: vesselData,
  });
});

rabbitMQConsumer.on('vessel-docked', (event: any) => {
  const vessel = stateManager.getVessel(event.vesselId);
  if (vessel) {
    vessel.status = 'DOCKED';
    if (event.position) {
      vessel.position = event.position;
    }
    stateManager.updateVessel(vessel);
  }
  
  broadcast({
    type: 'VESSEL_DOCKED',
    timestamp: new Date(),
    data: event,
  });
});

rabbitMQConsumer.on('vessel-departed', (event: any) => {
  stateManager.removeVessel(event.vesselId);
  
  broadcast({
    type: 'VESSEL_DEPARTED',
    timestamp: new Date(),
    data: event,
  });
});

rabbitMQConsumer.on('port-status', (status: any) => {
  broadcast({
    type: 'PORT_STATUS',
    timestamp: new Date(),
    data: status,
  });
});

rabbitMQConsumer.on('assignment', (assignment: any) => {
  const vessel = stateManager.getVessel(assignment.vesselId);
  if (vessel) {
    vessel.status = 'WAITING_FOR_TUGBOAT';
    vessel.assignedTugboatId = assignment.tugboatId;
    vessel.estimatedArrivalTime = assignment.estimatedArrivalTime;
    stateManager.updateVessel(vessel);
  }
  
  broadcast({
    type: 'ASSIGNMENT',
    timestamp: new Date(),
    data: assignment,
  });
});

rabbitMQConsumer.on('tugboat-arrived', (event: any) => {
  const vessel = stateManager.getVessel(event.vesselId);
  if (vessel) {
    vessel.status = 'BEING_TOWED_TO_DOCK';
    stateManager.updateVessel(vessel);
  }
  
  broadcast({
    type: 'TUGBOAT_ARRIVED',
    timestamp: new Date(),
    data: event,
  });
});

rabbitMQConsumer.on('assistance-complete', (event: any) => {
  stateManager.removeVessel(event.vesselId);
  
  broadcast({
    type: 'ASSISTANCE_COMPLETE',
    timestamp: new Date(),
    data: event,
  });
});

// Routes

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date(),
    connectedClients: clients.size,
  });
});

// Get current state snapshot
app.get('/api/state', (req: Request, res: Response) => {
  res.json(stateManager.getSnapshot());
});

// Get all tugboats
app.get('/api/tugboats', (req: Request, res: Response) => {
  res.json(stateManager.getTugboats());
});

// Get all vessels
app.get('/api/vessels', (req: Request, res: Response) => {
  res.json(stateManager.getVessels());
});

// Server-Sent Events stream
app.get('/api/stream', (req: Request, res: Response) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Add client to the set
  clients.add(res);
  console.log(`📡 New client connected. Total clients: ${clients.size}`);

  // Send initial snapshot
  const snapshot = stateManager.getSnapshot();
  const initialData: StreamUpdate = {
    type: 'SNAPSHOT',
    timestamp: new Date(),
    data: snapshot,
  };
  res.write(`data: ${JSON.stringify(initialData)}\n\n`);

  // Send heartbeat every 30 seconds
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(`:heartbeat\n\n`);
    } catch (error) {
      clearInterval(heartbeatInterval);
    }
  }, 30000);

  // Remove client on disconnect
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    clients.delete(res);
    console.log(`📡 Client disconnected. Total clients: ${clients.size}`);
  });
});

// Start server
async function startServer() {
  try {
    // Connect to RabbitMQ
    await rabbitMQConsumer.connect(RABBITMQ_URL);

    // Start HTTP server on all interfaces
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Port Operations API running on http://0.0.0.0:${PORT}`);
      console.log(`📡 Stream endpoint: http://0.0.0.0:${PORT}/api/stream`);
      console.log(`📊 State endpoint: http://0.0.0.0:${PORT}/api/state`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  clients.forEach((client) => {
    try {
      client.end();
    } catch (error) {
      // Ignore errors during shutdown
    }
  });
  clients.clear();
  await rabbitMQConsumer.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  clients.forEach((client) => {
    try {
      client.end();
    } catch (error) {
      // Ignore errors during shutdown
    }
  });
  clients.clear();
  await rabbitMQConsumer.close();
  process.exit(0);
});

startServer();
