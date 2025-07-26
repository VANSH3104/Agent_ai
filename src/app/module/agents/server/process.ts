import { db } from "@/db";
import { workflows } from "@/db/schema";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { WorkflowSchema } from "../schema/WorkflowSchema";

export const Workflowrouter = createTRPCRouter({

  getOne: baseProcedure.input(z.object({id:z.string()})).query(async ({input})=>{
    const [existing] = await db.select().from(workflows).where(eq(workflows.id , input.id))
    return existing;
  }),
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
      WorkflowSchema
    )
    .mutation(async ({ input, ctx }) => {
      try {

        const [insertedWorkflow] = await db
          .insert(workflows)
          .values({
            ...input,
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