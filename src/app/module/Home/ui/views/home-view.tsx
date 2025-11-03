"use client"

import { WrapperContainer, WrapperUI } from '@/components/ui/wrapperui'
import React from 'react'
export const Homeview=()=> {
    // const { data } = useQuery(trpc.workflow.getMany.queryOptions()
    
  return (
    <div className='mt-40 bg-red-400 h-full'>
      s
    </div>
  )
}
export const AgentHeader = ({ disabled }: { disable?: boolean }) => {
  return (
    <>
      <WrapperUI
        title='Agent'
        description='Create and manage your agents'
        newButtonLablel='New Agents'
        disabled={disabled}
        isCreating={false}
        onNew={() => { }}
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