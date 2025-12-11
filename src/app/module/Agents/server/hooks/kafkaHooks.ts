import { KafkaService } from "@/services/kafkaservice";

export const kafkaStarter = async () => {
  const kafkaService = new KafkaService();
  await kafkaService.connect();
  return KafkaService.
};
