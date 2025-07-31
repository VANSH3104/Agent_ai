import React, { useRef, useState, useCallback } from 'react';
import { ConnectionLines } from './ConnectionLines';
import { NodesRenderer } from './NodesRenderer';
import { EmptyState } from './EmptyState';


export const Canvas = ({ 
  nodes, 
  connections, 
  selectedNode, 
  setSelectedNode,
  isConnecting,
  setIsConnecting,
  connectionStart,
  setConnectionStart,
  draggedNode,
  setDraggedNode,
  setNodes,
  setConnections
}) => {
  const canvasRef = useRef(null);
  const [touchStart, setTouchStart] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleCanvasClick = useCallback((e) => {
    if (e.target === canvasRef.current) {
      setSelectedNode(null);
      if (isConnecting) {
        setIsConnecting(false);
        setConnectionStart(null);
      }
    }
  }, [isConnecting, setSelectedNode, setIsConnecting, setConnectionStart]);

  const handleNodeDrop = useCallback((e) => {
    e.preventDefault();
    if (!draggedNode) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newNode = {
      id: Date.now().toString(),
      type: draggedNode.id,
      name: draggedNode.name,
      icon: draggedNode.icon,
      color: draggedNode.color,
      x: Math.max(0, x - 75),
      y: Math.max(0, y - 40),
      width: 150,
      height: 80
    };

    setNodes(prev => [...prev, newNode]);
    setDraggedNode(null);
  }, [draggedNode, setNodes, setDraggedNode]);

  const handleTouchStart = useCallback((e) => {
    if (draggedNode) {
      const touch = e.touches[0];
      setTouchStart({ x: touch.clientX, y: touch.clientY });
      setIsDragging(true);
    }
  }, [draggedNode]);

  const handleTouchMove = useCallback((e) => {
    if (isDragging && touchStart) {
      e.preventDefault();
    }
  }, [isDragging, touchStart]);

  const handleTouchEnd = useCallback((e) => {
    if (isDragging && touchStart && draggedNode) {
      const touch = e.changedTouches[0];
      const rect = canvasRef.current.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
        const newNode = {
          id: Date.now().toString(),
          type: draggedNode.id,
          name: draggedNode.name,
          icon: draggedNode.icon,
          color: draggedNode.color,
          x: Math.max(0, x - 75),
          y: Math.max(0, y - 40),
          width: 150,
          height: 80
        };

        setNodes(prev => [...prev, newNode]);
      }
      
      setDraggedNode(null);
      setTouchStart(null);
      setIsDragging(false);
    }
  }, [isDragging, touchStart, draggedNode, setNodes, setDraggedNode]);

  return (
    <div className="flex-1 relative overflow-hidden">
      <div
        ref={canvasRef}
        className="w-full h-full bg-gray-50 relative cursor-default overflow-auto"
        onClick={handleCanvasClick}
        onDrop={handleNodeDrop}
        onDragOver={(e) => e.preventDefault()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      >
        <ConnectionLines connections={connections} />

        <NodesRenderer 
          nodes={nodes}
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          isConnecting={isConnecting}
          connectionStart={connectionStart}
          setIsConnecting={setIsConnecting}
          setConnectionStart={setConnectionStart}
          setConnections={setConnections}
        />

        {nodes.length === 0 && <EmptyState />}

        {isDragging && draggedNode && (
          <div className="lg:hidden fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
            <div className={`p-3 rounded-lg ${draggedNode.color} text-white shadow-lg`}>
              <draggedNode.icon size={24} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};