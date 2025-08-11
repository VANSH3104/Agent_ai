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
  update: protectedProcedure.input(NodeSchema.partial().extend({
    id: z.string(),
  })).mutation(async ({input})=> {
    try {
      const { id , ...fields} = input;
       const updateData: Record<string, unknown> = {};
      if (fields.name !== undefined) updateData.name = fields.name;
      if (fields.type !== undefined) updateData.type = fields.type;
      if (fields.workflowId !== undefined) updateData.workflowId = fields.workflowId;
      if (fields.position !== undefined)
        updateData.position = JSON.stringify(fields.position);
      if (fields.parameters !== undefined)
        updateData.parameters = JSON.stringify(fields.parameters);
      if (fields.credentials !== undefined)
        updateData.credentials = fields.credentials
          ? JSON.stringify(fields.credentials)
          : null;
      if (fields.subWorkflowId !== undefined)
        updateData.subWorkflowId = fields.subWorkflowId;

      const [updatedNode] = await db
        .update(nodes)
        .set(updateData)
        .where(eq(nodes.id, id))
        .returning();

      if (!updatedNode) {
        throw new Error("Node not found");
      }

      return {
        ...updatedNode,
        parameters: JSON.parse(updatedNode.parameters),
        position: JSON.parse(updatedNode.position),
        credentials: updatedNode.credentials
          ? JSON.parse(updatedNode.credentials)
          : null,
      };
    } catch (error) {
      console.error("Error in updating" , error);
      throw new Error("failed to update"); 
    }
  }),
  updatePosition: protectedProcedure
  .input(
    z.object({
      id: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number(),
      }),
    })
  )
  .mutation(async ({ input }) => {
    const { id, position } = input;

    const [updatedNode] = await db
      .update(nodes)
      .set({
        position: JSON.stringify(position),
      })
      .where(eq(nodes.id, id))
      .returning({
        id: nodes.id,
        position: nodes.position,
      });

    if (!updatedNode) {
      throw new Error("Node not found");
    }

    return {
      id: updatedNode.id,
      position: JSON.parse(updatedNode.position),
    };
  }),

});
