import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { generateSlug } from "random-word-slugs";
import { db } from "@/db/index";
import { buildNodes, executionLogs, nodeConnections, nodeExecutions, nodeTypesEnum, workflowExecutions, workflows } from "@/db/schema";
import { z } from "zod";
import { eq, and, desc, or, inArray } from "drizzle-orm";
import { Node, Edge } from "@xyflow/react";
import { getNodeTypeById } from "../../agent/components/constrants/nodetypes";
import { WorkflowExecutionService, getWorkflowExecutionService } from "@/services/Workflowexecution";

const DB_TYPE_TO_NODE_TYPE: Record<string, string> = {
  'WEBHOOK': 'webhook',
  'MANUAL': 'manual',
  'SCHEDULE': 'schedule',
  'GOOGLESHEET': 'googlesheet',
  'HTTP': 'http',
  'DATABASE': 'database',
  'EMAIL': 'email',
  'CODE': 'code',
  'AI': 'ai',
  'CONDITION': 'condition',
  'FILTER': 'filter',
  'SLACK': 'slack',
  'DISCORD': 'discord',
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
    .mutation(async ({ ctx, input }) => {
      const deleted = await db
        .delete(workflows)
        .where(
          and(
            eq(workflows.userId, ctx.user.user.id),
            eq(workflows.id, input.id),
          ),
        )
        .returning();
      return deleted[0];
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
                ...(row.buildNode.data as Record<string, any>),
                // Ensure we have the type in data as well
                type: nodeType,
                // Keep the original DB type for reference
                schemaType: row.buildNode.types,
                workflowId: input.id,
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
          type: z.string().optional(),
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

      // === SMART UPDATE FOR NODES TO PRESERVE HISTORY ===

      // 1. Get existing nodes
      const existingNodes = await db
        .select()
        .from(buildNodes)
        .where(eq(buildNodes.workflowId, id));

      const existingNodeIds = new Set(existingNodes.map(n => n.id));
      const incomingNodeIds = new Set(nodes.map(n => n.id));

      // 2. Identify Nodes to ADD, UPDATE, DELETE
      const nodesToAdd = nodes.filter(n => !existingNodeIds.has(n.id));
      const nodesToUpdate = nodes.filter(n => existingNodeIds.has(n.id));
      const nodesToDelete = existingNodes.filter(n => !incomingNodeIds.has(n.id));

      console.log('Node Smart Update Stats:', {
        toAdd: nodesToAdd.length,
        toUpdate: nodesToUpdate.length,
        toDelete: nodesToDelete.length
      });

      // 3. DELETE removed nodes
      // This will cascade delete history only for these specific nodes
      if (nodesToDelete.length > 0) {
        const idsToDelete = nodesToDelete.map(n => n.id);

        // Delete connections first (to be clean, though cascade might handle it)
        await db.delete(nodeConnections).where(
          or(
            inArray(nodeConnections.sourceNodeId, idsToDelete),
            inArray(nodeConnections.targetNodeId, idsToDelete)
          )
        );

        await db.delete(buildNodes).where(
          and(
            eq(buildNodes.workflowId, id),
            inArray(buildNodes.id, idsToDelete)
          )
        );
        console.log(`Deleted ${idsToDelete.length} removed nodes`);
      }

      // 4. INSERT new nodes
      if (nodesToAdd.length > 0) {
        const nodeData = nodesToAdd.map(node => {
          const nodeType = getNodeTypeById(node.type);
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
        console.log(`Inserted ${nodeData.length} new nodes`);
      }

      // 5. UPDATE existing nodes
      // We process updates individually or batch if possible. Drizzle batch update is tricky with different values.
      // Loop is acceptable for typical workflow size (usually < 50 nodes).
      for (const node of nodesToUpdate) {
        const nodeType = getNodeTypeById(node.type);
        await db.update(buildNodes)
          .set({
            position: node.position,
            data: node.data || {},
            // Ideally type doesn't change for same ID, but safe to update if user somehow swapped it
            types: (nodeType?.schemaType || 'MANUAL') as typeof nodeTypesEnum.enumValues[number],
            name: node.data?.label ? node.data.label : undefined, // Keep existing name if label not provided? Or update? Logic above used label or fallback.
            updatedAt: new Date()
          })
          .where(
            and(
              eq(buildNodes.id, node.id),
              eq(buildNodes.workflowId, id)
            )
          );
      }
      console.log(`Updated ${nodesToUpdate.length} existing nodes`);

      // === HANDLE CONNECTIONS ===

      // For connections, valid strategy is still Delete All + Re-insert 
      // because connections don't hold execution history (that's on nodes).
      // However, to be fully "smart", we could diff them too, but it's less critical.
      // The only risk is if connection IDs are used elsewhere (logs?). 
      // Schema shows 'node_connections' has ID. But 'execution_logs' don't reference connection IDs directly usually.
      // Let's stick to Delete All + Re-insert for connections to ensure graph consistency without complex diffing.
      // We must be careful not to trigger cascade delete on nodes though (connections point to nodes). 
      // Deleting connections does NOT delete nodes.

      // Delete ALL connections for this workflow
      // We can delete by finding all connections where source OR target is in the workflow's node set
      // Or cleaner: fetch all current nodes again? 
      // Simple way: We know all node IDs belonging to this workflow.

      // Get ALL valid node IDs for this workflow (existing + new)
      const allWorkflowNodeIds = [...existingNodeIds, ...nodesToAdd.map(n => n.id)].filter(id => !nodesToDelete.find(d => d.id === id));

      if (allWorkflowNodeIds.length > 0) {
        // Flatten connection delete: Delete where source is in workflow
        await db.delete(nodeConnections).where(
          inArray(nodeConnections.sourceNodeId, allWorkflowNodeIds)
        );
        // Delete where target is in workflow (should be redundant if we covered all edges, but safe)
        // Actually, an edge must have both source and target in the workflow (usually).
        // If we deleted by Source, we got most. But let's be thorough?
        // Actually, just deleting where key is `sourceNodeId` in `allWorkflowNodeIds` covers all internal edges.
        // What about edge from external? (not possible here).
      }

      // Insert new edges
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
        console.log('Re-inserted edges:', edgeData.length);
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
            ...(newNode.data as Record<string, any>),
            type: nodeType,
            schemaType: newNode.types
          },
          workflowId: newNode.workflowId
        }
      };
    }),
  triggerWorkflow: protectedProcedure
    .input(z.object({
      workflowId: z.string(),
      triggerData: z.record(z.any()).optional(),
      mode: z.enum(['production', 'test']).default('test')
    }))
    .mutation(async ({ ctx, input }) => {
      const executionService = getWorkflowExecutionService();

      const execution = await executionService.triggerWorkflow(
        input.workflowId,
        ctx.user.user.id,
        input.triggerData || {},
        input.mode
      );

      return execution;
    }),

  getWorkflowExecutions: protectedProcedure
    .input(z.object({
      workflowId: z.string(),
      limit: z.number().min(1).max(100).optional().default(50)
    }))
    .query(async ({ ctx, input }) => {
      // Verify user has access to this workflow
      const workflow = await db
        .select()
        .from(workflows)
        .where(
          and(
            eq(workflows.id, input.workflowId),
            eq(workflows.userId, ctx.user.user.id)
          )
        )
        .limit(1);

      if (!workflow.length) {
        throw new Error("Workflow not found or unauthorized");
      }

      const executions = await db
        .select()
        .from(workflowExecutions)
        .where(eq(workflowExecutions.workflowId, input.workflowId))
        .orderBy(desc(workflowExecutions.startedAt))
        .limit(input.limit);

      return executions;
    }),

  getExecutionLogs: protectedProcedure
    .input(z.object({
      executionId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const execution = await db
        .select({
          execution: workflowExecutions,
          workflow: workflows
        })
        .from(workflowExecutions)
        .innerJoin(workflows, eq(workflowExecutions.workflowId, workflows.id))
        .where(
          and(
            eq(workflowExecutions.id, input.executionId),
            eq(workflows.userId, ctx.user.user.id)
          )
        )
        .limit(1);

      if (!execution.length) {
        throw new Error("Execution not found or unauthorized");
      }

      const logs = await db
        .select()
        .from(executionLogs)
        .where(eq(executionLogs.workflowExecutionId, input.executionId))
        .orderBy(desc(executionLogs.timestamp));

      return logs;
    }),

  // New procedure to get detailed execution with node executions and logs
  getExecutionDetails: protectedProcedure
    .input(z.object({
      executionId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // Verify user has access to this execution
      const execution = await db
        .select({
          execution: workflowExecutions,
          workflow: workflows
        })
        .from(workflowExecutions)
        .innerJoin(workflows, eq(workflowExecutions.workflowId, workflows.id))
        .where(
          and(
            eq(workflowExecutions.id, input.executionId),
            eq(workflows.userId, ctx.user.user.id)
          )
        )
        .limit(1);

      if (!execution.length) {
        throw new Error("Execution not found or unauthorized");
      }

      // Get workflow execution
      const [workflowExecution] = execution;

      // Get node executions
      const nodeExecutionsData = await db
        .select()
        .from(nodeExecutions)
        .where(eq(nodeExecutions.workflowExecutionId, input.executionId))
        .orderBy(desc(nodeExecutions.startedAt));

      // Get execution logs
      const logs = await db
        .select()
        .from(executionLogs)
        .where(eq(executionLogs.workflowExecutionId, input.executionId))
        .orderBy(desc(executionLogs.timestamp));

      return {
        execution: workflowExecution.execution,
        workflow: workflowExecution.workflow,
        nodeExecutions: nodeExecutionsData,
        logs: logs
      };
    }),

  // Procedure to create execution logs
  createExecutionLog: protectedProcedure
    .input(z.object({
      workflowExecutionId: z.string(),
      nodeExecutionId: z.string().optional(),
      level: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']),
      message: z.string(),
      metadata: z.record(z.any()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user has access to this execution
      const execution = await db
        .select({
          execution: workflowExecutions,
          workflow: workflows
        })
        .from(workflowExecutions)
        .innerJoin(workflows, eq(workflowExecutions.workflowId, workflows.id))
        .where(
          and(
            eq(workflowExecutions.id, input.workflowExecutionId),
            eq(workflows.userId, ctx.user.user.id)
          )
        )
        .limit(1);

      if (!execution.length) {
        throw new Error("Execution not found or unauthorized");
      }

      const [newLog] = await db
        .insert(executionLogs)
        .values({
          workflowExecutionId: input.workflowExecutionId,
          nodeExecutionId: input.nodeExecutionId,
          level: input.level,
          message: input.message,
          metadata: input.metadata || {}
        })
        .returning();

      return newLog;
    }),

  updateNode: protectedProcedure
    .input(z.object({
      workflowId: z.string(),
      nodeId: z.string(),
      data: z.record(z.any()),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log('Updating node with input:', input);

      const [updatedNode] = await db
        .update(buildNodes)
        .set({
          data: input.data,
          // Update name if label is present in data
          name: input.data.label ? input.data.label : undefined
        })
        .where(
          and(
            eq(buildNodes.id, input.nodeId),
            eq(buildNodes.workflowId, input.workflowId)
          )
        )
        .returning();

      if (!updatedNode) {
        throw new Error("Failed to update node or node not found");
      }

      console.log('Node updated in DB:', updatedNode);

      return {
        updatedNode,
        workflowId: input.workflowId
      };
    }),

  removeNode: protectedProcedure
    .input(z.object({
      workflowId: z.string(),
      nodeId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log('Removing node with input:', input);
      await db
        .delete(nodeConnections)
        .where(or(
          eq(nodeConnections.sourceNodeId, input.nodeId),
          eq(nodeConnections.targetNodeId, input.nodeId)
        ));

      // Then delete the node itself
      const [deletedNode] = await db
        .delete(buildNodes)
        .where(and(
          eq(buildNodes.id, input.nodeId),
          eq(buildNodes.workflowId, input.workflowId)
        ))
        .returning();

      if (!deletedNode) {
        throw new Error("Failed to delete node or node not found");
      }

      console.log('Node deleted from DB:', deletedNode);

      return {
        success: true,
        deletedNodeId: deletedNode.id,
        workflowId: input.workflowId // Important: return workflowId for query invalidation
      };
    }),

  executeFromNode: protectedProcedure
    .input(z.object({
      workflowId: z.string(),
      nodeId: z.string(),
      mode: z.enum(['production', 'test']).default('test')
    }))
    .mutation(async ({ ctx, input }) => {
      const executionService = getWorkflowExecutionService();

      const result = await executionService.executeWorkflowFromNode(
        input.workflowId,
        ctx.user.user.id,
        input.nodeId,
        input.mode
      );

      return result;
    }),

  clearNodeExecution: protectedProcedure
    .input(z.object({
      workflowId: z.string(),
      nodeId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const executionService = getWorkflowExecutionService();

      const result = await executionService.clearNodeExecution(
        input.workflowId,
        ctx.user.user.id,
        input.nodeId
      );

      return result;
    }),
});