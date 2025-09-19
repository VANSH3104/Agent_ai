// services/workflow-engine.ts
import { Kafka } from 'kafkajs';
import { db } from '@/db';
import { nodes, connections, executions, workflows } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

// Types
export interface WorkflowMessage {
  executionId: string;
  workflowId: string;
  nodeId: string;
  data: any;
  metadata: {
    timestamp: number;
    attempt: number;
    previousNodeId?: string;
    connectionOutputIndex?: number;
    retryCount?: number;
    maxRetries?: number;
  };
}

export interface NodeExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  nextNodes?: { nodeId: string; outputIndex: number }[];
}

export interface ExecutionState {
  id: string;
  workflowId: string;
  status: 'running' | 'success' | 'error' | 'paused';
  currentNodeId?: string;
  failedNodeId?: string;
  errorMessage?: string;
  canResume: boolean;
  pausedAt?: Date;
  completedNodes: string[];
  failedNodes: { nodeId: string; error: string; timestamp: Date }[];
}

export class WorkflowEngine {
  private kafka: Kafka;
  private producer: any;
  private consumers: Map<string, any> = new Map();
  private executionStates: Map<string, ExecutionState> = new Map();

  constructor() {
    this.kafka = new Kafka({
      clientId: 'workflow-engine-v2',
      brokers: ['localhost:9092', 'kafka2:9092']
    });
    this.producer = this.kafka.producer();
  }

  async initialize() {
    await this.producer.connect();
    await this.loadExecutionStates();
    console.log('Workflow Engine initialized');
  }

  // Load existing execution states from database
  private async loadExecutionStates() {
    const runningExecutions = await db.select()
      .from(executions)
      .where(inArray(executions.status, ['running', 'paused']));

    for (const execution of runningExecutions) {
      const state: ExecutionState = {
        id: execution.id,
        workflowId: execution.workflowId,
        status: execution.status as any,
        canResume: execution.status === 'paused' || execution.status === 'error',
        completedNodes: [],
        failedNodes: [],
        errorMessage: execution.error || undefined,
      };

      if (execution.data) {
        const data = JSON.parse(execution.data);
        state.completedNodes = data.completedNodes || [];
        state.failedNodes = data.failedNodes || [];
        state.currentNodeId = data.currentNodeId;
        state.failedNodeId = data.failedNodeId;
      }

      this.executionStates.set(execution.id, state);
    }
  }

  // Start workflow execution
  async startWorkflowExecution(
    workflowId: string,
    triggerData: any = {},
    startFromNodeId?: string
  ): Promise<string> {
    // Create execution record
    const execution = await db.insert(executions).values({
      workflowId,
      status: 'running',
      data: JSON.stringify({
        triggerData,
        completedNodes: [],
        failedNodes: [],
        startFromNodeId
      })
    }).returning();

    const executionId = execution[0].id;

    // Initialize execution state
    const executionState: ExecutionState = {
      id: executionId,
      workflowId,
      status: 'running',
      canResume: false,
      completedNodes: [],
      failedNodes: []
    };
    this.executionStates.set(executionId, executionState);

    // Find starting nodes
    let startingNodes;
    if (startFromNodeId) {
      // Resume from specific node
      startingNodes = await db.select()
        .from(nodes)
        .where(eq(nodes.id, startFromNodeId));
    } else {
      // Find trigger nodes (nodes with no incoming connections)
      startingNodes = await this.getTriggerNodes(workflowId);
    }

    // Start the consumer for this workflow if not already started
    if (!this.consumers.has(workflowId)) {
      await this.startWorkflowConsumer(workflowId);
    }

    // Trigger starting nodes
    for (const node of startingNodes) {
      await this.triggerNode(executionId, workflowId, node.id, triggerData);
    }

    return executionId;
  }

  // Resume execution from failed state
  async resumeExecution(
    executionId: string,
    fromNodeId?: string,
    modifiedData?: any
  ): Promise<{ success: boolean; message: string }> {
    const state = this.executionStates.get(executionId);
    if (!state) {
      return { success: false, message: 'Execution not found' };
    }

    if (!state.canResume) {
      return { success: false, message: 'Execution cannot be resumed' };
    }

    // Update execution status
    state.status = 'running';
    state.canResume = false;
    await this.updateExecutionInDB(executionId, 'running');

    // Get the node to resume from
    const nodeId = fromNodeId || state.failedNodeId || state.currentNodeId;
    if (!nodeId) {
      return { success: false, message: 'No node to resume from' };
    }

    // Get the last successful data or use modified data
    const execution = await db.select()
      .from(executions)
      .where(eq(executions.id, executionId))
      .then(rows => rows[0]);

    let resumeData = modifiedData;
    if (!resumeData && execution?.data) {
      const executionData = JSON.parse(execution.data);
      resumeData = executionData.lastSuccessfulData || executionData.triggerData || {};
    }

    // Remove the failed node from failed nodes list
    if (state.failedNodeId) {
      state.failedNodes = state.failedNodes.filter(f => f.nodeId !== state.failedNodeId);
      state.failedNodeId = undefined;
    }

    // Trigger the node
    await this.triggerNode(executionId, state.workflowId, nodeId, resumeData || {});

    return { success: true, message: 'Execution resumed successfully' };
  }

  // Pause execution
  async pauseExecution(executionId: string) {
    const state = this.executionStates.get(executionId);
    if (state) {
      state.status = 'paused';
      state.canResume = true;
      state.pausedAt = new Date();
      await this.updateExecutionInDB(executionId, 'paused');
    }
  }

  // Process node with enhanced error handling
  async processNode(message: WorkflowMessage) {
    const { executionId, workflowId, nodeId, data, metadata } = message;
    const state = this.executionStates.get(executionId);

    if (!state || state.status === 'paused') {
      console.log(`Execution ${executionId} is paused, skipping node ${nodeId}`);
      return;
    }

    try {
      // Update current node
      state.currentNodeId = nodeId;

      // Get node details
      const node = await db.select()
        .from(nodes)
        .where(eq(nodes.id, nodeId))
        .then(rows => rows[0]);

      if (!node) {
        throw new Error(`Node ${nodeId} not found`);
      }

      console.log(`Processing node: ${node.name} (${node.type})`);

      // Execute the node
      const result = await this.executeNodeWithRetry(node, data, metadata);

      if (result.success) {
        // Mark node as completed
        state.completedNodes.push(nodeId);
        
        // Store successful data for potential resume
        await this.updateExecutionData(executionId, {
          lastSuccessfulData: result.data || data,
          currentNodeId: nodeId,
          completedNodes: state.completedNodes
        });

        // Get and trigger next nodes
        const nextNodes = await this.getNextNodes(nodeId, result.nextNodes);
        
        if (nextNodes.length > 0) {
          for (const nextNode of nextNodes) {
            await this.triggerNode(
              executionId,
              workflowId,
              nextNode.nodeId,
              result.data || data,
              nextNode.outputIndex
            );
          }
        } else {
          // No next nodes, execution complete
          state.status = 'success';
          await this.updateExecutionInDB(executionId, 'success');
          console.log(`Workflow execution ${executionId} completed successfully`);
        }

      } else {
        await this.handleNodeFailure(executionId, nodeId, result.error || 'Unknown error', metadata);
      }

    } catch (error) {
      await this.handleNodeFailure(executionId, nodeId, error.message, metadata);
    }
  }

  // Handle node failure with retry logic
  private async handleNodeFailure(
    executionId: string,
    nodeId: string,
    error: string,
    metadata: WorkflowMessage['metadata']
  ) {
    const state = this.executionStates.get(executionId);
    if (!state) return;

    const retryCount = metadata.retryCount || 0;
    const maxRetries = metadata.maxRetries || 3;

    if (retryCount < maxRetries) {
      console.log(`Retrying node ${nodeId}, attempt ${retryCount + 1}/${maxRetries}`);
      
      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, retryCount) * 1000;
      setTimeout(async () => {
        await this.triggerNode(
          executionId,
          state.workflowId,
          nodeId,
          metadata.previousNodeId ? {} : state.completedNodes.length > 0 ? {} : {},
          metadata.connectionOutputIndex,
          retryCount + 1
        );
      }, delay);

    } else {
      // Max retries reached, mark as failed but resumable
      state.status = 'error';
      state.failedNodeId = nodeId;
      state.canResume = true;
      state.errorMessage = error;
      state.failedNodes.push({
        nodeId,
        error,
        timestamp: new Date()
      });

      await this.updateExecutionInDB(executionId, 'error', error);
      await this.updateExecutionData(executionId, {
        failedNodeId: nodeId,
        failedNodes: state.failedNodes,
        canResume: true
      });

      console.error(`Node ${nodeId} failed after ${maxRetries} retries: ${error}`);
    }
  }

  // Execute node with retry wrapper
  private async executeNodeWithRetry(
    node: any,
    data: any,
    metadata: WorkflowMessage['metadata']
  ): Promise<NodeExecutionResult> {
    try {
      return await this.executeNode(node, data);
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Execute a node based on its type
  async executeNode(node: any, inputData: any): Promise<NodeExecutionResult> {
    const parameters = JSON.parse(node.parameters);

    switch (node.type) {
      case 'webhook':
        return this.executeWebhookNode(parameters, inputData);
      
      case 'httpRequest':
        return this.executeHttpRequestNode(parameters, inputData);
      
      case 'delay':
        return this.executeDelayNode(parameters, inputData);
      
      case 'condition':
        return this.executeConditionNode(parameters, inputData);
      
      case 'dataTransform':
        return this.executeDataTransformNode(parameters, inputData);
      
      case 'subflow':
        return this.executeSubflowNode(node, inputData);
      
      default:
        return {
          success: false,
          error: `Unknown node type: ${node.type}`
        };
    }
  }

  // Node execution implementations
  async executeWebhookNode(parameters: any, inputData: any): Promise<NodeExecutionResult> {
    // Webhook nodes are typically triggers, so they pass data through
    return {
      success: true,
      data: inputData
    };
  }

  async executeHttpRequestNode(parameters: any, inputData: any): Promise<NodeExecutionResult> {
    try {
      const { method, url, headers, body } = parameters;
      
      const response = await fetch(url, {
        method: method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined
      });

      const responseData = await response.json();

      return {
        success: response.ok,
        data: {
          ...inputData,
          httpResponse: responseData,
          statusCode: response.status
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async executeDelayNode(parameters: any, inputData: any): Promise<NodeExecutionResult> {
    const { delayMs } = parameters;
    await new Promise(resolve => setTimeout(resolve, delayMs || 1000));
    
    return {
      success: true,
      data: inputData
    };
  }

  async executeConditionNode(parameters: any, inputData: any): Promise<NodeExecutionResult> {
    const { condition, trueNodeId, falseNodeId } = parameters;
    
    // Simple condition evaluation (you can make this more sophisticated)
    const conditionResult = this.evaluateCondition(condition, inputData);
    
    return {
      success: true,
      data: inputData,
      nextNodes: conditionResult ? [{ nodeId: trueNodeId, outputIndex: 0 }] : [{ nodeId: falseNodeId, outputIndex: 1 }]
    };
  }

  async executeDataTransformNode(parameters: any, inputData: any): Promise<NodeExecutionResult> {
    try {
      const { transformScript } = parameters;
      
      // Simple data transformation using eval (in production, use a safer approach)
      const transformedData = new Function('data', transformScript)(inputData);
      
      return {
        success: true,
        data: transformedData
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async executeSubflowNode(node: any, inputData: any): Promise<NodeExecutionResult> {
    if (!node.subWorkflowId) {
      return {
        success: false,
        error: 'No subworkflow specified'
      };
    }

    // Trigger the subworkflow
    await this.startWorkflowExecution(node.subWorkflowId, inputData);
    
    return {
      success: true,
      data: inputData
    };
  }

  // Helper methods
  private async getNextNodes(
    nodeId: string,
    customNextNodes?: { nodeId: string; outputIndex: number }[]
  ): Promise<{ nodeId: string; outputIndex: number }[]> {
    if (customNextNodes) {
      return customNextNodes;
    }

    const nextConnections = await db.select({
      toNodeId: connections.toNodeId,
      outputIndex: connections.outputIndex
    })
    .from(connections)
    .where(eq(connections.fromNodeId, nodeId));

    return nextConnections.map(conn => ({
      nodeId: conn.toNodeId,
      outputIndex: conn.outputIndex || 0
    }));
  }

  // Get trigger nodes (nodes with no incoming connections)
  private async getTriggerNodes(workflowId: string) {
    const allNodes = await db.select()
      .from(nodes)
      .where(eq(nodes.workflowId, workflowId));

    const nodesWithIncoming = await db.select({
      toNodeId: connections.toNodeId
    }).from(connections)
    .innerJoin(nodes, eq(nodes.id, connections.toNodeId))
    .where(eq(nodes.workflowId, workflowId));

    const incomingNodeIds = new Set(nodesWithIncoming.map(n => n.toNodeId));
    return allNodes.filter(node => !incomingNodeIds.has(node.id));
  }

  // Trigger node execution
  private async triggerNode(
    executionId: string,
    workflowId: string,
    nodeId: string,
    data: any,
    outputIndex = 0,
    retryCount = 0
  ) {
    const message: WorkflowMessage = {
      executionId,
      workflowId,
      nodeId,
      data,
      metadata: {
        timestamp: Date.now(),
        attempt: 1,
        connectionOutputIndex: outputIndex,
        retryCount,
        maxRetries: 3
      }
    };

    await this.producer.send({
      topic: process.env.NEXT_PUBLIC_TOPIC || "Workflowmainvk",
      messages: [{
        key: `${workflowId}-${nodeId}`,
        value: JSON.stringify(message),
        partition: this.getPartitionForWorkflow(workflowId)
      }]
    });
  }

  // Get partition for workflow (for better distribution)
  private getPartitionForWorkflow(workflowId: string): number {
    return Math.abs(workflowId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 3;
  }

  // Update execution in database
  private async updateExecutionInDB(executionId: string, status: string, error?: string) {
    await db.update(executions)
      .set({
        status,
        error,
        finishedAt: status === 'success' || status === 'error' ? new Date() : null
      })
      .where(eq(executions.id, executionId));
  }

  // Update execution data
  private async updateExecutionData(executionId: string, additionalData: any) {
    const execution = await db.select()
      .from(executions)
      .where(eq(executions.id, executionId))
      .then(rows => rows[0]);

    if (execution) {
      const currentData = execution.data ? JSON.parse(execution.data) : {};
      const updatedData = { ...currentData, ...additionalData };

      await db.update(executions)
        .set({ data: JSON.stringify(updatedData) })
        .where(eq(executions.id, executionId));
    }
  }

  // Get execution graph for visualization
  async getExecutionGraph(executionId: string) {
    const state = this.executionStates.get(executionId);
    const execution = await db.select()
      .from(executions)
      .where(eq(executions.id, executionId))
      .then(rows => rows[0]);

    if (!execution) throw new Error('Execution not found');

    // Get all nodes in the workflow
    const workflowNodes = await db.select()
      .from(nodes)
      .where(eq(nodes.workflowId, execution.workflowId));

    // Get all connections
    const workflowConnections = await db.select()
      .from(connections)
      .innerJoin(nodes, eq(nodes.id, connections.fromNodeId))
      .where(eq(nodes.workflowId, execution.workflowId));

    return {
      execution: {
        ...execution,
        data: execution.data ? JSON.parse(execution.data) : null
      },
      state: state || null,
      nodes: workflowNodes.map(node => ({
        ...node,
        status: state?.completedNodes.includes(node.id) ? 'completed' :
                state?.failedNodes.some(f => f.nodeId === node.id) ? 'failed' :
                state?.currentNodeId === node.id ? 'running' : 'pending',
        position: JSON.parse(node.position)
      })),
      connections: workflowConnections
    };
  }

  // Test single node execution
  async testNodeExecution(nodeId: string, testData: any = {}) {
    const node = await db.select()
      .from(nodes)
      .where(eq(nodes.id, nodeId))
      .then(rows => rows[0]);

    if (!node) {
      throw new Error('Node not found');
    }

    try {
      const result = await this.executeNode(node, testData);
      return {
        success: true,
        result,
        node: {
          ...node,
          parameters: JSON.parse(node.parameters)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        node: {
          ...node,
          parameters: JSON.parse(node.parameters)
        }
      };
    }
  }

  // Start workflow consumer
  private async startWorkflowConsumer(workflowId: string) {
    const consumer = this.kafka.consumer({
      groupId: `workflow-${workflowId}`,
    });

    await consumer.connect();
    await consumer.subscribe({ 
      topic: process.env.NEXT_PUBLIC_TOPIC || "Workflowmainvk" 
    });

    await consumer.run({
      eachMessage: async ({ message }) => {
        try {
          const workflowMessage: WorkflowMessage = JSON.parse(message.value!.toString());
          
          if (workflowMessage.workflowId === workflowId) {
            await this.processNode(workflowMessage);
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      },
    });

    this.consumers.set(workflowId, consumer);
  }

  // Activate workflow
  async activateWorkflow(workflowId: string) {
    await db.update(workflows)
      .set({ active: true })
      .where(eq(workflows.id, workflowId));

    if (!this.consumers.has(workflowId)) {
      await this.startWorkflowConsumer(workflowId);
    }
  }

  // Deactivate workflow
  async deactivateWorkflow(workflowId: string) {
    await db.update(workflows)
      .set({ active: false })
      .where(eq(workflows.id, workflowId));

    const consumer = this.consumers.get(workflowId);
    if (consumer) {
      await consumer.disconnect();
      this.consumers.delete(workflowId);
    }
  }

  // Start all active workflows
  async startActiveWorkflows() {
    const activeWorkflows = await db.select()
      .from(workflows)
      .where(eq(workflows.active, true));

    console.log(`Starting ${activeWorkflows.length} active workflows...`);

    for (const workflow of activeWorkflows) {
      try {
        await this.startWorkflowConsumer(workflow.id);
        console.log(`✅ Started consumer for workflow: ${workflow.name} (${workflow.id})`);
      } catch (error) {
        console.error(`❌ Failed to start consumer for workflow ${workflow.id}:`, error);
      }
    }
  }

  // Shutdown
  async shutdown() {
    console.log('Shutting down workflow engine...');
    
    // Disconnect all consumers
    for (const [workflowId, consumer] of this.consumers.entries()) {
      try {
        await consumer.disconnect();
        console.log(`Disconnected consumer for workflow: ${workflowId}`);
      } catch (error) {
        console.error(`Error disconnecting consumer for ${workflowId}:`, error);
      }
    }
    this.consumers.clear();
    
    // Disconnect producer
    if (this.producer) {
      try {
        await this.producer.disconnect();
        console.log('Producer disconnected');
      } catch (error) {
        console.error('Error disconnecting producer:', error);
      }
    }
    
    // Mark running executions as paused for resumability
    const runningExecutions = Array.from(this.executionStates.values())
      .filter(state => state.status === 'running');
    
    for (const execution of runningExecutions) {
      try {
        execution.status = 'paused';
        execution.canResume = true;
        execution.pausedAt = new Date();
        await this.updateExecutionInDB(execution.id, 'paused');
      } catch (error) {
        console.error(`Error pausing execution ${execution.id}:`, error);
      }
    }
    
    console.log('Workflow engine shutdown complete');
  }

  private evaluateCondition(condition: string, data: any): boolean {
    try {
      return new Function('data', `return ${condition}`)(data);
    } catch {
      return false;
    }
  }
}

// Create and export the singleton instance
export const workflowEngine = new WorkflowEngine();