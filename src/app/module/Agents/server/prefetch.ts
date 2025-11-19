import { prefetch, trpc } from "@/trpc/server";
import type { inferInput } from "@trpc/tanstack-react-query";

type Input = inferInput<typeof trpc.agent.getMany>;
export const prefetchAgent = (params: Input) => {
  prefetch(trpc.agent.getMany.queryOptions(params));
};
export const prefectchid = (id : string) =>{
  prefetch(trpc.agent.getOne.queryOptions({id}))
}