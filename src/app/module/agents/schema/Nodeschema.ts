import {z} from "zod"
export const Nodeschema = z.object({
    name: z.string().min(1, "Name is required"),
   type: z.string().min(1, "Type is required"),
   position: z.object({
        x: z.number(),
        y: z.number(),
   }),
    parameters: z.record(z.any()),
    credentials: z.record(z.any()).optional(),
    subWorkflowId: z.string().nullable().optional(),
}) 