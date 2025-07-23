import { db } from "@/db";
import { workflows } from "@/db/schema";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";

export const agentsRouter = createTRPCRouter({
  getMany: baseProcedure.query(async () => {
    try {
      const data = await db.select().from(workflows);
      return data;
    } catch (error) {
      console.error("Error fetching workflows:", error);
      throw new Error("Failed to fetch workflows");
    }
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {

        const [insertedWorkflow] = await db
          .insert(workflows)
          .values({
            name: input.name,
            description: input.description || "",
            userId: ctx.user.user.id
          })
          .returning();

        return insertedWorkflow;
      } catch (error) {
        console.error("Error creating workflow:", error);
        throw new Error("Failed to create workflow");
      }
    }),
});