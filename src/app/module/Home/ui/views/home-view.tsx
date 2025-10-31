"use client"
import { Button } from '@/components/ui/button';
import { useTRPC } from '@/trpc/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react'
export const Homeview=()=> {
    const trpc = useTRPC();
    const querryClient = useQueryClient();
    // const { data } = useQuery(trpc.workflow.getMany.queryOptions())
    const { data } = useQuery(trpc.getWorkflows.queryOptions());
    const ai = useMutation(trpc.testAi.mutationOptions({
      onSuccess: ()=>{
        querryClient.invalidateQueries(trpc.getWorkflows.queryOptions())
      }
    }));
    const create = useMutation(trpc.createWorkflow.mutationOptions({
      onSuccess: ()=>{
        querryClient.invalidateQueries(trpc.getWorkflows.queryOptions())
      }
    }));
    
  return (
    <div>
      {JSON.stringify(data, null, 2)}
      {JSON.stringify(ai.data)}
      {/* {JSON.stringify(nodes)} */}
      <Button disabled={ai.isPending} onClick={()=>ai.mutate()}>test ai </Button>
      <button  disabled = {create.isPending} onClick={()=> create.mutate()}>Create Workflow

      </button>
    </div>
  )
}
