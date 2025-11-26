// src/services/WorkflowExecutionService.ts
import { db } from '@/db';
import { workflowExecutions, executionLogs, workflows } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { KafkaService } from './kafkaservice';


export class WorkflowExecutionService {
  private kafkaService: KafkaService;
  
  constructor() {
    this.kafkaService = new KafkaService();
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
  
      // Create topic for this workflow if it doesn't exist
      const triggerTopic = `workflow.${workflowId}.trigger`;
      await this.kafkaService.createTopic(triggerTopic);
  
      // Send trigger message
      await this.kafkaService.sendTopic(triggerTopic, {
        workflowId,
        userId,
        executionId: execution.id,
        triggerData,
        mode,
        timestamp: new Date().toISOString()
      });
  
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

  async getWorkflowExecutions(workflowId: string, userId: string, limit = 50) {
    // Verify workflow belongs to user
    const workflow = await db.query.workflows.findFirst({
      where: and(
        eq(workflows.id, workflowId),
        eq(workflows.userId, userId)
      )
    });

    if (!workflow) {
      throw new Error('Workflow not found or access denied');
    }

    const executions = await db.query.workflowExecutions.findMany({
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
    const execution = await db.query.workflowExecutions.findFirst({
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