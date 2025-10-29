"use client"
import { useTRPC } from '@/trpc/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react'
export const Homeview=()=> {
    const trpc = useTRPC();
    const querryClient = useQueryClient();
    // const { data } = useQuery(trpc.workflow.getMany.queryOptions())
    const { data } = useQuery(trpc.getWorkflows.queryOptions());
    const create = useMutation(trpc.createWorkflow.mutationOptions({
      onSuccess: ()=>{
        querryClient.invalidateQueries(trpc.getWorkflows.queryOptions())
      }
    }));
    
  return (
    <div>
      {JSON.stringify(data, null, 2)}
      {/* {JSON.stringify(nodes)} */}
      <button  disabled = {create.isPending} onClick={()=> create.mutate()}>Create Workflow

      </button>
    </div>
  )
}
