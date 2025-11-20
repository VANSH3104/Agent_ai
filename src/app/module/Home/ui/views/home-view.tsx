"use client"
import { useCreateAgent, useSuspenceAgent } from '@/app/module/Agents/server/hooks/agentHook'
import { WrapperContainer, WrapperSearch, WrapperUI } from '@/components/ui/wrapperui'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useMemo, useState, useEffect, useTransition, useCallback, useRef } from 'react'
import { AgentCard } from './componentUi/agentcard'

export const Homeview = () => {
  const agents = useSuspenceAgent();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  
  const filteredAgents = useMemo(() => {
    if (!searchQuery) return agents.data;
    
    return agents.data.filter((agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [agents.data, searchQuery]);
  
  return (
    <div className='mt-2 grid gap-4'>
      {filteredAgents.length === 0 ? (
        <div className='text-center py-10 text-muted-foreground'>
          {searchQuery ? `No agents found for "${searchQuery}"` : 'No agents yet'}
        </div>
      ) : (
        filteredAgents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))
      )}
    </div>
  )
}

export const AgentHeader = ({ disabled }: { disabled?: boolean }) => {
  const createAgent = useCreateAgent();
  const router = useRouter();
  
  const handleCreateAgent = useCallback(() => {
    createAgent.mutate(undefined, {
      onSuccess: (data) => {
        router.push(`/agents/${data.newAgent.id}`);
      },
      onError: (error) => {
        console.log(error);
      }
    });
  }, [createAgent, router]);
  
  return (
    <WrapperUI
      title='Agent'
      description='Create and manage your agents'
      newButtonLabel='New Agents'
      disabled={disabled}
      isCreating={createAgent.isPending}
      onNew={handleCreateAgent}
    />
  );
}

export const AgentSearch = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  
  // Local state for input value (instant feedback)
  const [inputValue, setInputValue] = useState(searchParams.get('search') || '');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Sync input with URL params when they change externally
  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    if (currentSearch !== inputValue) {
      setInputValue(currentSearch);
    }
  }, [searchParams]); // Only depend on searchParams
  
  // Debounced URL update effect
  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      
      // Check if inputValue is empty string and remove the param completely
      if (inputValue.trim() === '') {
        params.delete('search');
      } else {
        params.set('search', inputValue);
      }
      
      // Only update URL if there's a change
      const newUrl = params.toString() ? `?${params.toString()}` : '?';
      const currentUrl = searchParams.toString() ? `?${searchParams.toString()}` : '?';
      
      if (newUrl !== currentUrl) {
        startTransition(() => {
          router.push(newUrl, { scroll: false });
        });
      }
    }, 400); // Increased debounce time to 400ms
    
    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [inputValue, router, searchParams]);
  
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);
  
  return (
    <WrapperSearch
      placeholder='Search Agents'
      onChange={handleInputChange}
      value={inputValue}
    />
  );
}

export const AgentContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <WrapperContainer
      header={<AgentHeader />}
      search={<AgentSearch />}
      pagination={<></>}
    >
      {children}
    </WrapperContainer>
  );
}