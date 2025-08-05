import { db } from "@/db";
import { nodes } from "@/db/schema";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { NodeSchema } from "../schema/WorkflowSchema";

export const Noderouter = createTRPCRouter({

  getOne: baseProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [existing] = await db
        .select()
        .from(nodes)
        .where(eq(nodes.id, input.id));

      if (!existing) {
        throw new Error("Node not found");
      }

      return {
        ...existing,
        parameters: JSON.parse(existing.parameters),
        position: JSON.parse(existing.position),
        credentials: existing.credentials ? JSON.parse(existing.credentials) : null,
      };
    }),
  getMany: baseProcedure.query(async () => {
    try {
      const data = await db.select().from(nodes);
      return data.map((node) => ({
        ...node,
        parameters: JSON.parse(node.parameters),
        position: JSON.parse(node.position),
        credentials: node.credentials ? JSON.parse(node.credentials) : null,
      }));
    } catch (error) {
      console.error("Error fetching nodes:", error);
      throw new Error("Failed to fetch nodes");
    }
  }),
create: protectedProcedure
  .input(NodeSchema)
  .mutation(async ({ input }) => {
    try {
      const {
        name,
        type,
        position,
        parameters,
        credentials,
        subWorkflowId,
        workflowId,
      } = input;

      const [insertedNode] = await db
        .insert(nodes)
        .values({
          name,
          type,
          workflowId,
          position: JSON.stringify(position),
          parameters: JSON.stringify(parameters),
          credentials: credentials ? JSON.stringify(credentials) : null,
          subWorkflowId,
        })
        .returning();

      return {
        ...insertedNode,
        parameters: JSON.parse(insertedNode.parameters),
        position: JSON.parse(insertedNode.position),
        credentials: insertedNode.credentials ? JSON.parse(insertedNode.credentials) : null,
      };
    } catch (error) {
      console.error("Error creating node:", error);
      throw new Error("Failed to create node");
    }
  }),

});
