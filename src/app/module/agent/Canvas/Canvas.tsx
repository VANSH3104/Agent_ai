"use client"
import { useState, useCallback } from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge, Node, Edge, NodeChange, EdgeChange, Background, Controls, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useSuspenceAgentId } from '../../Agents/server/hooks/agentHook';
import { NodeComponent } from '@/app/config/Nodetype';
 
 
export function Canvas({ id }:{id:string}) {
  const {data} = useSuspenceAgentId(id)
  const [nodes, setNodes] = useState<Node[]>(data.Nodes);
  const [edges, setEdges] = useState<Edge[]>(data.Edges);
 
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange []) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );
  const onConnect = useCallback(
    (params: Edge) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );
  
  return (
    <div className='size-full'>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={()=>onConnect}
        nodeTypes={NodeComponent}
        fitView
        proOptions={{
          hideAttribution: true
        }}
      >
        
        <Controls />
          <MiniMap   />
          <Background variant="cross" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}