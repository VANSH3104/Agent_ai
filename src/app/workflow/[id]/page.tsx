import React from 'react'
// import { WorkflowBuilder } from '@/app/module/agents/workflowpage';
import { getQueryClient } from '@/trpc/server';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { Suspense } from 'react';
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const page =async()=> {
  const session = await auth.api.getSession({
          headers: await headers(),
      })
      if(!session){
          redirect("/sign-in")
    }
  const querryClient = getQueryClient();
  // void querryClient.prefetchQuery(trpc.Noderouter.getMany.queryOptions())
  return (
    <HydrationBoundary state={dehydrate(querryClient)}>
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          {/* <WorkflowBuilder /> */}
        </div>
      </Suspense>
    </HydrationBoundary>
  )
}

export default page;