import { Noderouter } from '@/app/module/agents/server/Node';
import { createTRPCRouter } from '../init';
import { Workflowrouter } from '@/app/module/agents/server/process';
export const appRouter = createTRPCRouter({
  workflow: Workflowrouter,
  Noderouter: Noderouter
});
// export type definition of API
export type AppRouter = typeof appRouter;