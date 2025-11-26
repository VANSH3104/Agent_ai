"use client"
import { useCallback, useRef, useState } from 'react';
import { 
  ReactFlow, 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge, 
  Node, 
  Edge, 
  NodeChange, 
  EdgeChange, 
  Background, 
  Controls, 
  MiniMap,
  Connection,
  ReactFlowInstance
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeComponents } from '@/app/config/Nodetype';
import ButtonEdgeDelete from "@/components/Nodes/edgeButton"
import { useSetAtom } from 'jotai';
import { editorAtom } from './store/atomsNode';
import { toast } from 'sonner';
import { useCreateNode } from '../../Agents/server/hooks/agentHook';


interface CanvasProps {
  id: string;
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  draggedNode: any;
  setDraggedNode: (node: any) => void;
  setSelectedNode: (node: any) => void;
}

export function Canvas({ 
  id, 
  nodes, 
  setNodes, 
  edges, 
  setEdges, 
  draggedNode, 
  setDraggedNode,
  setSelectedNode 
}: CanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const createNodeMutation = useCreateNode();

  const setcanvas = useSetAtom(editorAtom);
  
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges],
  );

  const onConnect = useCallback(
      (params: Connection) => {
        const newEdge = {
          ...params,
          type: 'buttonedge',
          id: `edge-${params.source}-${params.target}-${Date.now()}`
        };
        setEdges((eds) => addEdge(newEdge, eds));
      },
      [setEdges],
    );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
    },
    [setSelectedNode],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
  
      if (!reactFlowInstance) {
        console.error('React Flow instance not initialized');
        toast.error('Canvas not ready. Please try again.');
        return;
      }
  
      let nodeData = draggedNode;
      
      if (!nodeData) {
        try {
          const dragData = event.dataTransfer.getData('application/reactflow');
          if (dragData) {
            nodeData = JSON.parse(dragData);
          }
        } catch (error) {
          console.error('Error parsing drag data:', error);
        }
      }
  
      console.log('Node data on drop:', nodeData);
      
      if (!nodeData) {
        console.error('No node data available for drop');
        toast.error('Failed to add node. Please try again.');
        return;
      }
  
      const schemaType = nodeData.schemaType || nodeData.type || 'MANUAL';
      const nodeType = nodeData.id || nodeData.type || 'manual';
      
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
  
      const tempId = `node-${Date.now()}`;
      
      // FIXED: Properly construct the data object with workflowId
      const nodeDataWithWorkflowId = {
        label: nodeData.name || nodeData.label || 'New Node',
        icon: nodeData.icon,
        iconName: nodeData.iconName,
        color: nodeData.color,
        type: nodeType,
        schemaType: schemaType,
        workflowId: id,
      };
      
      const newNode: Node = {
        id: tempId,
        type: nodeType,
        position,
        data: nodeDataWithWorkflowId,
      };
      
      console.log('Creating node with data:', newNode.data);
      
      setNodes((nds) => [...nds, newNode]);
      
      createNodeMutation.mutate({
        workflowId: id,
        type: schemaType,
        position: position,
        data: nodeDataWithWorkflowId
      }, {
        onSuccess: (data) => {
          console.log('Node saved successfully:', data);
          setNodes((nds) => 
            nds.map(node => 
              node.id === tempId 
                ? { 
                    ...node, 
                    id: data.newNode.id,
                    data: {
                      ...node.data,
                      workflowId: id
                    }
                  } 
                : node
            )
          );
          toast.success('Node added successfully');
        },
        onError: (error) => {
          console.error('Failed to save node:', error);
          setNodes((nds) => nds.filter(node => node.id !== tempId));
          toast.error(`Failed to save node: ${error.message}`);
        }
      });
  
      setDraggedNode(null);
    },
    [reactFlowInstance, draggedNode, setNodes, setDraggedNode, id, createNodeMutation],
  );
  const edgeTypes = {
    buttonedge: ButtonEdgeDelete,
  };
  const onInit = useCallback((instance: ReactFlowInstance) => {
    console.log('React Flow initialized');
    setReactFlowInstance(instance);
    setcanvas(instance);
  }, [setcanvas]);
  
  
  
  return (
    <div className='size-full' ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={onInit}
        nodeTypes={nodeComponents}
        fitView
        edgeTypes={edgeTypes}
        proOptions={{
          hideAttribution: true
        }}
      >
        <Controls />
        <MiniMap />
        <Background variant="cross" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}