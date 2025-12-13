// src/trpc/routers/workflowRouter.ts (FIXED)
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { buildNodes, nodeExecutions, } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getWorkflowExecutionService } from "@/services/Workflowexecution";

export const Workflowrouter = createTRPCRouter({
  Many: protectedProcedure
    .input(z.object({ workflowId: z.string() }))
    .query(async ({ ctx, input }) => {
      const nodes = await db
        .select()
        .from(buildNodes)
        .where(eq(buildNodes.workflowId, input.workflowId))
        .orderBy(buildNodes.createdAt);
      return nodes;
    }),

  trigger: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        triggerData: z.record(z.any()).optional().default({}),
        mode: z.enum(['production', 'test']).optional().default('test'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.user?.id ?? ctx.user?.session?.userId;
      if (!userId) throw new Error('Unauthorized');

      // Use singleton instance
      const workflowService = getWorkflowExecutionService();

      const execution = await workflowService.triggerWorkflow(
        input.workflowId,
        userId,
        input.triggerData,
        input.mode
      );

      return execution;
    }),

  toggleExecution: protectedProcedure
    .input(z.object({
      workflowId: z.string(),
      isPolling: z.boolean() // true = start, false = stop
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.user?.id ?? ctx.user?.session?.userId;
      if (!userId) throw new Error('Unauthorized');

      const workflowService = getWorkflowExecutionService();

      if (input.isPolling) {
        await workflowService.startWorkflow(input.workflowId);
      } else {
        await workflowService.stopWorkflow(input.workflowId);
      }

      return { success: true, status: input.isPolling ? 'RUNNING' : 'DRAFT' };
    }),

  getExecutions: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        limit: z.number().optional().default(50)
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.user?.id ?? ctx.user?.session?.userId;
      if (!userId) throw new Error('Unauthorized');

      const workflowService = getWorkflowExecutionService();

      const executions = await workflowService.getWorkflowExecutions(
        input.workflowId,
        userId,
        input.limit
      );

      return executions;
    }),

  getExecutionDetails: protectedProcedure
    .input(z.object({ executionId: z.string() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.user?.id ?? ctx.user?.session?.userId;
      if (!userId) throw new Error('Unauthorized');

      const workflowService = getWorkflowExecutionService();

      const details = await workflowService.getExecutionDetails(
        input.executionId,
        userId
      );

      return details;
    }),

  getExecutionLogs: protectedProcedure
    .input(z.object({ executionId: z.string() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.user?.id ?? ctx.user?.session?.userId;
      if (!userId) throw new Error('Unauthorized');

      const workflowService = getWorkflowExecutionService();

      const logs = await workflowService.getExecutionLogs(
        input.executionId,
        userId
      );

      return logs;
    }),

  getLatestNodeExecutionStatus: protectedProcedure
    .input(z.object({
      nodeId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const { nodeId } = input;

      // Query the latest execution for this node
      const latestExecution = await db
        .select()
        .from(nodeExecutions)
        .where(eq(nodeExecutions.nodeId, nodeId))
        .orderBy(desc(nodeExecutions.startedAt))
        .limit(1);

      // If no execution found, return INITIAL status
      if (!latestExecution || latestExecution.length === 0) {
        return {
          status: "initial",
          nodeId,
          execution: null
        };
      }

      const execution = latestExecution[0];

      // Return the actual status from the latest execution
      return {
        status: execution.status,
        nodeId,
        //   execution: {
        //     id: execution.id,
        //     workflowExecutionId: execution.workflowExecutionId,
        //     status: execution.status,
        //     inputData: execution.inputData,
        //     outputData: execution.outputData,
        //     error: execution.error,
        //     retryAttempt: execution.retryAttempt,
        //     executionTime: execution.executionTime,
        //     startedAt: execution.startedAt,
        //     finishedAt: execution.finishedAt,
        //   }
      };
    })
}); 