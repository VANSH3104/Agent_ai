// src/trpc/routers/workflowRouter.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { buildNodes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { WorkflowExecutionService } from "@/services/Workflowexecution";

const workflowExecutionService = new WorkflowExecutionService();

export const Workflowrouter = createTRPCRouter({
  // Get workflow nodes
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

  // Trigger workflow execution
  trigger: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        triggerData: z.record(z.any()).optional().default({}),
        mode: z.enum(['production', 'test']).optional().default('test'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.user?.id ?? ctx.user?.session.userId;
      if (!userId) throw new Error('Unauthorized');

      const execution = await workflowExecutionService.triggerWorkflow(
        input.workflowId,
        userId,
        input.triggerData,
        input.mode
      );

      return execution;
    }),

  // Get all executions for a workflow
  getExecutions: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        limit: z.number().optional().default(50)
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.user?.id ?? ctx.user?.session.userId;
      if (!userId) throw new Error('Unauthorized');

      const executions = await workflowExecutionService.getWorkflowExecutions(
        input.workflowId,
        userId,
        input.limit
      );

      return executions;
    }),

  // Get detailed execution with node executions
  getExecutionDetails: protectedProcedure
    .input(z.object({ executionId: z.string() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.user?.id ?? ctx.user?.session.userId;
      if (!userId) throw new Error('Unauthorized');

      const details = await workflowExecutionService.getExecutionDetails(
        input.executionId,
        userId
      );

      return details;
    }),

  // Get execution logs
  getExecutionLogs: protectedProcedure
    .input(z.object({ executionId: z.string() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.user?.id ?? ctx.user?.session.userId;
      if (!userId) throw new Error('Unauthorized');

      const logs = await workflowExecutionService.getExecutionLogs(
        input.executionId,
        userId
      );

      return logs;
    }),
});