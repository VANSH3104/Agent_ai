import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { generateSlug } from "random-word-slugs";
import { db } from "@/db/index";
import { buildNodes, nodeConnections, workflows, nodeTypesEnum } from "@/db/schema";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { Node, Edge } from "@xyflow/react";

export const Agentrouter = createTRPCRouter({
  create: protectedProcedure.mutation(async ({ ctx }) => {
    const [newAgent] = await db
      .insert(workflows)
      .values({
        name: generateSlug(3),
        userId: ctx.user.user.id,
      })
      .returning();

    if (!newAgent) {
      throw new Error("Failed to create workflow");
    }

    const [newNode] = await db
      .insert(buildNodes)
      .values({
        types: nodeTypesEnum.enumValues[0], // Use the enum properly
        agentId: generateSlug(2),
        workflowId: newAgent.id,
        position: { x: 0, y: 0 },
        name: "Initial Node",
      })
      .returning();

    if (!newNode) {
      throw new Error("Failed to create initial node");
    }

    return { newAgent, newNode };
  }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return db
        .delete(workflows)
        .where(
          and(
            eq(workflows.userId, ctx.user.user.id),
            eq(workflows.id, input.id),
          ),
        )
        .execute();
    }),

  updateName: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(2).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const update = await db
        .update(workflows)
        .set({ name: input.name })
        .where(
          and(
            eq(workflows.userId, ctx.user.user.id),
            eq(workflows.id, input.id),
          ),
        )
        .returning();
      return update[0];
    }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const workflow = await db
        .select({
          workflow: workflows,
          buildNode: buildNodes,
          connection: nodeConnections,
        })
        .from(workflows)
        .where(
          and(
            eq(workflows.userId, ctx.user.user.id),
            eq(workflows.id, input.id),
          ),
        )
        .leftJoin(buildNodes, eq(workflows.id, buildNodes.workflowId))
        .leftJoin(
          nodeConnections,
          eq(buildNodes.id, nodeConnections.sourceNodeId),
        );

      if (!workflow.length || !workflow[0].workflow) {
        throw new Error("Workflow not found");
      }

      // Group nodes and their connections
      const nodesMap = new Map();
      workflow.forEach((row) => {
        if (row.buildNode) {
          if (!nodesMap.has(row.buildNode.id)) {
            nodesMap.set(row.buildNode.id, {
              id: row.buildNode.id,
              type: row.buildNode.types,
              position: row.buildNode.position,
              data: row.buildNode.data || {},
              _connections: [],
            });
          }

          // Add connection if it exists
          if (row.connection) {
            nodesMap.get(row.buildNode.id)._connections.push({
              id: row.connection.id,
              target: row.connection.targetNodeId,
              sourceHandle: row.connection.fromOutput,
              targetHandle: row.connection.toInput,
            });
          }
        }
      });

      const Nodes: Node[] = Array.from(nodesMap.values()).map((node) => {
        const { _connections, ...flowNode } = node;
        return flowNode as Node;
      });

      // Create edges from connections with proper React Flow Edge type
      const Edges: Edge[] = Array.from(nodesMap.values()).flatMap((node) => {
        return node._connections.map((conn: any) => ({
          id: conn.id,
          source: node.id,
          target: conn.target,
          sourceHandle: conn.sourceHandle || null,
          targetHandle: conn.targetHandle || null,
        }));
      });

      return {
        workflow: workflow[0].workflow,
        Nodes,
        Edges,
      };
    }),

  getMany: protectedProcedure.query(({ ctx }) => {
    return db
      .select()
      .from(workflows)
      .where(eq(workflows.userId, ctx.user.user.id));
  }),
});