  import { Kafka, Admin, Producer, Consumer, EachMessagePayload, Partitioners, logLevel } from "kafkajs";
  
  const SASL_MECHANISM = "scram-sha-256";
  
  export class KafkaService {
    private kafka: Kafka;
    private producer: Producer;
    private admin: Admin;
    private consumers: Map<string, Consumer> = new Map();
    private isConnected: boolean = false;
    private connectionPromise: Promise<void> | null = null;
    private verifiedTopics: Set<string> = new Set();
    
    // 🔥 NEW: Duplicate prevention
    private processedExecutions = new Set<string>();
    private processingLocks = new Map<string, Promise<void>>();
  
    constructor() {
      const getCaCert = (): Buffer[] | undefined => {
        const caPem = process.env.KAFKA_CA_PEM;
        if (!caPem) return undefined;
        
        try {
          const certContent = caPem.includes('data:text/plain,') 
            ? Buffer.from(caPem.split(',')[1], 'base64').toString('utf8')
            : caPem;
          
          return [Buffer.from(certContent)];
        } catch (error) {
          console.error('Failed to decode CA certificate:', error);
          return undefined;
        }
      };  
      
      console.log('🔥 USING HARDCODED AIVEN CONFIG');
      
      this.kafka = new Kafka({
        clientId: 'workflow-engine',
        brokers: ['kafka-2057e50f-vanshexperimental31-cf7c.e.aivencloud.com:27244'],
        ssl: {
          rejectUnauthorized: false,
        },
        sasl: {
          mechanism: SASL_MECHANISM,
          username: 'avnadmin',
          password: process.env.KAFKA_PASSWORD || 'your-password-here'
        },
        connectionTimeout: 10000,
        requestTimeout: 30000,
        retry: {
          retries: 5,
          initialRetryTime: 300,
          maxRetryTime: 30000,
        },
        logLevel: logLevel.INFO,
      });
  
      this.producer = this.kafka.producer({
        allowAutoTopicCreation: true,
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
  
    async createTopicManually(topicName: string) {
      if (topicName !== "test") {
        console.log(`⚠️ Ignoring topic creation request for "${topicName}" - only "test" topic is allowed`);
        return;
      }
  
      try {
        await this.ensureConnected();
        
        const topics = await this.admin.listTopics();
        if (topics.includes(topicName)) {
          console.log(`✅ Topic ${topicName} already exists`);
          this.verifiedTopics.add(topicName);
          return;
        }
  
        await this.admin.createTopics({
          topics: [{
            topic: topicName,
            numPartitions: 3,
            replicationFactor: 2,
            configEntries: [
              { name: 'cleanup.policy', value: 'delete' },
              { name: 'retention.ms', value: '604800000' },
            ]
          }],
          waitForLeaders: true,
          timeout: 10000,
        });
  
        console.log(`✅ Topic ${topicName} created successfully`);
        this.verifiedTopics.add(topicName);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        if (error.message.includes('TopicExistsException') || 
            error.message.includes('already exists')) {
          console.log(`✅ Topic ${topicName} already exists (caught exception)`);
          this.verifiedTopics.add(topicName);
          return;
        }
        console.error(`❌ Failed to create topic ${topicName}:`, error.message);
        throw error;
      }
    }
  
    async createTopic(topicName: string , partitions?: number) {
      if (topicName !== "test") {
        console.log(`⚠️ Ignoring topic creation request for "${topicName}" - only "test" topic is allowed`);
        return;
      }
      return this.createTopicManually(topicName);
    }
  
    async sendMessage(topicName: string, key: string, message: any, headers?: Record<string, string>) {
      await this.ensureConnected();
      
      const targetTopic = "test";
      
      console.log(`📝 sendMessage called with topic "${topicName}" → redirecting to "test"`);
  
      if (!this.verifiedTopics.has(targetTopic)) {
        try {
          await this.createTopicManually(targetTopic);
        } catch (error: any) {
          console.warn(`Could not verify topic ${targetTopic}:`, error.message);
        }
      }
  
      try {
        const result = await this.producer.send({
          topic: targetTopic,
          messages: [{
            key,
            value: typeof message === 'string' ? message : JSON.stringify(message),
            headers: headers || {},
            timestamp: Date.now().toString(),
          }],
          acks: 1,
          timeout: 10000,
        });
  
        console.log(`✓ Message sent to topic ${targetTopic} with key ${key}`);
        return result;
      } catch (error: any) {
        console.error(`❌ Error sending message to ${targetTopic}:`, error.message);
  
        if (error.message.includes('UnknownTopicOrPartition') ||
            error.message.includes('TOPIC_NOT_FOUND') ||
            error.message.includes('does not host this topic-partition')) {
  
          console.error(`⚠️ Topic ${targetTopic} does not exist, attempting to create...`);
          
          try {
            await this.createTopicManually(targetTopic);
  
            const retryResult = await this.producer.send({
              topic: targetTopic,
              messages: [{
                key,
                value: typeof message === 'string' ? message : JSON.stringify(message),
                headers: headers || {},
                timestamp: Date.now().toString(),
              }],
              acks: 1,
              timeout: 10000,
            });
            
            console.log(`✓ Message sent to topic ${targetTopic} after retry`);
            return retryResult;
          } catch (createError: any) {
            console.error(`❌ Failed to create topic ${targetTopic}:`, createError.message);
            throw createError;
          }
        }
  
        throw error;
      }
    }
  
    // 🔥 MODIFIED: Wrap handler with duplicate prevention
    async createConsumer(
      groupId: string,
      topics: string[],
      handler: (payload: EachMessagePayload) => Promise<void>,
      options: {
        fromBeginning?: boolean;
      } = {}
    ) {
      const targetTopics = ["test"];
      const consumerKey = `${groupId}-test`;
  
      if (this.consumers.has(consumerKey)) {
        console.log(`⚠️ Consumer already exists for ${consumerKey}`);
        return this.consumers.get(consumerKey)!;
      }
  
      console.log(`Creating consumer for group: ${groupId}, always using topic: test`);
  
      if (!this.verifiedTopics.has("test")) {
        try {
          console.log(`Ensuring topic exists: test`);
          await this.createTopicManually("test");
        } catch (error: any) {
          console.warn(`Could not ensure topic test:`, error.message);
        }
      }
  
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
        await consumer.connect();
        console.log(`✅ Consumer connected: ${groupId}`);
  
        let subscribed = false;
        let attempts = 0;
        const maxAttempts = 5;
  
        while (!subscribed && attempts < maxAttempts) {
          attempts++;
          try {
            await consumer.subscribe({
              topics: targetTopics,
              fromBeginning: options.fromBeginning || false
            });
            subscribed = true;
            console.log(`✅ Consumer subscribed to topic: test`);
          } catch (subscribeError: any) {
            console.warn(`Subscribe attempt ${attempts}/${maxAttempts} failed:`, subscribeError.message);
  
            if (attempts === maxAttempts) {
              throw subscribeError;
            }
  
            await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
  
            try {
              await this.createTopicManually("test");
            } catch (error) {
              // Ignore
            }
          }
        }
  
        await consumer.run({
          eachMessage: async (payload) => {
            try {
              // 🔥 NEW: Duplicate prevention wrapper
              await this.handleMessageWithDuplicatePrevention(payload, handler);
            } catch (error: any) {
              console.error(`❌ Error processing message from topic ${payload.topic}:`, error.message);
            }
          },
          autoCommit: true,
          autoCommitInterval: 5000,
          autoCommitThreshold: 100,
        });
  
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
  
    // 🔥 NEW: Duplicate prevention logic
    private async handleMessageWithDuplicatePrevention(
      payload: EachMessagePayload,
      handler: (payload: EachMessagePayload) => Promise<void>
    ) {
      const { message } = payload;
      const executionId = message.key?.toString();
  
      if (!executionId) {
        // No execution ID, process normally
        await handler(payload);
        return;
      }
  
      // Check if already processed
      if (this.processedExecutions.has(executionId)) {
        console.log(`⚠️ DUPLICATE DETECTED - Execution ${executionId} already processed, skipping`);
        return;
      }
  
      // Check if currently being processed (race condition)
      if (this.processingLocks.has(executionId)) {
        console.log(`⚠️ CONCURRENT PROCESSING - Execution ${executionId} is being processed, skipping`);
        await this.processingLocks.get(executionId);
        return;
      }
  
      // Mark as processing
      const processingPromise = (async () => {
        try {
          await handler(payload);
          
          // Mark as completed
          this.processedExecutions.add(executionId);
          
          // Clean up old entries (keep last 1000)
          if (this.processedExecutions.size > 1000) {
            const entries = Array.from(this.processedExecutions);
            entries.slice(0, 100).forEach(id => this.processedExecutions.delete(id));
          }
        } finally {
          this.processingLocks.delete(executionId);
        }
      })();
  
      this.processingLocks.set(executionId, processingPromise);
      await processingPromise;
    }
  
    async getConnectionStatus() {
      return this.isConnected;
    }
  
    async removeConsumer(groupId: string, topics: string[]) {
      const consumerKey = `${groupId}-test`;
      console.log(`📝 removeConsumer called with topics ${JSON.stringify(topics)} → using "test"`);
      
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
        for (const [key, consumer] of this.consumers.entries()) {
          try {
            await consumer.disconnect();
            console.log(`Disconnected consumer: ${key}`);
          } catch (error: any) {
            console.warn(`Error disconnecting consumer ${key}:`, error.message);
          }
        }
  
        await Promise.all([
          this.producer.disconnect().catch((err: any) => console.warn('Producer disconnect error:', err.message)),
          this.admin.disconnect().catch((err: any) => console.warn('Admin disconnect error:', err.message))
        ]);
  
        this.consumers.clear();
        this.isConnected = false;
        
        // 🔥 NEW: Clean up duplicate prevention data
        this.processedExecutions.clear();
        this.processingLocks.clear();
        
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
  
      process.nextTick(async () => {
        try {
          await kafkaServiceInstance!.connect();
          await kafkaServiceInstance!.createTopic("test");
          console.log('✅ Kafka service initialized with "test" topic');
        } catch (error: any) {
          console.error('❌ Failed to initialize Kafka:', error.message);
        }
      });
    }
    return kafkaServiceInstance;
  }
  
  export default KafkaService;