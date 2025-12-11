import { Agentrouter } from '@/app/module/Agents/server/router';
import { UserRouter } from '@/app/module/user/router';
import { createTRPCRouter } from '../init';
import { Workflowrouter } from '@/app/module/Agents/server/workflowrouter';
export const appRouter = createTRPCRouter({
  agent: Agentrouter,
  user: UserRouter,
  kafka: Workflowrouter
})
// export type definition of API
export type AppRouter = typeof appRouter;