// import { Noderouter } from '@/app/module/agents/server/Node';
import { db } from '@/db/index';
import { createTRPCRouter, protectedProcedure } from '../init';
import { workflows } from '@/db/schema';
// import { Workflowrouter } from '@/app/module/agents/server/process';
export const appRouter = createTRPCRouter({
  getWorkflows:  protectedProcedure.query(({ctx})=>{
    return db.select().from(workflows);
  }),
  createWorkflow: protectedProcedure.mutation(() => {
    return db.insert(workflows).values({
        name: "New Workflow",
    })
  }),
})
// export type definition of API
export type AppRouter = typeof appRouter;