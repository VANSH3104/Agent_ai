"use client"

import { useCreateAgent, useSuspenceAgent } from '@/app/module/Agents/server/hooks/agentHook'
import { WrapperContainer, WrapperUI } from '@/components/ui/wrapperui'
import { useRouter } from 'next/navigation'
import React from 'react'
export const Homeview=()=> {
  const agents = useSuspenceAgent();
  
    
  return (
    <div className=' mt-2 '>
      {agents.data.map((agent)=>(
        <div key={agent.id}>{agent.name}</div>
      ))}
    </div>
  )
}
export const AgentHeader = ({ disabled }: { disabled?: boolean }) => {
  const createAgent = useCreateAgent();
  const router = useRouter()
  const handleCreateAgent = () =>{
    createAgent.mutate(undefined , {
      onSuccess:(data)=>{
        router.push(`/agents/${data?.id}`);
      },
      onError:(error)=>{
        //open upgrade modal
        console.log(error)
      }
    })
  }
  return (
    <>
      <WrapperUI
        title='Agent'
        description='Create and manage your agents'
        newButtonLabel='New Agents'
        disabled={disabled}
        isCreating={createAgent.isPending}
        onNew={handleCreateAgent}
      />
    </>
  )
}
export const AgentContainer = ({children}:{children:React.ReactNode})=>{
  return (
    <WrapperContainer
      header={<AgentHeader />}
      search={<></>}
      pagination={<></>}
    >
      {children}
    </WrapperContainer>
  )
}