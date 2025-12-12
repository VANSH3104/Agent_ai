// src/services/workflowhooks.ts (FIXED - Direct Execution)
import { KafkaService } from "./kafkaservice";

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

  /**
   * Execute node directly without Kafka messaging
   * This is the actual node execution logic
   */
  async executeNode(
    context: NodeContext, 
    inputData: any,
    skipKafka: boolean = false
  ): Promise<HookResult> {
    try {
      console.log(`   🔧 Executing ${context.nodeType} node...`);

      // Execute based on node type
      let result: any;

      switch (context.nodeType) {
        case 'MANUAL':
          result = await this.executeManualTrigger(context, inputData);
          break;

        case 'HTTP':
          result = await this.executeHttpRequest(context, inputData);
          break;

        case 'EMAIL':
          result = await this.executeSendEmail(context, inputData);
          break;

        case 'CODE':
          result = await this.executeCode(context, inputData);
          break;

        case 'CONDITION':
          result = await this.executeCondition(context, inputData);
          break;

        case 'FILTER':
          result = await this.executeFilter(context, inputData);
          break;

        case 'DATABASE':
          result = await this.executeDatabaseQuery(context, inputData);
          break;

        case 'WEBHOOK':
          result = await this.executeWebhook(context, inputData);
          break;

        case 'SCHEDULE':
          result = await this.executeSchedule(context, inputData);
          break;

        case 'INITIAL':
          result = await this.executeInitial(context, inputData);
          break;

        default:
          throw new Error(`Unknown node type: ${context.nodeType}`);
      }

      return {
        success: true,
        data: result,
        metadata: {
          nodeType: context.nodeType,
          executionTime: new Date().toISOString()
        }
      };

    } catch (error: any) {
      console.error(`   ❌ Node execution error:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ============ NODE TYPE IMPLEMENTATIONS ============

  private async executeManualTrigger(context: NodeContext, inputData: any): Promise<any> {
    // Manual trigger just passes through the input data
    return {
      ...inputData,
      triggeredAt: new Date().toISOString(),
      triggerType: 'manual'
    };
  }

  private async executeHttpRequest(context: NodeContext, inputData: any): Promise<any> {
    const { url, method = 'GET', headers = [], body, queryParams = [], timeout = 30000 } = context.nodeData;

    if (!url) {
      throw new Error('HTTP node: URL is required');
    }

    // Build query string
    let finalUrl = url;
    if (queryParams.length > 0) {
      const params = new URLSearchParams();
      queryParams.forEach((param: any) => {
        if (param.key && param.value) {
          params.append(param.key, param.value);
        }
      });
      finalUrl = `${url}?${params.toString()}`;
    }

    // Build headers
    const fetchHeaders: Record<string, string> = {};
    headers.forEach((header: any) => {
      if (header.key && header.value) {
        fetchHeaders[header.key] = header.value;
      }
    });

    // Make request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(finalUrl, {
        method,
        headers: fetchHeaders,
        body: method !== 'GET' && body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      return {
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data,
        success: response.ok,
        url: finalUrl,
        method
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`HTTP request timeout after ${timeout}ms`);
      }
      
      throw new Error(`HTTP request failed: ${error.message}`);
    }
  }

  private async executeSendEmail(context: NodeContext, inputData: any): Promise<any> {
    const { to, subject, body, from } = context.nodeData;

    // TODO: Implement actual email sending (use nodemailer, sendgrid, etc.)
    console.log(`   📧 Sending email to: ${to}`);
    console.log(`   📧 Subject: ${subject}`);

    // For now, simulate email sending
    return {
      sent: true,
      to,
      subject,
      messageId: `msg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      // In production, you'd actually send the email here
      simulatedOnly: true
    };
  }

  private async executeCode(context: NodeContext, inputData: any): Promise<any> {
    const { code, language = 'javascript' } = context.nodeData;

    if (language !== 'javascript') {
      throw new Error(`Code execution only supports JavaScript, got: ${language}`);
    }

    try {
      // Create a safe execution context
      const fn = new Function('input', 'context', code);
      const result = fn(inputData, context);

      return result;
    } catch (error: any) {
      throw new Error(`Code execution failed: ${error.message}`);
    }
  }

  private async executeCondition(context: NodeContext, inputData: any): Promise<any> {
    const { condition, trueOutput, falseOutput } = context.nodeData;

    try {
      // Evaluate condition
      const fn = new Function('input', `return ${condition}`);
      const result = fn(inputData);

      return {
        conditionMet: !!result,
        output: result ? trueOutput : falseOutput,
        inputData
      };
    } catch (error: any) {
      throw new Error(`Condition evaluation failed: ${error.message}`);
    }
  }

  private async executeFilter(context: NodeContext, inputData: any): Promise<any> {
    const { filterCondition } = context.nodeData;

    if (!Array.isArray(inputData)) {
      throw new Error('Filter node requires array input');
    }

    try {
      const fn = new Function('item', `return ${filterCondition}`);
      const filtered = inputData.filter(fn);

      return {
        filtered,
        originalCount: inputData.length,
        filteredCount: filtered.length
      };
    } catch (error: any) {
      throw new Error(`Filter execution failed: ${error.message}`);
    }
  }

  private async executeDatabaseQuery(context: NodeContext, inputData: any): Promise<any> {
    const { query, operation = 'SELECT' } = context.nodeData;

    // TODO: Implement actual database operations
    console.log(`   💾 Database ${operation}:`, query);

    // Simulate database response
    return {
      success: true,
      operation,
      query,
      // In production, execute actual database query here
      simulatedOnly: true
    };
  }

  private async executeWebhook(context: NodeContext, inputData: any): Promise<any> {
    // Webhook trigger - passes through data
    return {
      ...inputData,
      triggeredAt: new Date().toISOString(),
      triggerType: 'webhook'
    };
  }

  private async executeSchedule(context: NodeContext, inputData: any): Promise<any> {
    // Schedule trigger - passes through data
    return {
      ...inputData,
      triggeredAt: new Date().toISOString(),
      triggerType: 'schedule',
      scheduledTime: context.nodeData.scheduledTime
    };
  }

  private async executeInitial(context: NodeContext, inputData: any): Promise<any> {
    // Initial trigger - passes through data
    return {
      ...inputData,
      triggeredAt: new Date().toISOString(),
      triggerType: 'initial'
    };
  }

  // ============ WORKFLOW LIFECYCLE HOOKS ============

  async completeWorkflow(context: HookContext, result: any): Promise<HookResult> {
    try {
      console.log(`   🎉 Workflow ${context.workflowId} completed`);
      
      // Optionally send completion event to Kafka
      const completionTopic = `workflow.${context.workflowId}.complete`;
      
      await this.kafkaService.createTopic(completionTopic, 1);
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
      console.error('Failed to send completion event:', error.message);
      // Don't fail the workflow if event sending fails
      return {
        success: true,
        data: { message: 'Workflow completed (event send failed)' }
      };
    }
  }

  async handleError(context: NodeContext, error: Error): Promise<HookResult> {
    try {
      console.error(`   ❌ Error in node ${context.nodeId}:`, error.message);
      
      // Optionally send error event to Kafka
      const errorTopic = `workflow.${context.workflowId}.error`;
      
      await this.kafkaService.createTopic(errorTopic, 1);
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
      console.error('Failed to log error to Kafka:', kafkaError.message);
      // Don't fail if logging fails
      return {
        success: true,
        data: { message: 'Error occurred (logging failed)' }
      };
    }
  }

  async log(
    context: NodeContext, 
    message: string, 
    level: 'INFO' | 'WARN' | 'ERROR' = 'INFO', 
    metadata?: any
  ): Promise<HookResult> {
    try {
      console.log(`   📝 [${level}] ${message}`);
      
      // Optionally send log to Kafka
      const logTopic = `workflow.${context.workflowId}.logs`;
      
      await this.kafkaService.createTopic(logTopic, 1);
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
      console.error('Failed to send log to Kafka:', error.message);
      // Don't fail if logging fails
      return { success: true };
    }
  }
}