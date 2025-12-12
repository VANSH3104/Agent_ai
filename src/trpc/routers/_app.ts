import { Agentrouter } from '@/app/module/Agents/server/router';
import { UserRouter } from '@/app/module/user/router';
import { createTRPCRouter } from '../init';
import { Workflowrouter } from '@/app/module/Agents/server/workflowrouter';
import { credentialsRouter } from '@/app/module/credentials/router';

export const appRouter = createTRPCRouter({
  agent: Agentrouter,
  user: UserRouter,
  kafka: Workflowrouter,
  credentials: credentialsRouter,
})
// export type definition of API
export type AppRouter = typeof appRouter;