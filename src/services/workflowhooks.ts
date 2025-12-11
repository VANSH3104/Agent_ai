import { KafkaService } from "./kafkaservice";

// src/services/WorkflowHooksService.ts
export interface HookContext {
  workflowId: string;
  executionId: string;
  userId: string;
  mode: 'production' | 'test';
  triggerData: any;
}

export interface NodeContext extends HookContext {
  nodeId: string;
  nodeType: string;
  nodeData: any;
}

export interface HookResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export class WorkflowHooksService {
  private kafkaService: KafkaService;

  constructor(kafkaService: KafkaService) {
    this.kafkaService = kafkaService;
  }

  // Hook for node execution
  async executeNode(context: NodeContext, inputData: any): Promise<HookResult> {
    try {
      const executionTopic = `workflow.${context.workflowId}.node.${context.nodeId}`;
      
      // Send node execution message
      const message = {
        executionId: context.executionId,
        nodeId: context.nodeId,
        nodeType: context.nodeType,
        nodeData: context.nodeData,
        inputData,
        timestamp: new Date().toISOString()
      };

      await this.kafkaService.sendMessage(
        executionTopic,
        context.executionId,
        message
      );

      // Create a response topic for this specific node execution
      const responseTopic = `workflow.${context.workflowId}.node.${context.nodeId}.response.${context.executionId}`;
      await this.kafkaService.createTopic(responseTopic);

      // Return a promise that will resolve when the node completes
      return await this.waitForNodeResponse(responseTopic, context.executionId);

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async waitForNodeResponse(topic: string, executionId: string): Promise<HookResult> {
    return new Promise((resolve) => {
      // Create a temporary consumer for the response
      this.kafkaService.createConsumer(
        `node-response-${executionId}`,
        [topic],
        async (payload) => {
          try {
            const message = JSON.parse(payload.message.value?.toString() || '{}');
            
            if (message.executionId === executionId) {
              resolve({
                success: true,
                data: message.result,
                metadata: message.metadata
              });
            }
          } catch (error) {
            resolve({
              success: false,
              error: 'Failed to parse node response'
            });
          }
        }
      );
    });
  }

  // Hook for workflow completion
  async completeWorkflow(context: HookContext, result: any): Promise<HookResult> {
    try {
      const completionTopic = `workflow.${context.workflowId}.complete`;
      
      await this.kafkaService.sendMessage(
        completionTopic,
        context.executionId,
        {
          executionId: context.executionId,
          result,
          status: 'COMPLETED',
          timestamp: new Date().toISOString()
        }
      );

      return {
        success: true,
        data: { message: 'Workflow completed successfully' }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Hook for error handling
  async handleError(context: NodeContext, error: Error): Promise<HookResult> {
    try {
      const errorTopic = `workflow.${context.workflowId}.error`;
      
      await this.kafkaService.sendMessage(
        errorTopic,
        context.executionId,
        {
          executionId: context.executionId,
          nodeId: context.nodeId,
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        }
      );

      return {
        success: true,
        data: { message: 'Error logged successfully' }
      };
    } catch (kafkaError: any) {
      console.error('Failed to log error to Kafka:', kafkaError);
      return {
        success: false,
        error: kafkaError.message
      };
    }
  }

  // Hook for logging
  async log(context: NodeContext, message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO', metadata?: any): Promise<HookResult> {
    try {
      const logTopic = `workflow.${context.workflowId}.logs`;
      
      await this.kafkaService.sendMessage(
        logTopic,
        context.executionId,
        {
          executionId: context.executionId,
          nodeId: context.nodeId,
          level,
          message,
          metadata,
          timestamp: new Date().toISOString()
        }
      );

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}