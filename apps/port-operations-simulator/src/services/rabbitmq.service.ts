import * as amqp from 'amqplib';

export class RabbitMQService {
  private connection: any = null;
  private channel: any = null;
  private readonly queueName = 'port-events';

  async connect(url: string = 'amqp://localhost'): Promise<void> {
    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(this.queueName, { durable: false });
      console.log(`✅ Connected to RabbitMQ at ${url}`);
      console.log(`✅ Queue '${this.queueName}' is ready`);
    } catch (error) {
      console.error('❌ Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async publishMovement(message: object): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not initialized');
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      this.channel.sendToQueue(this.queueName, messageBuffer, {
        persistent: false,
      });
    } catch (error) {
      console.error('❌ Failed to publish movement:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log('🔒 RabbitMQ connection closed');
    } catch (error) {
      console.error('❌ Error closing RabbitMQ connection:', error);
    }
  }
}
