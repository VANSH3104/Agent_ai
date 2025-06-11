import { createTRPCRouter } from '../init';
import { agentsRouter } from '@/app/module/agents/server/process';
export const appRouter = createTRPCRouter({
  aiAgents: agentsRouter
});
// export type definition of API
export type AppRouter = typeof appRouter;