import { AppRouter } from '@/trpc/routers/_app';
import {
  createTRPCReact,
  type inferReactQueryProcedureOptions,
} from '@trpc/react-query';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

 
// infer the types for your router
export type ReactQueryOptions = inferReactQueryProcedureOptions<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
 
export const TrpcMain = createTRPCReact<AppRouter>();