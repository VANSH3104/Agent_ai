import { Kafka } from "kafkajs"
export const kafkaClient = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092', 'kafka2:9092']
})
export const producer = kafkaClient.producer();
export const getConsumer = (workflowId: string) =>
  kafkaClient.consumer({
    groupId: `workflow-${workflowId}`,
});
