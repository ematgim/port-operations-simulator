import * as amqp from 'amqplib';
import { EventEmitter } from 'events';
import { TugboatPosition, VesselPosition, AssignmentEvent } from '../types';

export class RabbitMQConsumer extends EventEmitter {
  private connection: any = null;
  private channel: any = null;
  private readonly queueName = 'tugboat-movements';

  async connect(url: string = 'amqp://localhost'): Promise<void> {
    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(this.queueName, { durable: true });
      console.log(`✅ Connected to RabbitMQ at ${url}`);
      console.log(`✅ Listening to queue '${this.queueName}'`);
      
      await this.startConsuming();
    } catch (error) {
      console.error('❌ Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  private async startConsuming(): Promise<void> {
    if (!this.channel) return;

    this.channel.consume(
      this.queueName,
      (msg: any) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            this.processMessage(content);
            this.channel.ack(msg);
          } catch (error) {
            console.error('Error processing message:', error);
            this.channel.nack(msg, false, false);
          }
        }
      },
      { noAck: false }
    );
  }

  private processMessage(content: any): void {
    // Emit different events based on message type
    if (content.type === 'TUGBOAT_POSITION') {
      this.emit('tugboat-position', content as TugboatPosition);
    } else if (content.type === 'VESSEL_REQUEST' || content.type === 'VESSEL_ARRIVED') {
      this.emit('vessel-request', content);
    } else if (content.type === 'VESSEL_DOCKED') {
      this.emit('vessel-docked', content);
    } else if (content.type === 'VESSEL_DEPARTED') {
      this.emit('vessel-departed', content);
    } else if (content.type === 'PORT_STATUS') {
      this.emit('port-status', content);
    } else if (content.type === 'ASSIGNMENT' || content.eventType === 'ASSIGNMENT') {
      this.emit('assignment', content as AssignmentEvent);
    } else if (content.eventType === 'TUGBOAT_ARRIVED') {
      this.emit('tugboat-arrived', content as AssignmentEvent);
    } else if (content.eventType === 'ASSISTANCE_COMPLETE') {
      this.emit('assistance-complete', content as AssignmentEvent);
    }
    
    // Emit all messages for general listeners
    this.emit('message', content);
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
