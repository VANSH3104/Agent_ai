import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { buildNodes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { WorkflowExecutionService } from "@/services/Workflowexecution";
const workflowExecutionService = new WorkflowExecutionService();
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
            triggerData: z.record(z.any()).optional().default({}), // allows { startNodeId?: string, ... }
            mode: z.enum(['production', 'test']).optional().default('test'),
          })
        )
        .mutation(async ({ input, ctx }) => {
          const userId = ctx.user?.user?.id ?? ctx.user?.session.expiresAt;
          if (!userId) throw new Error('Unauthorized');
    
          // call the service
          const execution = await workflowExecutionService.triggerWorkflow(
            input.workflowId,
            userId,
            input.triggerData,
            input.mode
          );
    
          return execution;
        }),
});
