import { Kafka, Admin, Producer, Consumer, EachMessagePayload, Partitioners, CompressionTypes, logLevel } from "kafkajs";

const SASL_MECHANISM = "scram-sha-256";

export class KafkaService {
  private kafka: Kafka;
  private producer: Producer;
  private admin: Admin;
  private consumers: Map<string, Consumer> = new Map();
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;
  private verifiedTopics: Set<string> = new Set();

  constructor() {
    const brokers = process.env.KAFKA_BROKERS?.split(',') || [];

    this.kafka = new Kafka({
      clientId: 'workflow-engine',
      brokers: brokers,
      ssl: {
        ca: process.env.KAFKA_SSL_CA || 'ca.pem',
        rejectUnauthorized: false
      },
      sasl: {
        mechanism: SASL_MECHANISM,
        username: process.env.KAFKA_USERNAME || '',
        password: process.env.KAFKA_PASSWORD || ''
      },
      connectionTimeout: 10000,
      requestTimeout: 30000,
      retry: {
        retries: 5,
        initialRetryTime: 300,
        maxRetryTime: 30000,
      },
      logLevel: logLevel.INFO, // Enable for debugging
    });

    // IMPORTANT: Producer auto topic creation
    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true, // This must be true
      createPartitioner: Partitioners.LegacyPartitioner,
      metadataMaxAge: 300000,
      transactionTimeout: 30000,
      maxInFlightRequests: 5,
    });

    this.admin = this.kafka.admin({
      retry: {
        retries: 5,
        initialRetryTime: 300,
        maxRetryTime: 30000,
      }
    });
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
        await Promise.all([
          this.producer.connect(),
          this.admin.connect()
        ]);
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

  private async ensureConnected() {
    if (!this.isConnected) {
      await this.connect();
    }
  }

  // SIMPLE: Always try to send first, let producer auto-create topic
  async sendMessage(topicName: string, key: string, message: any, headers?: Record<string, string>) {
    await this.ensureConnected();

    try {
      const result = await this.producer.send({
        topic: topicName,
        messages: [{
          key,
          value: typeof message === 'string' ? message : JSON.stringify(message),
          headers: headers || {},
          timestamp: Date.now().toString(),
        }],
        acks: 1, // Use 1 for better performance
        timeout: 10000,
      });

      console.log(`✓ Message sent to topic ${topicName} with key ${key}`);
      return result;
    } catch (error: any) {
      console.error(`❌ Error sending message to ${topicName}:`, error.message);

      // If topic doesn't exist, you need to enable auto.create.topics.enable in Aiven
      if (error.message.includes('UnknownTopicOrPartition') ||
        error.message.includes('TOPIC_NOT_FOUND') ||
        error.message.includes('does not host this topic-partition')) {

        console.error(`⚠️ Topic ${topicName} does not exist and auto-creation is disabled.`);
        console.error('⚠️ Please enable auto.create.topics.enable=true in Aiven Kafka settings.');

        // Alternative: Try to create topic manually
        try {
          console.log(`🔄 Attempting to create topic ${topicName} manually...`);
          await this.createTopicManually(topicName);

          // Retry sending
          return this.producer.send({
            topic: topicName,
            messages: [{
              key,
              value: typeof message === 'string' ? message : JSON.stringify(message),
              headers: headers || {},
              timestamp: Date.now().toString(),
            }],
            acks: 1,
            timeout: 10000,
          });
        } catch (createError: any) {
          console.error(`❌ Failed to create topic ${topicName}:`, createError.message);
        }
      }

      throw error;
    }
  }

  // Create topic manually if auto-creation is disabled
  private async createTopicManually(topicName: string, partitions: number = 3) {
    await this.ensureConnected();

    try {
      // First check if topic exists
      const topics = await this.admin.listTopics();
      if (topics.includes(topicName)) {
        this.verifiedTopics.add(topicName);
        console.log(`✓ Topic already exists: ${topicName}`);
        return;
      }

      console.log(`Creating topic: ${topicName}...`);

      await this.admin.createTopics({
        topics: [{
          topic: topicName,
          numPartitions: partitions,
          replicationFactor: 1,
        }],
        waitForLeaders: true,
        timeout: 30000,
      });

      this.verifiedTopics.add(topicName);
      console.log(`✓ Successfully created topic: ${topicName}`);

      // Wait for topic propagation
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error: any) {
      console.error(`❌ Failed to create topic ${topicName}:`, error.message);
      throw error;
    }
  }

  // Create consumer with topic verification
  async createConsumer(
    groupId: string,
    topics: string[],
    handler: (payload: EachMessagePayload) => Promise<void>,
    options: {
      fromBeginning?: boolean;
    } = {}
  ) {
    const consumerKey = `${groupId}-${topics.join(',')}`;

    if (this.consumers.has(consumerKey)) {
      console.log(`⚠️ Consumer already exists for ${consumerKey}`);
      return this.consumers.get(consumerKey)!;
    }

    console.log(`Creating consumer for group: ${groupId}, topics: ${topics.join(', ')}`);

    // Step 1: Ensure topics exist BEFORE creating consumer
    for (const topic of topics) {
      if (!this.verifiedTopics.has(topic)) {
        try {
          // Try to send a dummy message to trigger auto-creation
          console.log(`Ensuring topic exists: ${topic}`);
          await this.sendMessage(topic, '__init__', { type: 'init' }).catch(() => {
            // Ignore errors - we just want to trigger topic creation
          });
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error: any) {
          console.warn(`Could not ensure topic ${topic}:`, error.message);
        }
      }
    }

    // Step 2: Create consumer
    const consumer = this.kafka.consumer({
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxBytesPerPartition: 1048576,
      maxBytes: 10485760,
      retry: {
        retries: 10,
        initialRetryTime: 1000,
        maxRetryTime: 30000,

      },
    });

    try {
      // Step 3: Connect consumer
      await consumer.connect();
      console.log(`✅ Consumer connected: ${groupId}`);

      // Step 4: Subscribe with retry
      let subscribed = false;
      let attempts = 0;
      const maxAttempts = 5;

      while (!subscribed && attempts < maxAttempts) {
        attempts++;
        try {
          await consumer.subscribe({
            topics,
            fromBeginning: options.fromBeginning || false
          });
          subscribed = true;
          console.log(`✅ Consumer subscribed to topics: ${topics.join(', ')}`);
        } catch (subscribeError: any) {
          console.warn(`Subscribe attempt ${attempts}/${maxAttempts} failed:`, subscribeError.message);

          if (attempts === maxAttempts) {
            throw subscribeError;
          }

          // Wait and try again
          await new Promise(resolve => setTimeout(resolve, 2000 * attempts));

          // Try to ensure topics exist again
          for (const topic of topics) {
            try {
              await this.sendMessage(topic, '__retry__', { type: 'retry' }).catch(() => { });
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
              // Ignore
            }
          }
        }
      }

      // Step 5: Run consumer
      await consumer.run({
        eachMessage: async (payload) => {
          try {
            await handler(payload);
          } catch (error: any) {
            console.error(`❌ Error processing message from topic ${payload.topic}:`, error.message);
          }
        },
        autoCommit: true,
        autoCommitInterval: 5000,
        autoCommitThreshold: 100,
      });

      // Store consumer
      this.consumers.set(consumerKey, consumer);
      console.log(`✅ Consumer created and running for group: ${groupId}`);

      return consumer;

    } catch (error: any) {
      console.error(`❌ Error creating consumer for group ${groupId}:`, error.message);

      try {
        await consumer.disconnect();
      } catch (disconnectError: any) {
        console.warn('Failed to disconnect consumer:', disconnectError.message);
      }

      throw error;
    }
  }

  // Simple create topic method for manual creation
  async createTopic(topicName: string, partitions: number = 3) {
    return this.createTopicManually(topicName, partitions);
  }

  // Pre-create all topics your app needs
  async initializeTopics(topicList: string[]) {
    console.log('Initializing topics...');

    for (const topic of topicList) {
      try {
        await this.createTopicManually(topic);
      } catch (error: any) {
        console.warn(`Could not initialize topic ${topic}:`, error.message);
      }
    }

    console.log('✅ Topic initialization complete');
  }

  async getConnectionStatus() {
    return this.isConnected;
  }

  async removeConsumer(groupId: string, topics: string[]) {
    const consumerKey = `${groupId}-${topics.join(',')}`;
    const consumer = this.consumers.get(consumerKey);

    if (consumer) {
      try {
        await consumer.disconnect();
        this.consumers.delete(consumerKey);
        console.log(`✅ Consumer removed: ${consumerKey}`);
      } catch (error: any) {
        console.warn(`Error removing consumer ${consumerKey}:`, error.message);
      }
    }
  }

  async disconnect() {
    if (!this.isConnected) return;

    try {
      // Disconnect all consumers
      for (const [key, consumer] of this.consumers.entries()) {
        try {
          await consumer.disconnect();
          console.log(`Disconnected consumer: ${key}`);
        } catch (error: any) {
          console.warn(`Error disconnecting consumer ${key}:`, error.message);
        }
      }

      // Disconnect producer and admin
      await Promise.all([
        this.producer.disconnect().catch((err: any) => console.warn('Producer disconnect error:', err.message)),
        this.admin.disconnect().catch((err: any) => console.warn('Admin disconnect error:', err.message))
      ]);

      this.consumers.clear();
      this.isConnected = false;
      console.log('✅ Kafka service disconnected');
    } catch (error: any) {
      console.error('❌ Error disconnecting Kafka:', error.message);
      throw error;
    }
  }
}

// Singleton with initialization
let kafkaServiceInstance: KafkaService | null = null;

export function getKafkaService(): KafkaService {
  if (!kafkaServiceInstance) {
    kafkaServiceInstance = new KafkaService();

    // Initialize topics on startup (optional)
    process.nextTick(async () => {
      try {
        await kafkaServiceInstance!.connect();
        // Pre-create your topics here
        // await kafkaServiceInstance.initializeTopics(['workflow-events', 'workflow-triggers']);
      } catch (error) {
        console.error('Failed to initialize Kafka:', error);
      }
    });
  }
  return kafkaServiceInstance;
}

export default KafkaService;