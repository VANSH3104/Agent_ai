"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { Menu, Settings } from 'lucide-react';
import { NavbarWork } from './components/Navbar/navbarWork';
import { NodeLibrary } from './components/NodeLibrary/Nodelibrary';
import { Canvas } from './Canvas/Canvas';
import { PropertiesPanel } from './PropertiesPanel/PropertiesPanel';
import { useSuspenceAgentId } from '../Agents/server/hooks/agentHook';
import { Node, Edge } from '@xyflow/react';
import { 
  Webhook, 
  Play, 
  Calendar, 
  Globe2, 
  Database, 
  Send, 
  FileCode, 
  Split, 
  Shuffle 
} from 'lucide-react';
import { SiGoogleforms } from 'react-icons/si';

// Icon mapping - MUST match iconName in nodetypes.ts
const iconMap: Record<string, any> = {
  'Webhook': Webhook,
  'Play': Play,
  'Calendar': Calendar,
  'Globe2': Globe2,
  'Database': Database,
  'Send': Send,
  'FileCode': FileCode,
  'Split': Split,
  'SiGoogleforms': SiGoogleforms,
  'Shuffle': Shuffle
};

export const WorkflowBuilder = ({ id }: { id: string }) => {
  const { data } = useSuspenceAgentId(id);
  
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);

  // Process and load nodes from database
  useEffect(() => {
    console.log('=== Loading workflow data ===');
    console.log('Raw data:', data);
    
    if (data.Nodes && Array.isArray(data.Nodes)) {
      const processedNodes = data.Nodes.map((node: any) => {
        console.log('Processing node:', node);
        
        // Get icon name from node data
        const iconName = node.data?.iconName;
        const iconComponent = iconName && iconMap[iconName] ? iconMap[iconName] : null;
        
        console.log('Icon info:', { 
          iconName, 
          hasComponent: !!iconComponent,
          nodeType: node.type,
          nodeData: node.data 
        });
        
        return {
          id: node.id,
          type: node.type, // Should be lowercase like 'webhook'
          position: node.position || { x: 0, y: 0 },
          data: {
            ...node.data,
            icon: iconComponent, // Mapped icon component
          }
        };
      });
      
      console.log('Processed nodes for React Flow:', processedNodes);
      setNodes(processedNodes);
    }
    
    if (data.Edges && Array.isArray(data.Edges)) {
      console.log('Loading edges:', data.Edges);
      setEdges(data.Edges);
    }
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

  const handleAddNode = useCallback((nodeType: any) => {
    console.log('Adding node via tap:', nodeType);
    
    const tempId = `node-${Date.now()}`;
    const position = { 
      x: Math.random() * 400 + 100, 
      y: Math.random() * 400 + 100 
    };
    
    const newNode: Node = {
      id: tempId,
      type: nodeType.id,
      position: position,
      data: { 
        label: nodeType.name,
        icon: nodeType.icon,
        iconName: nodeType.iconName,
        color: nodeType.color,
        type: nodeType.id,
        schemaType: nodeType.schemaType
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
          workflowId={id}
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