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
import { getSchedulerService } from './SchedulerService';

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
        .from(workflows)
        .where(eq(workflows.flowStatus, 'RUNNING'));

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

  async startWorkflow(workflowId: string) {
    console.log(`🚀 Starting workflow execution: ${workflowId}`);

    // Get workflow to retrieve userId for scheduler
    const workflow = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, workflowId))
      .limit(1);

    if (!workflow.length) {
      throw new Error('Workflow not found');
    }

    const userId = workflow[0].userId;

    // 1. Update status in DB
    await db.update(workflows)
      .set({ flowStatus: 'RUNNING' })
      .where(eq(workflows.id, workflowId));

    // 2. Initialize consumer
    await this.initializeWorkflowConsumer(workflowId);

    // 3. Start scheduler if SCHEDULE node exists
    const schedulerService = getSchedulerService();
    await schedulerService.startScheduler(workflowId, userId);

    console.log(`✅ Workflow ${workflowId} started`);
  }

  async stopWorkflow(workflowId: string) {
    console.log(`🛑 Stopping workflow execution: ${workflowId}`);

    // 1. Update status in DB
    await db.update(workflows)
      .set({ flowStatus: 'DRAFT' })
      .where(eq(workflows.id, workflowId));

    // 2. Remove consumer
    const triggerTopic = `workflow.${workflowId}.trigger`;
    await this.kafkaService.removeConsumer(
      `workflow-executor-${workflowId}`,
      [triggerTopic]
    );

    this.consumerInitialized.delete(workflowId);

    // 3. Stop scheduler
    const schedulerService = getSchedulerService();
    schedulerService.stopScheduler(workflowId);

    console.log(`✅ Workflow ${workflowId} stopped`);
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
          let message: any;
          try {
            console.log(`\n📨 Received message from topic: ${triggerTopic}`);
            message = JSON.parse(payload.message.value?.toString() || '{}');
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
        // Fix mode type
        mode: mode as 'production' | 'test',
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
      mode: 'production' | 'test';
      triggerData: any;
    }
  ) {
    const { nodeMap, adjacencyList, connections } = graph;
    const { workflowId, executionId, userId, mode, triggerData } = executionContext;

    const executedNodes = new Set<string>();
    const nodeOutputs = new Map<string, any>();
    const queue: Array<{ nodeId: string; inputData: any; depth: number }> = [
      { nodeId: startNodeId, inputData: triggerData, depth: 0 }
    ];

    let executionOrder = 1;
    console.log('\n🎯 Starting graph traversal...\n');
    if (connections.length > 0) {
      console.log('🔍 Debug: First connection keys:', Object.keys(connections[0]));
    }

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
      console.log(`${indent}   📥 Input:`, (JSON.stringify(inputData, null, 2) || '{}').split('\n').join(`\n${indent}      `));

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

        console.log(`${indent}   📤 Output:`, (JSON.stringify(result.data, null, 2) || '{}').split('\n').join(`\n${indent}      `));
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
          // Find the specific connection to determine which handle (port) it came from
          // Find the specific connection to determine which handle (port) it came from
          const connection = connections.find(c => {
            const source = c.sourceNodeId || (c as any).source_node_id;
            const target = c.targetNodeId || (c as any).target_node_id;
            return source === nodeId && target === nextNodeId;
          });

          let nextInput = result.data;

          if (connection) {
            console.log(`${indent}   🔗 Connection Found: ${connection.id}`);
            const fromOutput = connection.fromOutput || (connection as any).from_output;
            console.log(`${indent}      Source Handle: ${fromOutput || '(default)'}`);

            if (fromOutput) {
              const sourceHandle = fromOutput;
              // Debug: Check if key exists
              const hasKey = result.data && typeof result.data === 'object' && sourceHandle in result.data;
              console.log(`${indent}      Output Keys: ${Object.keys(result.data || {}).join(', ')}`);
              console.log(`${indent}      Key match found: ${hasKey}`);

              if (hasKey) {
                nextInput = result.data[sourceHandle];
                console.log(`${indent}   🔀 Routing via handle "${sourceHandle}":`, Array.isArray(nextInput) ? `Array(${nextInput.length})` : typeof nextInput);
              } else {
                // Fallback check: maybe handle has prefix?
                // e.g. handle is "source-true", key is "true"
                // OR handle is "true", key is "passed" (if user mapped it?)
              }
            }
          } else {
            console.warn(`${indent}   ⚠️ No connection metadata found for ${nodeId} -> ${nextNodeId}`);
          }

          queue.push({
            nodeId: nextNodeId,
            inputData: nextInput,
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
    // Correct mode type passed to context previously, but here just passing complete context
    await this.hooksService.completeWorkflow({ ...executionContext, mode: executionContext.mode as 'production' | 'test' }, finalOutput);
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
    this.consumerInitialized.clear();
    this.initializationLocks.clear();
  }

  async executeWorkflowFromNode(
    workflowId: string,
    userId: string,
    nodeId: string,
    mode: 'production' | 'test' = 'test'
  ) {
    console.log(`\n🎯 Executing workflow FROM node: ${nodeId} (Workflow: ${workflowId})`);

    // 1. Get workflow and node details
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

    if (!workflow.length) throw new Error('Workflow not found or access denied');

    const node = await db
      .select()
      .from(buildNodes)
      .where(
        and(
          eq(buildNodes.id, nodeId),
          eq(buildNodes.workflowId, workflowId)
        )
      )
      .limit(1);

    if (!node.length) throw new Error('Node not found');
    const targetNode = node[0];

    // 2. Find latest workflow execution to get context/inputs
    const latestExecution = await db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.workflowId, workflowId))
      .orderBy(desc(workflowExecutions.createdAt))
      .limit(1);

    let previousExecutionId: string | undefined;

    if (latestExecution.length) {
      previousExecutionId = latestExecution[0].id;
      console.log(`   Detailed Context from previous execution: ${previousExecutionId}`);
    }

    // 3. Resolve Input Data from Parents (from PREVIOUS execution)
    const incomingConnections = await db
      .select()
      .from(nodeConnections)
      .where(eq(nodeConnections.targetNodeId, nodeId));

    let inputData: any = {};
    let resolvedFromHistory = false;

    if (incomingConnections.length > 0 && previousExecutionId) {
      const sourceNodeIds = incomingConnections.map(c => c.sourceNodeId);

      const parentExecutions = await db
        .select()
        .from(nodeExecutions)
        .where(
          and(
            eq(nodeExecutions.workflowExecutionId, previousExecutionId),
            inArray(nodeExecutions.nodeId, sourceNodeIds)
          )
        );

      for (const conn of incomingConnections) {
        const parentExec = parentExecutions.find(pe => pe.nodeId === conn.sourceNodeId);
        if (parentExec && parentExec.outputData) {
          resolvedFromHistory = true;
          const output = parentExec.outputData as any;
          if (conn.fromOutput && output[conn.fromOutput]) {
            if (typeof output[conn.fromOutput] === 'object') {
              inputData = { ...inputData, ...output[conn.fromOutput] };
            } else {
              inputData = output[conn.fromOutput];
            }
          } else {
            inputData = { ...inputData, ...output };
          }
        }
      }
    } else {
      // If no parents (Trigger node?), use previous triggerData or empty
      if ((targetNode.types === 'MANUAL' || targetNode.types === 'WEBHOOK') && latestExecution.length) {
        inputData = latestExecution[0].triggerData;
        resolvedFromHistory = true;
      }
    }

    console.log(`   📥 Resolved Input Data (History: ${resolvedFromHistory}):`, JSON.stringify(inputData).substring(0, 200));

    // 4. Create NEW Partial Execution Record
    const [execution] = await db
      .insert(workflowExecutions)
      .values({
        workflowId,
        status: 'PENDING',
        triggerData: inputData, // Use resolved input as trigger data for this partial run? Or keep original? 
        // Actually, for partial run, the "trigger" is effectively this node's input.
        mode,
        startedAt: new Date()
      })
      .returning();

    console.log(`   🚀 Created NEW Partial Execution: ${execution.id}`);

    // 5. Build Graph
    const nodes = await db
      .select()
      .from(buildNodes)
      .where(eq(buildNodes.workflowId, workflowId))
      .orderBy(buildNodes.createdAt);

    const connections = await db
      .select()
      .from(nodeConnections)
      .where(eq(nodeConnections.sourceNodeId, nodeId) /* optimization? no, need full graph for traversal? */);
    // Wait, we need FULL graph interactions for traversal to work downstream. 
    // But we can just fetch all connections for safety.

    // Better fetch ALL connections for this workflow
    const allConnections = await db
      .select()
      .from(nodeConnections)
      .where(
        or(
          inArray(nodeConnections.sourceNodeId, nodes.map(n => n.id)),
          inArray(nodeConnections.targetNodeId, nodes.map(n => n.id))
        )
      );

    const graph = this.buildGraph(nodes as any[], allConnections as any[]);

    // 6. Execute Traversal STARTING from this node
    // Pass the resolved inputData as the "triggerData" or initial input for the start node
    await this.executeGraphTraversal(
      nodeId,
      graph,
      {
        workflowId,
        executionId: execution.id,
        userId,
        mode,
        triggerData: inputData // This will be used as input for the startNodeId (targetNode)
      }
    );

    await this.updateExecutionStatus(execution.id, 'SUCCESS');

    return {
      success: true,
      executionId: execution.id,
      message: 'Workflow execution completed successfully'
    };
  }

  async clearNodeExecution(
    workflowId: string,
    userId: string,
    nodeId: string
  ) {
    // 1. Get latest execution
    const executions = await db.select({ id: workflowExecutions.id })
      .from(workflowExecutions)
      .innerJoin(workflows, eq(workflowExecutions.workflowId, workflows.id))
      .where(
        and(
          eq(workflows.id, workflowId),
          eq(workflows.userId, userId)
        )
      )
      .orderBy(desc(workflowExecutions.createdAt))
      .limit(1);

    if (!executions.length) return { success: false, message: 'No execution found' };

    const executionId = executions[0].id;

    // 2. Delete node execution for this node in the latest workflow execution
    await db.delete(nodeExecutions)
      .where(
        and(
          eq(nodeExecutions.workflowExecutionId, executionId),
          eq(nodeExecutions.nodeId, nodeId)
        )
      );

    return { success: true };
  }
}

export function getWorkflowExecutionService(): WorkflowExecutionService {
  return WorkflowExecutionService.getInstance();
}