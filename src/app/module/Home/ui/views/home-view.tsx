"use client"
import { useTRPC } from '@/trpc/client';
import { useQuery } from '@tanstack/react-query';
import React from 'react'

export const Homeview=()=> {
    const trpc = useTRPC();
    const { data } = useQuery(trpc.aiAgents.getMany.queryOptions())
  return (
    <div>
      {JSON.stringify(data, null, 2)}
    </div>
  )
}
