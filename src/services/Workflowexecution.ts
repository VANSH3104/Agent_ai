// src/services/WorkflowExecutionService.ts (COMPLETELY FIXED - No Multiple Consumers)
import { db } from '@/db';
import { 
  workflowExecutions, 
  executionLogs, 
  workflows, 
  buildNodes, 
  nodeConnections,
  nodeExecutions
} from '@/db/schema';
import { eq, and, desc, or, inArray } from 'drizzle-orm';
import { getKafkaService } from './kafkaservice';
import { NodeContext, WorkflowHooksService } from './workflowhooks';

interface WorkflowNode {
  id: string;
  name: string;
  types: string;
  data: any;
  position: any;
}

interface NodeConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  fromOutput: string | null;
  toInput: string | null;
}

export class WorkflowExecutionService {
  private static instance: WorkflowExecutionService | null = null;
  private kafkaService: ReturnType<typeof getKafkaService>;
  private hooksService: WorkflowHooksService;
  private consumerInitialized: Set<string> = new Set();
  private initializationLocks: Map<string, Promise<void>> = new Map();
  
  private constructor() {
    this.kafkaService = getKafkaService();
    this.hooksService = new WorkflowHooksService(this.kafkaService);
    
    // Start consumer initialization on service creation
    this.initializeAllWorkflowConsumers();
  }

  static getInstance(): WorkflowExecutionService {
    if (!WorkflowExecutionService.instance) {
      WorkflowExecutionService.instance = new WorkflowExecutionService();
    }
    return WorkflowExecutionService.instance;
  }

  // Initialize consumers for all workflows on startup
  private async initializeAllWorkflowConsumers() {
    try {
      // Get all unique workflow IDs
      const allWorkflows = await db
        .select({ id: workflows.id })
        .from(workflows);

      console.log(`🔄 Initializing consumers for ${allWorkflows.length} workflows...`);

      for (const workflow of allWorkflows) {
        if (!this.consumerInitialized.has(workflow.id)) {
          await this.initializeWorkflowConsumer(workflow.id);
        }
      }

      console.log(`✅ All workflow consumers initialized`);
    } catch (error: any) {
      console.error('❌ Error initializing workflow consumers:', error.message);
    }
  }

  async triggerWorkflow(
    workflowId: string, 
    userId: string, 
    triggerData: any = {}, 
    mode: 'production' | 'test' = 'test'
  ) {
    console.log(`\n🚀 Triggering workflow: ${workflowId}`);
    
    const workflow = await db
      .select()
      .from(workflows)
      .where(
        and(
          eq(workflows.id, workflowId),
          eq(workflows.userId, userId)
        )
      )
      .limit(1);

    if (!workflow.length) {
      throw new Error('Workflow not found or access denied');
    }

    const startNode = await db
      .select()
      .from(buildNodes)
      .where(
        and(
          eq(buildNodes.workflowId, workflowId),
          or(
            eq(buildNodes.types, 'MANUAL'),
            eq(buildNodes.types, 'WEBHOOK'),
            eq(buildNodes.types, 'SCHEDULE'),
            eq(buildNodes.types, 'INITIAL')
          )
        )
      )
      .limit(1);

    if (!startNode.length) {
      throw new Error('No trigger node found in workflow');
    }

    console.log(`✓ Found start node: ${startNode[0].name} (${startNode[0].id})`);

    const [execution] = await db
      .insert(workflowExecutions)
      .values({
        workflowId,
        status: 'PENDING',
        triggerData: {
          ...triggerData,
          startNodeId: startNode[0].id
        },
        mode,
        startedAt: new Date()
      })
      .returning();

    if (!execution) {
      throw new Error('Failed to create workflow execution');
    }

    console.log(`✓ Created execution: ${execution.id}`);

    const triggerTopic = `workflow.${workflowId}.trigger`;
    await this.kafkaService.createTopic(triggerTopic, 3);

    // CRITICAL FIX: Only initialize consumer if not already done
    // Use locking to prevent race conditions
    if (!this.consumerInitialized.has(workflowId)) {
      // Check if initialization is in progress
      let initPromise = this.initializationLocks.get(workflowId);
      
      if (!initPromise) {
        // Start initialization
        initPromise = this.initializeWorkflowConsumer(workflowId);
        this.initializationLocks.set(workflowId, initPromise);
        
        try {
          await initPromise;
        } finally {
          this.initializationLocks.delete(workflowId);
        }
      } else {
        // Wait for ongoing initialization
        console.log(`⏳ Waiting for consumer initialization to complete...`);
        await initPromise;
      }
    }

    console.log(`📤 Sending trigger message to topic: ${triggerTopic}`);
    await this.kafkaService.sendMessage(triggerTopic, execution.id, {
      workflowId,
      userId,
      executionId: execution.id,
      triggerData: {
        ...triggerData,
        startNodeId: startNode[0].id
      },
      mode,
      timestamp: new Date().toISOString()
    });

    await db
      .insert(executionLogs)
      .values({
        workflowExecutionId: execution.id,
        level: 'INFO',
        message: `🚀 Workflow execution started from node: ${startNode[0].name}`,
        metadata: { 
          triggerData,
          startNodeId: startNode[0].id,
          startNodeType: startNode[0].types
        }
      });

    console.log(`✅ Workflow triggered successfully\n`);
    return execution;
  }

  private async initializeWorkflowConsumer(workflowId: string) {
    // Double-check to prevent duplicates
    if (this.consumerInitialized.has(workflowId)) {
      console.log(`✓ Consumer already initialized for: ${workflowId}`);
      return;
    }

    const triggerTopic = `workflow.${workflowId}.trigger`;
    
    try {
      console.log(`⚙️ Initializing consumer for workflow: ${workflowId}`);
      
      await this.kafkaService.createConsumer(
        `workflow-executor-${workflowId}`,
        [triggerTopic],
        async (payload) => {
          try {
            console.log(`\n📨 Received message from topic: ${triggerTopic}`);
            const message = JSON.parse(payload.message.value?.toString() || '{}');
            console.log(`📋 Execution ID: ${message.executionId}`);
            
            await this.executeWorkflow(message);
          } catch (error: any) {
            console.error('❌ Workflow execution error:', error.message);
            if (message?.executionId) {
              await this.updateExecutionStatus(message.executionId, 'FAILED', error.message);
            }
          }
        }
      );
      
      // Mark as initialized AFTER successful creation
      this.consumerInitialized.add(workflowId);
      console.log(`✅ Consumer initialized for workflow: ${workflowId}`);
    } catch (error: any) {
      console.error(`❌ Failed to initialize consumer for ${workflowId}:`, error.message);
      throw error;
    }
  }

  private async executeWorkflow(message: any) {
    const { workflowId, executionId, userId, mode, triggerData } = message;
    const startNodeId = triggerData?.startNodeId;

    console.log(`\n🔄 Executing workflow: ${workflowId}`);
    console.log(`   Execution ID: ${executionId}`);
    console.log(`   Start Node: ${startNodeId}`);

    if (!startNodeId) {
      throw new Error('No start node specified in trigger data');
    }

    const nodes = await db
      .select()
      .from(buildNodes)
      .where(eq(buildNodes.workflowId, workflowId))
      .orderBy(buildNodes.createdAt);

    console.log(`✓ Loaded ${nodes.length} nodes`);

    if (!nodes.length) {
      await this.updateExecutionStatus(executionId, 'FAILED', 'No nodes found');
      throw new Error('No nodes found in workflow');
    }

    const nodeIds = nodes.map(n => n.id);
    const connections = await db
      .select()
      .from(nodeConnections)
      .where(
        or(
          inArray(nodeConnections.sourceNodeId, nodeIds),
          inArray(nodeConnections.targetNodeId, nodeIds)
        )
      );

    console.log(`✓ Loaded ${connections.length} connections`);

    await db.insert(executionLogs).values({
      workflowExecutionId: executionId,
      level: 'INFO',
      message: `📊 Workflow graph loaded: ${nodes.length} nodes, ${connections.length} connections`,
      metadata: { 
        totalNodes: nodes.length,
        totalConnections: connections.length,
        nodeNames: nodes.map(n => ({ id: n.id, name: n.name, type: n.types }))
      }
    });

    const graph = this.buildGraph(nodes as WorkflowNode[], connections as NodeConnection[]);
    
    await this.executeGraphTraversal(
      startNodeId,
      graph,
      {
        workflowId,
        executionId,
        userId,
        mode,
        triggerData
      }
    );

    await this.updateExecutionStatus(executionId, 'SUCCESS');
    console.log(`\n✅ Workflow execution completed successfully`);
  }

  private buildGraph(nodes: WorkflowNode[], connections: NodeConnection[]) {
    const nodeMap = new Map<string, WorkflowNode>();
    const adjacencyList = new Map<string, string[]>();

    nodes.forEach(node => {
      nodeMap.set(node.id, node);
      adjacencyList.set(node.id, []);
    });

    connections.forEach(conn => {
      const targets = adjacencyList.get(conn.sourceNodeId) || [];
      targets.push(conn.targetNodeId);
      adjacencyList.set(conn.sourceNodeId, targets);
    });

    console.log('\n📊 Graph Structure:');
    adjacencyList.forEach((targets, sourceId) => {
      const sourceName = nodeMap.get(sourceId)?.name || sourceId;
      if (targets.length > 0) {
        targets.forEach(targetId => {
          const targetName = nodeMap.get(targetId)?.name || targetId;
          console.log(`   ${sourceName} → ${targetName}`);
        });
      }
    });

    return { nodeMap, adjacencyList, connections };
  }

  private async executeGraphTraversal(
    startNodeId: string,
    graph: {
      nodeMap: Map<string, WorkflowNode>;
      adjacencyList: Map<string, string[]>;
      connections: NodeConnection[];
    },
    executionContext: {
      workflowId: string;
      executionId: string;
      userId: string;
      mode: string;
      triggerData: any;
    }
  ) {
    const { nodeMap, adjacencyList } = graph;
    const { workflowId, executionId, userId, mode, triggerData } = executionContext;

    const executedNodes = new Set<string>();
    const nodeOutputs = new Map<string, any>();
    const queue: Array<{ nodeId: string; inputData: any; depth: number }> = [
      { nodeId: startNodeId, inputData: triggerData, depth: 0 }
    ];

    let executionOrder = 1;
    console.log('\n🎯 Starting graph traversal...\n');

    while (queue.length > 0) {
      const { nodeId, inputData, depth } = queue.shift()!;

      if (executedNodes.has(nodeId)) {
        console.log(`⏭️  Skipping already executed node: ${nodeId}`);
        continue;
      }

      const node = nodeMap.get(nodeId);
      if (!node) {
        console.warn(`⚠️  Node ${nodeId} not found in graph`);
        continue;
      }

      const startTime = Date.now();
      const indent = '  '.repeat(depth);

      console.log(`${indent}▶️  [${executionOrder}] ${node.name} (${node.types})`);
      console.log(`${indent}   📥 Input:`, JSON.stringify(inputData, null, 2).split('\n').join(`\n${indent}      `));

      const [nodeExecution] = await db
        .insert(nodeExecutions)
        .values({
          workflowExecutionId: executionId,
          nodeId: node.id,
          status: 'PENDING',
          inputData: inputData || {},
          startedAt: new Date(),
          retryAttempt: 0
        })
        .returning();

      await db.insert(executionLogs).values({
        workflowExecutionId: executionId,
        nodeExecutionId: nodeExecution.id,
        level: 'INFO',
        message: `▶️ [${executionOrder}] Executing: ${node.name} (${node.types})`,
        metadata: { 
          nodeId: node.id,
          nodeType: node.types,
          depth,
          executionOrder,
          inputData
        }
      });

      try {
        const context: NodeContext = {
          workflowId,
          executionId,
          userId,
          mode,
          triggerData,
          nodeId: node.id,
          nodeType: node.types,
          nodeData: node.data
        };

        // CRITICAL: Pass skipKafka flag to prevent hooks from sending to Kafka
        const result = await this.hooksService.executeNode(context, inputData, true);
        const executionTime = Date.now() - startTime;
        
        if (!result.success) {
          await db.update(nodeExecutions)
            .set({
              status: 'FAILED',
              error: result.error,
              finishedAt: new Date(),
              executionTime
            })
            .where(eq(nodeExecutions.id, nodeExecution.id));

          await db.insert(executionLogs).values({
            workflowExecutionId: executionId,
            nodeExecutionId: nodeExecution.id,
            level: 'ERROR',
            message: `❌ [${executionOrder}] Node ${node.name} FAILED: ${result.error}`,
            metadata: { 
              error: result.error,
              executionTime: `${executionTime}ms`,
              inputData
            }
          });

          console.log(`${indent}   ❌ FAILED: ${result.error}`);
          await this.updateExecutionStatus(executionId, 'FAILED', result.error);
          return;
        }

        await db.update(nodeExecutions)
          .set({
            status: 'SUCCESS',
            outputData: result.data || {},
            finishedAt: new Date(),
            executionTime
          })
          .where(eq(nodeExecutions.id, nodeExecution.id));

        nodeOutputs.set(nodeId, result.data);
        executedNodes.add(nodeId);

        console.log(`${indent}   📤 Output:`, JSON.stringify(result.data, null, 2).split('\n').join(`\n${indent}      `));
        console.log(`${indent}   ✅ Completed in ${executionTime}ms`);

        await db.insert(executionLogs).values({
          workflowExecutionId: executionId,
          nodeExecutionId: nodeExecution.id,
          level: 'INFO',
          message: `✅ [${executionOrder}] ${node.name} completed successfully`,
          metadata: { 
            executionTime: `${executionTime}ms`,
            inputData,
            outputData: result.data,
            dataFlow: {
              input: inputData,
              output: result.data,
              transformation: `${node.name} processed data`
            }
          }
        });

        const nextNodeIds = adjacencyList.get(nodeId) || [];
        
        if (nextNodeIds.length === 0) {
          console.log(`${indent}   🏁 End node reached`);
          await db.insert(executionLogs).values({
            workflowExecutionId: executionId,
            nodeExecutionId: nodeExecution.id,
            level: 'INFO',
            message: `🏁 End node reached: ${node.name}`,
            metadata: { 
              finalOutput: result.data,
              totalNodesExecuted: executedNodes.size
            }
          });
        } else {
          const nextNodeNames = nextNodeIds.map(id => nodeMap.get(id)?.name).join(', ');
          console.log(`${indent}   ➡️  Next: ${nextNodeNames}`);
          
          await db.insert(executionLogs).values({
            workflowExecutionId: executionId,
            nodeExecutionId: nodeExecution.id,
            level: 'INFO',
            message: `➡️ Passing output to ${nextNodeIds.length} connected node(s)`,
            metadata: { 
              outputData: result.data,
              nextNodes: nextNodeIds.map(id => {
                const nextNode = nodeMap.get(id);
                return { id, name: nextNode?.name, type: nextNode?.types };
              })
            }
          });
        }

        for (const nextNodeId of nextNodeIds) {
          queue.push({
            nodeId: nextNodeId,
            inputData: result.data,
            depth: depth + 1
          });
        }

        executionOrder++;

      } catch (error: any) {
        const executionTime = Date.now() - startTime;
        
        console.error(`${indent}   💥 Exception:`, error.message);

        await db.update(nodeExecutions)
          .set({
            status: 'FAILED',
            error: error.message,
            finishedAt: new Date(),
            executionTime
          })
          .where(eq(nodeExecutions.id, nodeExecution.id));

        await db.insert(executionLogs).values({
          workflowExecutionId: executionId,
          nodeExecutionId: nodeExecution.id,
          level: 'ERROR',
          message: `💥 [${executionOrder}] Exception in ${node.name}: ${error.message}`,
          metadata: { 
            error: error.message,
            stack: error.stack,
            executionTime: `${executionTime}ms`,
            inputData
          }
        });

        await this.updateExecutionStatus(executionId, 'FAILED', error.message);
        return;
      }
    }

    await db.insert(executionLogs).values({
      workflowExecutionId: executionId,
      level: 'INFO',
      message: `🎉 Workflow completed successfully`,
      metadata: { 
        totalNodesExecuted: executedNodes.size,
        executionOrder: executionOrder - 1,
        finalOutputs: Array.from(nodeOutputs.entries()).map(([nodeId, output]) => ({
          nodeId,
          nodeName: nodeMap.get(nodeId)?.name,
          output
        }))
      }
    });

    const finalOutput = Array.from(nodeOutputs.values()).pop();
    await this.hooksService.completeWorkflow(executionContext, finalOutput);
  }

  private async updateExecutionStatus(
    executionId: string, 
    status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'PAUSED' | 'CANCELLED' | 'WAITING',
    error?: string
  ) {
    await db
      .update(workflowExecutions)
      .set({ 
        status,
        error,
        finishedAt: status === 'SUCCESS' || status === 'FAILED' ? new Date() : undefined
      })
      .where(eq(workflowExecutions.id, executionId));
  }

  async getWorkflowExecutions(workflowId: string, userId: string, limit = 50) {
    const workflow = await db
      .select()
      .from(workflows)
      .where(
        and(
          eq(workflows.id, workflowId),
          eq(workflows.userId, userId)
        )
      )
      .limit(1);

    if (!workflow.length) {
      throw new Error('Workflow not found or access denied');
    }

    const executions = await db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.workflowId, workflowId))
      .orderBy(desc(workflowExecutions.createdAt))
      .limit(limit);

    return executions;
  }

  async getExecutionDetails(executionId: string, userId: string) {
    const execution = await db
      .select({
        execution: workflowExecutions,
        workflow: workflows
      })
      .from(workflowExecutions)
      .innerJoin(workflows, eq(workflowExecutions.workflowId, workflows.id))
      .where(
        and(
          eq(workflowExecutions.id, executionId),
          eq(workflows.userId, userId)
        )
      )
      .limit(1);

    if (!execution.length) {
      throw new Error('Execution not found or access denied');
    }

    const nodeExecs = await db
      .select({
        nodeExecution: nodeExecutions,
        node: buildNodes
      })
      .from(nodeExecutions)
      .innerJoin(buildNodes, eq(nodeExecutions.nodeId, buildNodes.id))
      .where(eq(nodeExecutions.workflowExecutionId, executionId))
      .orderBy(nodeExecutions.startedAt);

    const logs = await db
      .select()
      .from(executionLogs)
      .where(eq(executionLogs.workflowExecutionId, executionId))
      .orderBy(executionLogs.timestamp);

    return {
      execution: execution[0].execution,
      workflow: execution[0].workflow,
      nodeExecutions: nodeExecs,
      logs
    };
  }

  async getExecutionLogs(executionId: string, userId: string) {
    const execution = await db
      .select({
        execution: workflowExecutions,
        workflow: workflows
      })
      .from(workflowExecutions)
      .innerJoin(workflows, eq(workflowExecutions.workflowId, workflows.id))
      .where(
        and(
          eq(workflowExecutions.id, executionId),
          eq(workflows.userId, userId)
        )
      )
      .limit(1);

    if (!execution.length) {
      throw new Error('Execution not found or access denied');
    }

    const logs = await db
      .select()
      .from(executionLogs)
      .where(eq(executionLogs.workflowExecutionId, executionId))
      .orderBy(executionLogs.timestamp);

    return logs;
  }

  async cleanup() {
    await this.kafkaService.disconnect();
    this.consumerInitialized.clear();
    this.initializationLocks.clear();
  }
}

export function getWorkflowExecutionService(): WorkflowExecutionService {
  return WorkflowExecutionService.getInstance();
}