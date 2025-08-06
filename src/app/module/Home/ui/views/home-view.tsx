"use client"
import { useTRPC } from '@/trpc/client';
import { useQuery } from '@tanstack/react-query';
import React from 'react'

export const Homeview=()=> {
    const trpc = useTRPC();
    // const { data } = useQuery(trpc.workflow.getMany.queryOptions())
    const { data } = useQuery(trpc.Noderouter.getMany.queryOptions());
  return (
    <div>
      {JSON.stringify(data, null, 2)}
      {/* {JSON.stringify(nodes)} */}
    </div>
  )
}
