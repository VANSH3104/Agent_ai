import { Agentrouter } from '@/app/module/Agents/server/router';
import { UserRouter } from '@/app/module/user/router';
import { createTRPCRouter } from '../init';
export const appRouter = createTRPCRouter({
  agent: Agentrouter,
  user: UserRouter,
})
// export type definition of API
export type AppRouter = typeof appRouter;