"use client"
import React, { useState, useEffect } from 'react';
import { Menu, Settings } from 'lucide-react';
import { NavbarWork } from './components/Navbar/navbarWork';
import { NodeLibrary } from './components/NodeLibrary/Nodelibrary';
import { Canvas } from './Canvas/Canvas';
import { PropertiesPanel } from './PropertiesPanel/PropertiesPanel';

export const WorkflowBuilder = () => {
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
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

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <NavbarWork />

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
          setNodes={setNodes}
        />

        <Canvas 
          nodes={nodes}
          connections={connections}
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          isConnecting={isConnecting}
          setIsConnecting={setIsConnecting}
          connectionStart={connectionStart}
          setConnectionStart={setConnectionStart} 
          draggedNode={draggedNode}
          setDraggedNode={setDraggedNode}
          setNodes={setNodes}
          setConnections={setConnections}
        />

        <PropertiesPanel 
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          setNodes={setNodes}
          setConnections={setConnections}
          isOpen={isPropertiesOpen}
          setIsOpen={handleCloseProperties} // Use the handler here
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
};