  "use client"
  import { useCallback, useRef } from 'react';
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
    Connection
  } from '@xyflow/react';
  import '@xyflow/react/dist/style.css';
  import { nodeComponents } from '@/app/config/Nodetype';
  
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
    const reactFlowInstance = useRef<any>(null);
  
    const onNodesChange = useCallback(
      (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
      [setNodes],
    );
  
    const onEdgesChange = useCallback(
      (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
      [setEdges],
    );
  
    const onConnect = useCallback(
      (params: Connection) => setEdges((eds) => addEdge(params, eds)),
      [setEdges],
    );
  
    const onNodeClick = useCallback(
      (event: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
      },
      [setSelectedNode],
    );  
  
    // Handle drag and drop from node library
    const onDragOver = useCallback((event: React.DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }, []);
  
    const onDrop = useCallback(
      (event: React.DragEvent) => {
        event.preventDefault();
  
        if (!draggedNode || !reactFlowInstance.current) return;
  
        const bounds = reactFlowWrapper.current?.getBoundingClientRect();
        if (!bounds) return;
  
        const position = reactFlowInstance.current.screenToFlowPosition({
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        });
        console.log(draggedNode , 'node')
        const newNode: Node = {
          id: `node-${Date.now()}`,
          type: draggedNode.id,
          position,
          data: {
            label: draggedNode.name,
            icon: draggedNode.icon,
            color: draggedNode.color,
            type: draggedNode.id
          },
        };
        
        setNodes((nds) => [...nds, newNode]);
        setDraggedNode(null);
      },
      [draggedNode, setNodes, setDraggedNode],
    );
  
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
          onInit={(instance) => (reactFlowInstance.current = instance)}
          nodeTypes={nodeComponents}
          fitView
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