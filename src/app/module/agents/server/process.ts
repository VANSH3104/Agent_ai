// src/server/api/routers/agents.ts
import { z } from "zod";
import { db } from "@/db";
import { workflows } from "@/db/schema";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const agentsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const inserted = await db
        .insert(workflows)
        .values({
          name: input.name,
          description: input.description ?? "",
          userId,
        })
        .returning();

      return inserted[0];
    }),
});
