"use client";

import { memo } from "react";
import { NodeProps } from "@xyflow/react";
import { PlaceholderNode } from "./otherUi/placeholder-node";
import { PlusIcon } from "lucide-react";
import { AgentNode } from "./Nodes/agentNode";
export const InitialNode = memo((props: NodeProps)=>{
  return (
    <AgentNode showToolbar={true}>
        <PlaceholderNode {...props} onClick={()=>{}}>
          <div className="cursor-pointer flex items-center justify-center">
            <PlusIcon className ="size-2"/>
          </div>
        </PlaceholderNode>
    </AgentNode>
  )
})


InitialNode.displayName = "InitialNode";