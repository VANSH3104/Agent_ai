// src/trpc/routers/workflowRouter.ts (FIXED)
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { buildNodes } from "@/db/schema";
import { eq } from "drizzle-orm";
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
});