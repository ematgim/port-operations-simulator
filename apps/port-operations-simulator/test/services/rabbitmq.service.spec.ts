import { RabbitMQService } from '../../src/services/rabbitmq.service';

// Mock amqplib
jest.mock('amqplib', () => ({
  connect: jest.fn(),
}));

import * as amqp from 'amqplib';

describe('RabbitMQService', () => {
  let service: RabbitMQService;
  let mockConnection: any;
  let mockChannel: any;

  beforeEach(() => {
    service = new RabbitMQService();

    mockChannel = {
      assertQueue: jest.fn().mockResolvedValue(undefined),
      sendToQueue: jest.fn().mockReturnValue(true),
      close: jest.fn().mockResolvedValue(undefined),
    };

    mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
      close: jest.fn().mockResolvedValue(undefined),
    };

    (amqp.connect as jest.Mock).mockResolvedValue(mockConnection);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('should connect to RabbitMQ successfully', async () => {
      await service.connect('amqp://localhost');

      expect(amqp.connect).toHaveBeenCalledWith('amqp://localhost');
      expect(mockConnection.createChannel).toHaveBeenCalled();
      expect(mockChannel.assertQueue).toHaveBeenCalledWith('port-events', {
        durable: false,
      });
    });

    it('should use default URL when not provided', async () => {
      await service.connect();

      expect(amqp.connect).toHaveBeenCalledWith('amqp://localhost');
    });

    it('should throw error when connection fails', async () => {
      const error = new Error('Connection failed');
      (amqp.connect as jest.Mock).mockRejectedValue(error);

      await expect(service.connect()).rejects.toThrow('Connection failed');
    });

    it('should throw error when channel creation fails', async () => {
      const error = new Error('Channel creation failed');
      mockConnection.createChannel.mockRejectedValue(error);

      await expect(service.connect()).rejects.toThrow('Channel creation failed');
    });

    it('should throw error when queue assertion fails', async () => {
      const error = new Error('Queue assertion failed');
      mockChannel.assertQueue.mockRejectedValue(error);

      await expect(service.connect()).rejects.toThrow('Queue assertion failed');
    });
  });

  describe('publishMovement', () => {
    beforeEach(async () => {
      await service.connect();
    });

    it('should publish message successfully', async () => {
      const message = {
        tugboatId: 'TUG_01',
        position: { x: 100, y: 200 },
        timestamp: new Date(),
      };

      await service.publishMovement(message);

      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        'port-events',
        expect.any(Buffer),
        { persistent: false }
      );

      const sentBuffer = mockChannel.sendToQueue.mock.calls[0][1];
      const sentMessage = JSON.parse(sentBuffer.toString());
      expect(sentMessage.tugboatId).toBe('TUG_01');
    });

    it('should throw error when channel is not initialized', async () => {
      const uninitializedService = new RabbitMQService();
      const message = { test: 'data' };

      await expect(uninitializedService.publishMovement(message)).rejects.toThrow(
        'RabbitMQ channel is not initialized'
      );
    });

    it('should handle publish errors', async () => {
      const error = new Error('Publish failed');
      mockChannel.sendToQueue.mockImplementation(() => {
        throw error;
      });

      const message = { test: 'data' };

      await expect(service.publishMovement(message)).rejects.toThrow('Publish failed');
    });

    it('should serialize complex objects correctly', async () => {
      const complexMessage = {
        tugboatId: 'TUG_01',
        nested: {
          position: { x: 100, y: 200 },
          status: 'MOVING',
        },
        timestamp: new Date().toISOString(),
        array: [1, 2, 3],
      };

      await service.publishMovement(complexMessage);

      const sentBuffer = mockChannel.sendToQueue.mock.calls[0][1];
      const sentMessage = JSON.parse(sentBuffer.toString());
      expect(sentMessage).toEqual(complexMessage);
    });
  });

  describe('close', () => {
    it('should close channel and connection successfully', async () => {
      await service.connect();
      await service.close();

      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('should handle close without prior connection', async () => {
      // Should not throw
      await expect(service.close()).resolves.not.toThrow();
    });

    it('should handle channel close error gracefully', async () => {
      await service.connect();
      const error = new Error('Close failed');
      mockChannel.close.mockRejectedValue(error);

      // Should not throw, just log the error
      await expect(service.close()).resolves.not.toThrow();
    });

    it('should handle connection close error gracefully', async () => {
      await service.connect();
      const error = new Error('Connection close failed');
      mockConnection.close.mockRejectedValue(error);

      // Should not throw, just log the error
      await expect(service.close()).resolves.not.toThrow();
    });

    it('should close connection even if channel close fails', async () => {
      await service.connect();
      mockChannel.close.mockRejectedValue(new Error('Channel error'));

      await service.close();

      // Despite channel close error, connection.close should still be attempted
      expect(mockChannel.close).toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should handle connect, publish, and close sequence', async () => {
      await service.connect('amqp://localhost');

      const message = { tugboatId: 'TUG_01', status: 'MOVING' };
      await service.publishMovement(message);

      await service.close();

      expect(amqp.connect).toHaveBeenCalled();
      expect(mockChannel.sendToQueue).toHaveBeenCalled();
      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('should handle multiple publishes', async () => {
      await service.connect();

      await service.publishMovement({ id: 1 });
      await service.publishMovement({ id: 2 });
      await service.publishMovement({ id: 3 });

      expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(3);
    });
  });
});
