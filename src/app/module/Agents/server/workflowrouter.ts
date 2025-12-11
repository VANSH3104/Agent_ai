import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { buildNodes } from "@/db/schema";
import { eq } from "drizzle-orm";

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
});
