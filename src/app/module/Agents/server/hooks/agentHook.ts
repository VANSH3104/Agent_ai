import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient, UseQueryResult, useSuspenseQuery } from "@tanstack/react-query";
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


export const useTriggerWorkflow = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  
  return useMutation(trpc.agent.triggerWorkflow.mutationOptions({
    onSuccess: (data, variables) => {
      console.log('Workflow triggered:', data);
      toast.success(`Workflow triggered in ${variables.mode} mode`);
      // Invalidate executions query to show the new execution
      queryClient.invalidateQueries({
        queryKey: trpc.agent.getWorkflowExecutions.queryOptions({ 
          workflowId: variables.workflowId 
        }).queryKey
      });
    },
    onError: (error) => {
      console.error('Failed to trigger workflow:', error);
      toast.error(`Failed to trigger workflow: ${error.message}`);
    },
  }));
};

export const useWorkflowExecutions = (workflowId: string, limit?: number) => {
  const trpc = useTRPC();
  
  return useQuery(
    trpc.agent.getWorkflowExecutions.queryOptions({ 
      workflowId, 
      limit: limit || 50 
    })
  );
};

export const useExecutionLogs = (executionId: string) => {
  const trpc = useTRPC();
  
  return useQuery(
    trpc.agent.getExecutionLogs.queryOptions({ executionId })
  );
};

export const useRemoveNode = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
    
  return useMutation(trpc.agent.removeNode.mutationOptions({
    onSuccess: (data) => {
      console.log('Node deletion response:', data);
      toast.success(`Node deleted successfully`);
      queryClient.invalidateQueries(trpc.agent.getOne.queryOptions({id: data.workflowId}))
      queryClient.invalidateQueries(trpc.agent.getOne.queryOptions({id: data.deletedNodeId}));
    },
    onError: (error) => {
      toast.error(`Failed to create agent: ${error.message}`);
    },
  }));
};

// kafka workflow executions
export const useNodesMany = (workflowId?: string) => {
  const trpc = useTRPC();
  
  return useQuery(
    trpc.kafka.Many.queryOptions({ workflowId: workflowId ?? "" })
  );
};

export const useTriggerAgent = () => {
  const trpc = useTRPC();

  return useMutation(trpc.kafka.trigger.mutationOptions({
    onSuccess: (data) => {
      console.log("Agent triggered, execution:", data);
      toast.success("Agent triggered", data);
    },
    onError: (err) => {
      console.error("Trigger agent failed", err);
    }
  }));
};
