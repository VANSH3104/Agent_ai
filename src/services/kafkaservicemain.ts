
import { Admin, Consumer, EachMessagePayload, Kafka, Producer, Partitioners } from "kafkajs";

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

    // FIXED: Use LegacyPartitioner to silence warning
    this.producer = this.kafka.producer({
      allowAutoTopicCreation: false,
      createPartitioner: Partitioners.LegacyPartitioner, // Add this!
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

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = (async () => {
      try {
        await this.producer.connect();
        await this.admin.connect();
        this.isConnected = true;
        console.log('✅ Kafka producer and admin connected successfully');
      } catch (error: any) {
        console.error('❌ Failed to connect to Kafka:', error.message);
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

      for (const [topic, consumer] of this.consumers.entries()) {
        await consumer.disconnect();
        console.log(`Disconnected consumer for topic: ${topic}`);
      }

      this.consumers.clear();
      this.isConnected = false;
      console.log('✅ Kafka service disconnected successfully');
    } catch (error: any) {
      console.error('❌ Error disconnecting Kafka:', error.message);
      throw error;
    }
  }

  private async ensureConnected() {
    if (!this.isConnected) {
      console.log('🔌 Producer not connected, attempting to connect...');
      await this.connect();
    }
  }

  // FIXED: Reduce default partitions (Kafka may have limited partitions configured)
  async createTopic(topicName: string, partitions: number = 3) {
    await this.ensureConnected();

    try {
      const exists = await this.admin.listTopics();
      if (exists.includes(topicName)) {
        console.log(`✓ Topic already exists: ${topicName}`);
        return;
      }

      await this.admin.createTopics({
        topics: [{
          topic: topicName,
          numPartitions: partitions,
          replicationFactor: 1,
        }],
      });

      console.log(`✓ Created topic: ${topicName} with ${partitions} partitions`);
    } catch (error: any) {
      console.error(`❌ Error creating topic ${topicName}: ${error.message}`);
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

      console.log(`✓ Message sent to topic ${topicName}:`, result);
      return result;
    } catch (error: any) {
      console.error(`❌ Error sending message to ${topicName}: ${error.message}`);

      // Try to reconnect on failure
      if (error.message.includes('disconnected')) {
        this.isConnected = false;
        console.log('🔄 Attempting to reconnect...');
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
    // Check if consumer already exists
    const consumerKey = `${groupId}-${topics.join(',')}`;
    if (this.consumers.has(consumerKey)) {
      console.log(`⚠️  Consumer already exists for ${consumerKey}`);
      return this.consumers.get(consumerKey)!;
    }

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
      console.log(`✓ Consumer connected: ${groupId}`);

      await consumer.subscribe({ topics, fromBeginning: false });
      console.log(`✓ Consumer subscribed to topics: ${topics.join(', ')}`);

      await consumer.run({
        eachMessage: handler,
      });

      // Store consumer reference
      this.consumers.set(consumerKey, consumer);
      console.log(`✅ Consumer created and running for topics: ${topics.join(', ')}`);

      return consumer;
    } catch (error: any) {
      console.error(`❌ Error creating consumer: ${error.message}`);
      throw error;
    }
  }

  async removeConsumer(groupId: string, topics: string[]) {
    const consumerKey = `${groupId}-${topics.join(',')}`;
    const consumer = this.consumers.get(consumerKey);

    if (consumer) {
      try {
        await consumer.disconnect();
        this.consumers.delete(consumerKey);
        console.log(`✅ Consumer removed: ${groupId}`);
      } catch (error: any) {
        console.error(`❌ Error removing consumer: ${error.message}`);
        throw error;
      }
    } else {
      console.warn(`⚠️ Consumer not found for removal: ${consumerKey}`);
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