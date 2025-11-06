import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
export const useSuspenceAgent = ()=>{
  const trpc = useTRPC()
  return useSuspenseQuery(trpc.agent.getMany.queryOptions())
  
}

export const useCreateAgent = ()=>{
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  return useMutation(trpc.agent.create.mutationOptions({
    onSuccess: (data) => {
      console.log(data)
      toast.success(`Agent ${data?.name} created successfully`);
      queryClient.invalidateQueries(trpc.agent.getMany.queryOptions());
    },
    onError: (error) => {
      toast.error(`Failed to create agent: ${error.message}`);
    },
  }));
}