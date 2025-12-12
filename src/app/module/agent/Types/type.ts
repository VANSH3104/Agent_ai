import { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";
export type WorkflowGetOne = inferRouterOutputs<AppRouter>["workflow"]["getOne"];
export type WorkflowGetMany = inferRouterOutputs<AppRouter>["workflow"]["getMany"];