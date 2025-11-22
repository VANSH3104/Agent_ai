"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { Menu, Settings } from 'lucide-react';
import { NavbarWork } from './components/Navbar/navbarWork';
import { NodeLibrary } from './components/NodeLibrary/Nodelibrary';
import { Canvas } from './Canvas/Canvas';
import { PropertiesPanel } from './PropertiesPanel/PropertiesPanel';
import { useSuspenceAgentId } from '../Agents/server/hooks/agentHook';
import { Node, Edge } from '@xyflow/react';

export const WorkflowBuilder = ({ id }: { id: string }) => {
  const { data } = useSuspenceAgentId(id);
  
  // Initialize nodes and edges from data
  const [nodes, setNodes] = useState<Node[]>(data.Nodes || []);
  const [edges, setEdges] = useState<Edge[]>(data.Edges || []);
  const [selectedNode, setSelectedNode] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);

  // Update nodes/edges if data changes
  useEffect(() => {
    if (data.Nodes) setNodes(data.Nodes);
    if (data.Edges) setEdges(data.Edges);
  }, [data.Nodes, data.Edges]);

  useEffect(() => {
    if (selectedNode) {
      setIsPropertiesOpen(true);
    } else {
      setIsPropertiesOpen(false);
    }
  }, [selectedNode]);

  const handleCloseProperties = () => {
    setIsPropertiesOpen(false);
    setSelectedNode(null);
  };

  // Handler for adding nodes from the library
  const handleAddNode = useCallback((nodeType) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: nodeType.id,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: { 
        label: nodeType.name,
        icon: nodeType.icon,
        color: nodeType.color,
        type: nodeType.id
      },
    };
    
    setNodes((nds) => [...nds, newNode]);
    setIsSidebarOpen(false);
  }, []);

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <NavbarWork workflowName={data.workflow.name} status="Draft" id={id} />
      
      <div className="flex flex-1 overflow-hidden relative">
        <button
          className="lg:hidden fixed top-20 left-4 z-30 p-2 bg-white rounded-md shadow-md border border-gray-200"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu size={20} />
        </button>

        <NodeLibrary 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          setDraggedNode={setDraggedNode}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          onAddNode={handleAddNode}
        />

        <Canvas 
          id={id}
          nodes={nodes}
          setNodes={setNodes}
          edges={edges}
          setEdges={setEdges}
          draggedNode={draggedNode}
          setDraggedNode={setDraggedNode}
          setSelectedNode={setSelectedNode}
        />

        <PropertiesPanel 
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          setNodes={setNodes}
          isOpen={isPropertiesOpen}
          setIsOpen={handleCloseProperties}
        />

        {selectedNode && !isPropertiesOpen && (
          <button
            className="lg:hidden fixed top-20 right-4 z-30 p-2 bg-white rounded-md shadow-md border border-gray-200"
            onClick={() => setIsPropertiesOpen(true)}
          >
            <Settings size={20} />
          </button>
        )}
      </div>
    </div>
  );
}