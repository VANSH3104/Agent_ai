import { Admin, Consumer, EachMessagePayload, Kafka, Producer } from "kafkajs";

export class KafkaService {
  private kafka: Kafka;
  private producer: Producer;
  private admin: Admin;
  private consumers: Map<string, Consumer> = new Map();
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'workflow-engine',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      retry: {
        retries: 5,
        initialRetryTime: 300,
        maxRetryTime: 30000,
      },
    });
    
    this.producer = this.kafka.producer({
      allowAutoTopicCreation: false,
      idempotent: true,
      maxInFlightRequests: 5,
      retry: {
        retries: 5,
      },
    });
    
    this.admin = this.kafka.admin();
  }

  async connect() {
    if (this.isConnected) {
      return;
    }

    // Prevent multiple simultaneous connection attempts
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = (async () => {
      try {
        await this.producer.connect();
        await this.admin.connect();
        this.isConnected = true;
        console.log('Kafka producer and admin connected successfully');
      } catch (error: any) {
        console.error('Failed to connect to Kafka:', error.message);
        this.isConnected = false;
        throw error;
      } finally {
        this.connectionPromise = null;
      }
    })();

    return this.connectionPromise;
  }

  async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.producer.disconnect();
      await this.admin.disconnect();
      
      // Disconnect all consumers
      for (const [topic, consumer] of this.consumers.entries()) {
        await consumer.disconnect();
        console.log(`Disconnected consumer for topic: ${topic}`);
      }
      
      this.consumers.clear();
      this.isConnected = false;
      console.log('Kafka service disconnected successfully');
    } catch (error: any) {
      console.error('Error disconnecting Kafka:', error.message);
      throw error;
    }
  }

  private async ensureConnected() {
    if (!this.isConnected) {
      console.log('Producer not connected, attempting to connect...');
      await this.connect();
    }
  }

  async createTopic(topicName: string, partitions: number = 24) {
    await this.ensureConnected();
    
    try {
      const exists = await this.admin.listTopics();
      if (exists.includes(topicName)) {
        console.log(`Topic already exists: ${topicName}`);
        return;
      }
      
      await this.admin.createTopics({
        topics: [{
          topic: topicName,
          numPartitions: partitions,
          replicationFactor: 1,
        }],
      });
      
      console.log(`Created topic: ${topicName}`);
    } catch (error: any) {
      console.error(`Error creating topic ${topicName}: ${error.message}`);
      throw error;
    }
  }

  async sendMessage(topicName: string, key: string, message: any) {
    await this.ensureConnected();
    
    try {
      const result = await this.producer.send({
        topic: topicName,
        messages: [
          {
            key,
            value: JSON.stringify(message),
          }
        ],
        compression: 1, // CompressionTypes.GZIP
      });
      
      console.log(`Message sent to topic ${topicName}:`, result);
      return result;
    } catch (error: any) {
      console.error(`Error sending message to ${topicName}: ${error.message}`);
      
      // Try to reconnect on failure
      if (error.message.includes('disconnected')) {
        this.isConnected = false;
        console.log('Attempting to reconnect...');
        await this.connect();
        // Retry once
        return this.producer.send({
          topic: topicName,
          messages: [{ key, value: JSON.stringify(message) }],
          compression: 1,
        });
      }
      
      throw error;
    }
  }

  async createConsumer(
    groupId: string,
    topics: string[],
    handler: (payload: EachMessagePayload) => Promise<void>
  ) {
    const consumer = this.kafka.consumer({
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      retry: {
        retries: 5,
      },
    });

    try {
      await consumer.connect();
      await consumer.subscribe({ topics, fromBeginning: false });

      await consumer.run({
        eachMessage: handler,
      });

      // Store consumer reference
      topics.forEach(topic => this.consumers.set(topic, consumer));
      console.log(`Consumer created for topics: ${topics.join(', ')}`);

      return consumer;
    } catch (error: any) {
      console.error(`Error creating consumer: ${error.message}`);
      throw error;
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
let kafkaServiceInstance: KafkaService | null = null;

export function getKafkaService(): KafkaService {
  if (!kafkaServiceInstance) {
    kafkaServiceInstance = new KafkaService();
  }
  return kafkaServiceInstance;
}