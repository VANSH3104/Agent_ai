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
      console.log(data);
      toast.success(`Agent ${data.newAgent.name} created successfully`);
      queryClient.invalidateQueries(trpc.agent.getMany.queryOptions());
    },
    onError: (error) => {
      toast.error(`Failed to create agent: ${error.message}`);
    },
  }));
}
export const useDeteleteAgent =()=>{
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  return useMutation(trpc.agent.remove.mutationOptions({
    onSuccess: (data) => {
      console.log('Delete response here:', data);
      toast.success(`Agent deleted successfully`);
      queryClient.invalidateQueries(trpc.agent.getMany.queryOptions());
      queryClient.invalidateQueries(trpc.agent.getOne.queryOptions({id: data.id}));
    },
    onError: (error) => {
      toast.error(`Failed to create agent: ${error.message}`);
    },
  }));
}
export const useUpdateAgentName =()=>{
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  return useMutation(trpc.agent.updateName.mutationOptions({
    onSuccess: (data) => {
      console.log(data);
      toast.success(`Agent ${data?.name} updated successfully`);
      queryClient.invalidateQueries(trpc.agent.getMany.queryOptions());
      queryClient.invalidateQueries(trpc.agent.getOne.queryOptions({id: data.id}));
    },
    onError: (error) => {
      toast.error(`Failed to create agent: ${error.message}`);
    },
  }));
}

export const useSuspenceAgentId = (id: string)=>{
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.agent.getOne.queryOptions({id}))
  
}

export const useCreateNode = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  
  return useMutation(trpc.agent.createNode.mutationOptions({
    onSuccess: (data) => {
      console.log('Node created successfully:', data);
      toast.success(`Node created successfully`);
      // Invalidate the specific workflow query to refresh the data
      queryClient.invalidateQueries(trpc.agent.getOne.queryOptions({ id: data.newNode.workflowId }));
    },
    onError: (error) => {
      console.error('Failed to create node:', error);
      toast.error(`Failed to create node: ${error.message}`);
    },
  }));
};
export const useUpdateAgent =()=>{
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  return useMutation(trpc.agent.update.mutationOptions({
    onSuccess: (data) => {
      console.log(data);
      toast.success(`Agent ${data?.name} updated successfully`);
      queryClient.invalidateQueries(trpc.agent.getMany.queryOptions());
      queryClient.invalidateQueries(trpc.agent.getOne.queryOptions({id: data.id}));
    },
    onError: (error) => {
      toast.error(`Failed to save agent flow: ${error.message}`);
    },
  }));
}
