import { z } from 'zod';
import { procedure, router } from '@/server/trpc';
import { db } from '@/db';
import { nodes, connections, executions, workflows } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { workflowEngine } from '../../services/workflow-engine';


export const workflowRouter = router({
  // Get workflow execution status
  getExecution: procedure
    .input(z.object({ executionId: z.string() }))
    .query(async ({ input }) => {
      const execution = await db.select()
        .from(executions)
        .where(eq(executions.id, input.executionId))
        .then(rows => rows[0]);

      if (!execution) throw new Error('Execution not found');

      return {
        ...execution,
        data: execution.data ? JSON.parse(execution.data) : null,
      };
    }),

  // Get all executions for a workflow
  getExecutions: procedure
    .input(z.object({ 
      workflowId: z.string(),
      status: z.enum(['running', 'success', 'error', 'paused']).optional(),
      limit: z.number().default(50)
    }))
    .query(async ({ input }) => {
      let query = db.select()
        .from(executions)
        .where(eq(executions.workflowId, input.workflowId))
        .orderBy(executions.startedAt)
        .limit(input.limit);

      if (input.status) {
        query = query.where(and(
          eq(executions.workflowId, input.workflowId),
          eq(executions.status, input.status)
        ));
      }

      const results = await query;
      return results.map(execution => ({
        ...execution,
        data: execution.data ? JSON.parse(execution.data) : null,
      }));
    }),

  // Start workflow execution
  startExecution: procedure
    .input(z.object({
      workflowId: z.string(),
      triggerData: z.any().optional().default({}),
      startFromNodeId: z.string().optional(), // For resuming from specific node
    }))
    .mutation(async ({ input }) => {
      const executionId = await workflowEngine.startWorkflowExecution(
        input.workflowId,
        input.triggerData,
        input.startFromNodeId
      );
      return { executionId };
    }),

  // Resume failed execution
  resumeExecution: procedure
    .input(z.object({
      executionId: z.string(),
      fromNodeId: z.string().optional(),
      modifiedData: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await workflowEngine.resumeExecution(
        input.executionId,
        input.fromNodeId,
        input.modifiedData
      );
      return result;
    }),

  // Pause execution
  pauseExecution: procedure
    .input(z.object({ executionId: z.string() }))
    .mutation(async ({ input }) => {
      await workflowEngine.pauseExecution(input.executionId);
      return { success: true };
    }),

  // Get execution graph (visual representation)
  getExecutionGraph: procedure
    .input(z.object({ executionId: z.string() }))
    .query(async ({ input }) => {
      return await workflowEngine.getExecutionGraph(input.executionId);
    }),

  // Activate/Deactivate workflow
  toggleWorkflow: procedure
    .input(z.object({
      workflowId: z.string(),
      active: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      if (input.active) {
        await workflowEngine.activateWorkflow(input.workflowId);
      } else {
        await workflowEngine.deactivateWorkflow(input.workflowId);
      }
      return { success: true };
    }),

  // Test node execution
  testNode: procedure
    .input(z.object({
      nodeId: z.string(),
      testData: z.any().optional().default({}),
    }))
    .mutation(async ({ input }) => {
      const result = await workflowEngine.testNodeExecution(
        input.nodeId,
        input.testData
      );
      return result;
    }),
});