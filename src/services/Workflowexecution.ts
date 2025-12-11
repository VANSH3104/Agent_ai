// src/services/WorkflowExecutionService.ts (updated)
import { db } from '@/db';
import { workflowExecutions, executionLogs, workflows } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { KafkaService } from './kafkaservice';
import { NodeContext, WorkflowHooksService } from './workflowhooks';
import { useNodesMany } from '@/app/module/Agents/server/hooks/agentHook';


export class WorkflowExecutionService {
  private kafkaService: KafkaService;
  private hooksService: WorkflowHooksService;
  
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
    // Verify workflow belongs to user
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

    // Create execution record
    const [execution] = await db
      .insert(workflowExecutions)
      .values({
        workflowId,
        status: 'PENDING',
        triggerData,
        mode
      })
      .returning();

    if (!execution) {
      throw new Error('Failed to create workflow execution');
    }

    // Create topics
    const triggerTopic = `workflow.${workflowId}.trigger`;
    await this.kafkaService.createTopic(triggerTopic);

    // Send trigger message
    await this.kafkaService.sendMessage(triggerTopic, execution.id, {
      workflowId,
      userId,
      executionId: execution.id,
      triggerData,
      mode,
      timestamp: new Date().toISOString()
    });

    // Start workflow execution listener
    await this.startWorkflowExecutionListener(workflowId, execution.id, userId);

    // Log the trigger
    await db
      .insert(executionLogs)
      .values({
        workflowExecutionId: execution.id,
        level: 'INFO',
        message: `Workflow triggered in ${mode} mode`,
        metadata: { triggerData }
      });

    return execution;
  }

  private async startWorkflowExecutionListener(workflowId: string, executionId: string, userId: string) {
    // Create consumer for workflow execution
    await this.kafkaService.createConsumer(
      `workflow-execution-${workflowId}`,
      [`workflow.${workflowId}.trigger`],
      async (payload) => {
        try {
          const message = JSON.parse(payload.message.value?.toString() || '{}');
          
          if (message.executionId === executionId) {
            // Get workflow nodes
            const workflowNodes = useNodesMany(workflowId)

            // Execute nodes in sequence
            let previousOutput = message.triggerData;
            const context: NodeContext = {
              workflowId,
              executionId,
              userId,
              mode: message.mode,
              triggerData: message.triggerData,
              nodeId: '',
              nodeType: '',
              nodeData: {}
            };

            for (const node of workflowNodes) {
              context.nodeId = node.id;
              context.nodeType = node.type;
              context.nodeData = node.data;

              // Use hooks to execute node
              const result = await this.hooksService.executeNode(context, previousOutput);
              
              if (!result.success) {
                await this.hooksService.handleError(context, new Error(result.error));
                await this.updateExecutionStatus(executionId, 'FAILED');
                break;
              }

              previousOutput = result.data;

              // Log node execution
              await this.hooksService.log(
                context,
                `Node ${node.name} executed successfully`,
                'INFO',
                { result: result.data }
              );
            }

            // Complete workflow
            if (previousOutput) {
              await this.hooksService.completeWorkflow(
                {
                  workflowId,
                  executionId,
                  userId,
                  mode: message.mode,
                  triggerData: message.triggerData
                },
                previousOutput
              );
              await this.updateExecutionStatus(executionId, 'COMPLETED');
            }
          }
        } catch (error: any) {
          console.error('Workflow execution error:', error);
          await this.updateExecutionStatus(executionId, 'FAILED');
        }
      }
    );
  }

  private async updateExecutionStatus(executionId: string, status: string) {
    await db
      .update(workflowExecutions)
      .set({ 
        status,
        completedAt: status === 'COMPLETED' || status === 'FAILED' ? new Date() : undefined
      })
      .where(eq(workflowExecutions.id, executionId));
  }

  async getWorkflowExecutions(workflowId: string, userId: string, limit = 50) {
    // Verify workflow belongs to user
    const workflow = await db.workflows.findFirst({
      where: and(
        eq(workflows.id, workflowId),
        eq(workflows.userId, userId)
      )
    });

    if (!workflow) {
      throw new Error('Workflow not found or access denied');
    }

    const executions = await db.query.workflowExecution.findMany({
      where: eq(workflowExecutions.workflowId, workflowId),
      orderBy: desc(workflowExecutions.createdAt),
      limit,
      with: {
        nodeExecutions: {
          with: {
            node: true
          }
        }
      }
    });

    return executions;
  }

  async getExecutionLogs(executionId: string, userId: string) {
    // Verify execution belongs to user
    const execution = await db.query.workflowExecution.findFirst({
      where: and(
        eq(workflowExecutions.id, executionId),
        eq(workflows.userId, userId)
      ),
      with: {
        workflow: true
      }
    });

    if (!execution) {
      throw new Error('Execution not found or access denied');
    }

    const logs = await db.query.executionLogs.findMany({
      where: eq(executionLogs.workflowExecutionId, executionId),
      orderBy: desc(executionLogs.timestamp),
      limit: 1000
    });

    return logs;
  }
}