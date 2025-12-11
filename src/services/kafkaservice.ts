import { Admin, Consumer, EachMessagePayload, Kafka, Producer } from "kafkajs";

export class KafkaService {
  private kafka: Kafka;
  private producer: Producer;
  private admin: Admin;
  private consumers: Map<string, Consumer> = new Map();
  private isConnected: boolean = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'workflow-engine',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      retry: {
        retries: 5,
      },
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: false,
      idempotent: true,
      maxInFlightRequests: 1,
    });

    this.admin = this.kafka.admin();
  }

  async connect() {
    await this.producer.connect();
    await this.admin.connect();
    this.isConnected = true;
  }
  async disconnect() {
      await this.producer.disconnect();
      await this.admin.disconnect();
      
      // Disconnect all consumers
      for (const [topic, consumer] of this.consumers.entries()) {
        await consumer.disconnect();
        console.log(`Disconnected consumer for topic: ${topic}`);
      }
      
      this.consumers.clear();
      this.isConnected = false;
    }


  async createTopic(topicName: string, partitions: number = 24) {
    try {
      const exists = await this.admin.listTopics();
      if (exists.includes(topicName)) return;

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
    }
  }

  async sendMessage(topicName: string, key: string, message: any) {
    return this.producer.send({
      topic: topicName,
      messages: [
        {
          key,
          value: JSON.stringify(message),
        }
      ],
      compression: 1,
    });
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
      });
  
      await consumer.connect();
      await consumer.subscribe({ topics, fromBeginning: false });
  
      await consumer.run({
        eachMessage: handler,
      });
  
      // Store consumer reference
      topics.forEach(topic => this.consumers.set(topic, consumer));
      console.log(`Consumer created for topics: ${topics.join(', ')}`);
  
      return consumer;
    }
  }
  
}

