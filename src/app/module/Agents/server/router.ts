import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { generateSlug } from "random-word-slugs";
import { db } from "@/db/index";
import { buildNodes, nodeConnections, nodeTypesEnum, workflows } from "@/db/schema";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { Node, Edge } from "@xyflow/react";
import { getNodeTypeById } from "../../agent/components/constrants/nodetypes";

// Map database enum types to React Flow node types
const DB_TYPE_TO_NODE_TYPE: Record<string, string> = {
  'WEBHOOK': 'webhook',
  'MANUAL': 'manual',
  'SCHEDULE': 'schedule',
  'HTTP': 'http',
  'DATABASE': 'database',
  'EMAIL': 'email',
  'CODE': 'code',
  'CONDITION': 'condition',
  'FILTER': 'filter',
  'INITIAL': 'initial'
};

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

    return { newAgent };
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
            // Convert DB type to React Flow node type
            const nodeType = DB_TYPE_TO_NODE_TYPE[row.buildNode.types] || 'manual';
            
            nodesMap.set(row.buildNode.id, {
              id: row.buildNode.id,
              type: nodeType, // Use lowercase node type for React Flow
              position: row.buildNode.position,
              data: {
                ...row.buildNode.data,
                // Ensure we have the type in data as well
                type: nodeType,
                // Keep the original DB type for reference
                schemaType: row.buildNode.types
              },
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
          type: conn.type || 'buttonedge',
        }));
      });

      console.log('Returning nodes:', Nodes);
      console.log('Returning edges:', Edges);

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

  update: protectedProcedure
    .input(z.object({ 
      id: z.string(), 
      nodes: z.array(
        z.object({
          id: z.string(),
          type: z.string(),
          position: z.object({
            x: z.number(),
            y: z.number(),
          }),
          data: z.record(z.string(), z.any()).optional()
        })
      ),
      edges: z.array(
        z.object({
          id: z.string(),
          source: z.string(),
          target: z.string(),
          sourceHandle: z.string().optional().nullable(),
          targetHandle: z.string().optional().nullable(),
        }) 
      )
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, nodes, edges } = input;
      
      console.log('Update mutation called with:', { id, nodesCount: nodes.length, edgesCount: edges.length });
  
      // Update workflow basic info
      const [workflowUpdate] = await db
        .update(workflows)
        .set({ 
          updatedAt: new Date() 
        })
        .where(
          and(
            eq(workflows.userId, ctx.user.user.id),
            eq(workflows.id, id),
          ),
        )
        .returning();
        
      if (!workflowUpdate) {
        throw new Error("Workflow not found or unauthorized");
      }
  
      // Get existing nodes for this workflow
      const existingNodes = await db
        .select({ id: buildNodes.id })
        .from(buildNodes)
        .where(eq(buildNodes.workflowId, id));
      
      // Delete connections for existing nodes
      if (existingNodes.length > 0) {
        const nodeIds = existingNodes.map(n => n.id);
        
        // Delete connections where source or target is one of these nodes
        for (const nodeId of nodeIds) {
          await db.delete(nodeConnections).where(
            eq(nodeConnections.sourceNodeId, nodeId)
          );
          await db.delete(nodeConnections).where(
            eq(nodeConnections.targetNodeId, nodeId)
          );
        }
      }
      
      // Now delete the nodes
      await db.delete(buildNodes).where(
        eq(buildNodes.workflowId, id)
      );
  
      // Insert new nodes
      if (nodes.length > 0) {
        const nodeData = nodes.map(node => {
          const nodeType = getNodeTypeById(node.type);
          
          console.log('Preparing node for insert:', { 
            nodeId: node.id, 
            nodeType: node.type, 
            schemaType: nodeType?.schemaType 
          });
          
          return {
            id: node.id,
            name: node.data?.label || `Node ${node.id.slice(0, 8)}`,
            types: (nodeType?.schemaType || 'MANUAL') as typeof nodeTypesEnum.enumValues[number],
            position: node.position,
            data: node.data || {},
            workflowId: id,
          };
        });
  
        await db.insert(buildNodes).values(nodeData);
        console.log('Inserted nodes:', nodeData.length);
      }
  
      // Insert new edges (node connections)
      if (edges.length > 0) {
        const edgeData = edges.map(edge => ({
          id: edge.id,
          sourceNodeId: edge.source,
          targetNodeId: edge.target,
          fromOutput: edge.sourceHandle || null,
          toInput: edge.targetHandle || null,
          type: edge.type || 'buttonedge',
        }));
  
        await db.insert(nodeConnections).values(edgeData);
        console.log('Inserted edges:', edgeData.length);
      }
  
      return workflowUpdate;
    }),

  createNode: protectedProcedure
    .input(z.object({
      workflowId: z.string(),
      type: z.string(), // This will be the schemaType like 'WEBHOOK', 'HTTP', etc.
      position: z.object({
        x: z.number(),
        y: z.number()
      }),
      data: z.record(z.any()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      console.log('Creating node with input:', input);
      
      // Map the string type to your enum
      const validTypes = nodeTypesEnum.enumValues;
      const mappedType = validTypes.includes(input.type as any) 
        ? (input.type as typeof nodeTypesEnum.enumValues[number])
        : 'MANUAL'; // fallback
  
      const [newNode] = await db
        .insert(buildNodes)
        .values({
          workflowId: input.workflowId,
          types: mappedType,
          position: input.position,
          data: input.data || {},
          name: input.data?.label || input.type.toLowerCase(),
        })
        .returning();
  
      if (!newNode) {
        throw new Error("Failed to create node");
      }
      
      console.log('Node created in DB:', newNode);
      
      // Return node in React Flow format
      const nodeType = DB_TYPE_TO_NODE_TYPE[newNode.types] || 'manual';
      
      return { 
        newNode: {
          id: newNode.id,
          type: nodeType, // React Flow type
          position: newNode.position,
          data: {
            ...newNode.data,
            type: nodeType,
            schemaType: newNode.types
          },
          workflowId: newNode.workflowId
        }
      };
    }),
});