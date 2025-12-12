// src/services/WorkflowExecutionService.ts (Enhanced with Node Execution Tracking)
import { db } from '@/db';
import { 
  workflowExecutions, 
  executionLogs, 
  workflows, 
  buildNodes, 
  nodeConnections,
  nodeExecutions // IMPORTANT: Track each node execution
} from '@/db/schema';
import { eq, and, desc, or } from 'drizzle-orm';
import { KafkaService } from './kafkaservice';
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
  private kafkaService: KafkaService;
  private hooksService: WorkflowHooksService;
  private consumerInitialized: Set<string> = new Set();
  
  constructor() {
    this.kafkaService = new KafkaService();
    this.hooksService = new WorkflowHooksService(this.kafkaService);
  }

  async triggerWorkflow(
    workflowId: string, 
    userId: string, 
    triggerData: any = {}, 
    mode: 'production' | 'test' = 'test'
  ) {
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

    // Find the start node
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

    // Create execution record
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

    // Create topics
    const triggerTopic = `workflow.${workflowId}.trigger`;
    await this.kafkaService.createTopic(triggerTopic);

    // Initialize consumer once per workflow
    if (!this.consumerInitialized.has(workflowId)) {
      await this.initializeWorkflowConsumer(workflowId);
      this.consumerInitialized.add(workflowId);
    }

    // Send trigger message
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

    // Log the trigger
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

    return execution;
  }

  private async initializeWorkflowConsumer(workflowId: string) {
    await this.kafkaService.createConsumer(
      `workflow-executor-${workflowId}`,
      [`workflow.${workflowId}.trigger`],
      async (payload) => {
        try {
          const message = JSON.parse(payload.message.value?.toString() || '{}');
          await this.executeWorkflow(message);
        } catch (error: any) {
          console.error('Workflow execution error:', error);
          if (message?.executionId) {
            await this.updateExecutionStatus(message.executionId, 'FAILED', error.message);
          }
        }
      }
    );
    
    console.log(`✅ Initialized consumer for workflow: ${workflowId}`);
  }

  private async executeWorkflow(message: any) {
    const { workflowId, executionId, userId, mode, triggerData } = message;
    const startNodeId = triggerData?.startNodeId;

    if (!startNodeId) {
      throw new Error('No start node specified in trigger data');
    }

    // Load workflow graph
    const nodes = await db
      .select()
      .from(buildNodes)
      .where(eq(buildNodes.workflowId, workflowId));

    const connections = await db
      .select()
      .from(nodeConnections)
      .where(
        or(
          ...nodes.map(n => eq(nodeConnections.sourceNodeId, n.id))
        )
      );

    if (!nodes.length) {
      await this.updateExecutionStatus(executionId, 'FAILED', 'No nodes found');
      return;
    }

    // Log workflow graph structure
    await db.insert(executionLogs).values({
      workflowExecutionId: executionId,
      level: 'INFO',
      message: `📊 Workflow graph loaded: ${nodes.length} nodes, ${connections.length} connections`,
      metadata: { 
        totalNodes: nodes.length,
        totalConnections: connections.length,
        nodeNames: nodes.map(n => n.name)
      }
    });

    // Build adjacency list for graph traversal
    const graph = this.buildGraph(nodes as WorkflowNode[], connections as NodeConnection[]);
    
    // Execute nodes following the graph
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

    // Queue for BFS traversal
    const queue: Array<{ nodeId: string; inputData: any; depth: number }> = [
      { nodeId: startNodeId, inputData: triggerData, depth: 0 }
    ];

    let executionOrder = 1;

    while (queue.length > 0) {
      const { nodeId, inputData, depth } = queue.shift()!;

      if (executedNodes.has(nodeId)) {
        continue;
      }

      const node = nodeMap.get(nodeId);
      if (!node) {
        console.warn(`⚠️ Node ${nodeId} not found in graph`);
        continue;
      }

      const startTime = Date.now();

      // Create node execution record BEFORE execution
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

      // Log node start
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

      console.log(`\n${'  '.repeat(depth)}▶️ [${executionOrder}] ${node.name} (${node.types})`);
      console.log(`${'  '.repeat(depth)}   Input:`, JSON.stringify(inputData, null, 2));

      try {
        // Execute the node
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

        const result = await this.hooksService.executeNode(context, inputData);
        const executionTime = Date.now() - startTime;
        
        if (!result.success) {
          // Log failure
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

          await this.updateExecutionStatus(executionId, 'FAILED', result.error);
          return;
        }

        // Update node execution with success
        await db.update(nodeExecutions)
          .set({
            status: 'SUCCESS',
            outputData: result.data || {},
            finishedAt: new Date(),
            executionTime
          })
          .where(eq(nodeExecutions.id, nodeExecution.id));

        // Store output
        nodeOutputs.set(nodeId, result.data);
        executedNodes.add(nodeId);

        console.log(`${'  '.repeat(depth)}   Output:`, JSON.stringify(result.data, null, 2));
        console.log(`${'  '.repeat(depth)}   ✅ Completed in ${executionTime}ms`);

        // Log success with input/output chain
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

        // Get next nodes
        const nextNodeIds = adjacencyList.get(nodeId) || [];
        
        if (nextNodeIds.length === 0) {
          // End node reached
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
          // Log data passing to next nodes
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

        // Queue connected nodes with current output as their input
        for (const nextNodeId of nextNodeIds) {
          const nextNode = nodeMap.get(nextNodeId);
          console.log(`${'  '.repeat(depth)}   ➡️ Next: ${nextNode?.name}`);
          
          queue.push({
            nodeId: nextNodeId,
            inputData: result.data, // 🔥 OUTPUT becomes INPUT
            depth: depth + 1
          });
        }

        executionOrder++;

      } catch (error: any) {
        const executionTime = Date.now() - startTime;
        
        console.error(`${'  '.repeat(depth)}   ❌ Error:`, error.message);

        // Update node execution with error
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

    // Workflow complete - log summary
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

    // Get executions with node execution details
    const executions = await db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.workflowId, workflowId))
      .orderBy(desc(workflowExecutions.createdAt))
      .limit(limit);

    return executions;
  }

  async getExecutionDetails(executionId: string, userId: string) {
    // Verify access
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

    // Get all node executions with input/output
    const nodeExecs = await db
      .select({
        nodeExecution: nodeExecutions,
        node: buildNodes
      })
      .from(nodeExecutions)
      .innerJoin(buildNodes, eq(nodeExecutions.nodeId, buildNodes.id))
      .where(eq(nodeExecutions.workflowExecutionId, executionId))
      .orderBy(nodeExecutions.startedAt);

    // Get all logs
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
  }
}