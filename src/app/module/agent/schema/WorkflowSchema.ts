import {z} from "zod"
export const WorkflowSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
});

export const NodeSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  parameters: z.record(z.any()),
  credentials: z.record(z.any()).optional(),
  subWorkflowId: z.string().nullable().optional(),
  workflowId: z.string(),
});
