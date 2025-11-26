
import { Admin, Kafka, Producer } from "kafkajs";

export class KafkaService {
  private kafka: Kafka;
  private producer: Producer;
  private admin: Admin;
  constructor() {
    this.kafka = new Kafka({
      clientId: 'workflow-engine',
      brokers: [process.env.KafkaBrokers || 'localhost:9092']
    });
    this.producer = this.kafka.producer();
    this.admin = this.kafka.admin(); 
  }
  async connect() {
    await this.producer.connect();
    await this.admin.connect();
  }
  async createTopic(topicName: string) {
    try {
      await this.admin.createTopics({
        topics: [{
          topic: topicName,
          numPartitions: 1,
          replicationFactor: 1
        }]
      });
    }
    catch (error: any) {
      console.error(`Error creating topic ${topicName}: ${error.message}`);
    }
  }
  async sendTopic(topicName: string, messsage: any) {
    await this.producer.send({
      topic: topicName,
      messages: [{ value: JSON.stringify(messsage) }]
    })
  }
}