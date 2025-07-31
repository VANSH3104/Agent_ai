import { WorkflowBuilder } from '@/app/module/agents/workflowpage';
import { getQueryClient } from '@/trpc/server';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { Suspense } from 'react';

import React from 'react'

const page =()=> {
  const querryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(querryClient)}>
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <WorkflowBuilder />
        </div>
      </Suspense>
    </HydrationBoundary>
  )
}

export default page;