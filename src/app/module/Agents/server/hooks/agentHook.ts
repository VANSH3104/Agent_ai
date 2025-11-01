import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
export const useSuspenceAgent = ()=>{
  const trpc = useTRPC()
  return useSuspenseQuery(trpc.agent.getMany.queryOptions())
  
}