import { createTRPCRouter } from '../init';
import { Workflowrouter } from '@/app/module/agents/server/process';
export const appRouter = createTRPCRouter({
  workflow: Workflowrouter
});
// export type definition of API
export type AppRouter = typeof appRouter;