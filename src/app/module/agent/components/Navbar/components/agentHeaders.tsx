import { useUpdateAgentName } from "@/app/module/Agents/server/hooks/agentHook";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from 'next/link';
import { useEffect, useRef, useState } from "react";

interface AgentHeaderProps {
  id: string;
  workflowName: string;
}

export const WorkflowHeaders = ({id, workflowName}: AgentHeaderProps) => {
  const [name , setName] = useState(workflowName);
  const [isEditing, setIsEditing] = useState(false);
  const inputref = useRef<HTMLInputElement>(null)
  const updateWorkflow = useUpdateAgentName();
  
  useEffect(()=>{
    if(workflowName){
      setName(workflowName)
    }
  }, [workflowName])
  
  useEffect(()=>{
    if(inputref.current && isEditing){
      inputref.current.focus();
      inputref.current.select();
    }
  } , [isEditing])
  
  const handleSave = async() =>{
    if(name === workflowName){
      setIsEditing(false);
      return;
    }
    setIsEditing(false);
    try{
      await updateWorkflow.mutateAsync({id, name});
    }catch {
      setName(workflowName);
    }
    finally{
      setIsEditing(false);
    }
    
  }
  
  const haveEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if(e.key === 'Enter'){
      handleSave();
    }
    if(e.key === 'Escape'){
      setName(workflowName);
      setIsEditing(false);
    } 
  }
  
  if(isEditing){
    return (
      <input
        ref={inputref}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={haveEnter}
        onBlur={handleSave}
        className="border border-gray-300 rounded-md px-2 py-1"
      />
    );
  }
  
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem
          onClick={()=>setIsEditing(true)}
          className="hover:text-foreground cursor-pointer transition-colors"
        >
          {workflowName}
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};