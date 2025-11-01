// import { db } from "@/db";
// import { executions, workflows } from "@/db/schema";
// import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
// import { eq, and } from "drizzle-orm";
// import { z } from "zod";
// import { WorkflowSchema } from "../schema/WorkflowSchema";
// // import { workflowEngine } from "../services/workflow-engine";


// export const Workflowrouter = createTRPCRouter({

//   // Get single workflow
//   getOne: baseProcedure
//     .input(z.object({ id: z.string() }))
//     .query(async ({ input }) => {
//       const [existing] = await db
//         .select()
//         .from(workflows)
//         .where(eq(workflows.id, input.id));
//       return existing;
//     }),

//   // Get all workflows
//   getMany: baseProcedure.query(async () => {
//     try {
//       const data = await db.select().from(workflows);
//       return data;
//     } catch (error) {
//       console.error("Error fetching workflows:", error);
//       throw new Error("Failed to fetch workflows");
//     }
//   }),

//   // Create workflow
//   create: protectedProcedure
//     .input(WorkflowSchema)
//     .mutation(async ({ input, ctx }) => {
//       try {
//         const [insertedWorkflow] = await db
//           .insert(workflows)
//           .values({
//             ...input,
//             userId: ctx.user.user.id,
//           })
//           .returning();

//         return insertedWorkflow;
//       } catch (error) {
//         console.error("Error creating workflow:", error);
//         throw new Error("Failed to create workflow");
//       }
//     }),

//   // Get single execution
//   getExecution: protectedProcedure
//     .input(z.object({ executionId: z.string() }))
//     .query(async ({ input }) => {
//       const [execution] = await db
//         .select()
//         .from(executions)
//         .where(eq(executions.id, input.executionId));

//       if (!execution) throw new Error("Execution not found");

//       return {
//         ...execution,
//         data: execution.data ? JSON.parse(execution.data) : null,
//       };
//     }),

//   // Get executions for a workflow
//   getExecutions: protectedProcedure
//     .input(z.object({
//       workflowId: z.string(),
//       status: z.enum(["running", "success", "error", "paused"]).optional(),
//       limit: z.number().default(50),
//     }))
//     .query(async ({ input }) => {
//       let query = db
//         .select()
//         .from(executions)
//         .where(eq(executions.workflowId, input.workflowId))
//         .orderBy(executions.startedAt)
//         .limit(input.limit);

//       if (input.status) {
//         query = db
//           .select()
//           .from(executions)
//           .where(and(
//             eq(executions.workflowId, input.workflowId),
//             eq(executions.status, input.status)
//           ))
//           .orderBy(executions.startedAt)
//           .limit(input.limit);
//       }

//       const results = await query;
//       return results.map(execution => ({
//         ...execution,
//         data: execution.data ? JSON.parse(execution.data) : null,
//       }));
//     }),

//   // Start execution
//   startExecution: protectedProcedure
//     .input(z.object({
//       workflowId: z.string(),
//       triggerData: z.any().optional().default({}),
//       startFromNodeId: z.string().optional(),
//     }))
//     .mutation(async ({ input }) => {
//       const executionId = await workflowEngine.startWorkflowExecution(
//         input.workflowId,
//         input.triggerData,
//         input.startFromNodeId
//       );
//       return { executionId };
//     }),

//   // Resume execution
//   resumeExecution: protectedProcedure
//     .input(z.object({
//       executionId: z.string(),
//       fromNodeId: z.string().optional(),
//       modifiedData: z.any().optional(),
//     }))
//     .mutation(async ({ input }) => {
//       const result = await workflowEngine.resumeExecution(
//         input.executionId,
//         input.fromNodeId,
//         input.modifiedData
//       );
//       return result;
//     }),

//   // Pause execution
//   pauseExecution: protectedProcedure
//     .input(z.object({ executionId: z.string() }))
//     .mutation(async ({ input }) => {
//       await workflowEngine.pauseExecution(input.executionId);
//       return { success: true };
//     }),

//   // Get execution graph
//   getExecutionGraph: protectedProcedure
//     .input(z.object({ executionId: z.string() }))
//     .query(async ({ input }) => {
//       return await workflowEngine.getExecutionGraph(input.executionId);
//     }),

//   // Toggle workflow
//   toggleWorkflow: protectedProcedure
//     .input(z.object({
//       workflowId: z.string(),
//       active: z.boolean(),
//     }))
//     .mutation(async ({ input }) => {
//       if (input.active) {
//         await workflowEngine.activateWorkflow(input.workflowId);
//       } else {
//         await workflowEngine.deactivateWorkflow(input.workflowId);
//       }
//       return { success: true };
//     }),

//   // Test node execution
//   testNode: protectedProcedure
//     .input(z.object({
//       nodeId: z.string(),
//       testData: z.any().optional().default({}),
//     }))
//     .mutation(async ({ input }) => {
//       const result = await workflowEngine.testNodeExecution(
//         input.nodeId,
//         input.testData
//       );
//       return result;
//     }),
// });
