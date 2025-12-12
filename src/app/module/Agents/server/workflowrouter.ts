// src/trpc/routers/workflowRouter.ts (FIXED)
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { buildNodes, nodeExecutions,  } from "@/db/schema";
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
    .query(async ({ input, ctx }) => {
      // Check for latest execution in nodeExecutions table
      const latestExecution = await db
        .select(nodeExecutions)
        .from(nodeExecutions)
        .where(eq(nodeExecutions.nodeId, input.nodeId))
        .orderBy(desc(nodeExecutions.startedAt))
        .limit(1);
      return { latestExecution }     // If no execution found, return "initial"
    //   if (latestExecution.length === 0) {
    //     return "initial";
    //   }
  
    //   // Map to simple status
    //   switch (latestExecution.status) {
    //     case "PAUSED":
    //       return "loading";
    //     case "SUCCESS":
    //       return "success";
    //     case "FAILED":
    //       return "error";
    //     default:
    //       return "initial";
    //   }
    }),
});