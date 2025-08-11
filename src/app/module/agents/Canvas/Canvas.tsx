"use client";
import React, { useRef, useState, useCallback } from 'react';
import { ConnectionLines } from './ConnectionLines';
import { NodesRenderer } from './NodesRenderer';
import { EmptyState } from './EmptyState';
import { CanvasProps } from './schema/canvasschema';
import { useParams } from 'next/navigation';
import { useTRPC } from '@/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Node } from '../schema/interfaces';

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
}: CanvasProps) => {
  const params = useParams();
  const queryClient = useQueryClient();
  const workflowId = typeof params.id === "string" ? params.id : "";
  const trpc = useTRPC();
  const canvasRef = useRef<HTMLDivElement | null>(null);
  
  // Touch and drag states
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggingNode, setDraggingNode] = useState<Node | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [ghostPosition, setGhostPosition] = useState<{x: number, y: number} | null>(null);
  
  // New states for improved dragging
  const [dragStartTime, setDragStartTime] = useState<number>(0);
  const [isDragPreview, setIsDragPreview] = useState(false);
  const [dragVelocity, setDragVelocity] = useState({ x: 0, y: 0 });
  const [lastDragPosition, setLastDragPosition] = useState({ x: 0, y: 0 });
  const [snapToGrid, setSnapToGrid] = useState(false);

  const GRID_SIZE = 20;
  const DRAG_THRESHOLD = 5; // pixels to move before considering it a drag

  // Utility function to snap to grid
  const snapPositionToGrid = useCallback((position: { x: number; y: number }) => {
    if (!snapToGrid) return position;
    return {
      x: Math.round(position.x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(position.y / GRID_SIZE) * GRID_SIZE
    };
  }, [snapToGrid]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === canvasRef.current) {
      setSelectedNode(null);
      if (isConnecting) {
        setIsConnecting(false);
        setConnectionStart(null);
      }
    }
  }, [isConnecting, setSelectedNode, setIsConnecting, setConnectionStart]);

  const { mutate: createNodeMutate } = useMutation(
    trpc.Noderouter.create.mutationOptions({
      onSuccess: async(createdNode) => {
        setNodes(prev => [...prev, createdNode as Node]);
        await queryClient.invalidateQueries(
          trpc.Noderouter.getMany.queryOptions(),
        )
      },
      onError: (error) => {
        console.error("Failed to create node:", error);
      }
    })
  );

  const { mutate: updatePositionMutate } = useMutation(
    trpc.Noderouter.updatePosition.mutationOptions({
      onSuccess: async({ id, position }) => {
        setNodes(prev =>
          prev.map(node =>
            node.id === id ? { ...node, position } : node
          )
        );
        await queryClient.invalidateQueries(
          trpc.Noderouter.getMany.queryOptions(),
        )
      },
      onError: (error) => {
        console.error("Failed to update position:", error);
      },
    })
  );

  const createNewNode = (x: number, y: number) => {
    if (!draggedNode) return null;

    const snappedPosition = snapPositionToGrid({ x, y });
    return {
      workflowId: workflowId as string,
      type: "Trigger",
      name: "webhook",
      position: snappedPosition,
      parameters: {},
      credentials: {},
      subWorkflowId: null,
    };
  };

  const handleNodeDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedNode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newNodeData = createNewNode(x, y);
    if (newNodeData) {
      createNodeMutate(newNodeData);
    }
    setDraggedNode(null);
    setIsDragPreview(false);
  }, [draggedNode, createNodeMutate, setDraggedNode, snapPositionToGrid]);

  const handleDragStart = useCallback((node: Node, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const currentTime = Date.now();
    setDragStartTime(currentTime);
    setDraggingNode(node);
    setIsDragPreview(false);
    
    const pos = typeof node.position === 'string' ? JSON.parse(node.position) : node.position;
    const clientRect = canvasRef.current?.getBoundingClientRect();
    
    if (clientRect) {
      const canvasX = e.clientX - clientRect.left;
      const canvasY = e.clientY - clientRect.top;
      
      setDragOffset({
        x: canvasX - pos.x,
        y: canvasY - pos.y
      });
    }
    
    setGhostPosition(pos);
    setLastDragPosition({ x: e.clientX, y: e.clientY });
    
    // Add cursor change to body
    document.body.style.cursor = 'grabbing';
  }, []);

  const handleDrag = useCallback((e: React.MouseEvent) => {
    if (!draggingNode || !canvasRef.current) return;
    e.preventDefault();

    const currentTime = Date.now();
    const timeSinceDragStart = currentTime - dragStartTime;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    
    // Calculate velocity for smooth animations
    const deltaTime = currentTime - (lastDragPosition.time || currentTime);
    if (deltaTime > 0) {
      setDragVelocity({
        x: (e.clientX - lastDragPosition.x) / deltaTime,
        y: (e.clientY - lastDragPosition.y) / deltaTime
      });
    }
    
    setLastDragPosition({ x: e.clientX, y: e.clientY, time: currentTime });
    
    // Only show drag preview after threshold time and distance
    if (timeSinceDragStart > 100) {
      setIsDragPreview(true);
    }
    
    const newPosition = {
      x: canvasX - dragOffset.x,
      y: canvasY - dragOffset.y
    };
    
    const snappedPosition = snapPositionToGrid(newPosition);
    setGhostPosition(snappedPosition);
  }, [draggingNode, dragOffset, dragStartTime, lastDragPosition, snapPositionToGrid]);

  const handleDragEnd = useCallback(() => {
    if (draggingNode && ghostPosition) {
      // Add a smooth transition effect
      const timeSinceDragStart = Date.now() - dragStartTime;
      
      // Only update position if it was a meaningful drag (not just a click)
      if (timeSinceDragStart > 150) {
        updatePositionMutate({
          id: draggingNode.id,
          position: ghostPosition
        });
      }
    }
    
    // Reset all drag states
    setDraggingNode(null);
    setGhostPosition(null);
    setIsDragPreview(false);
    setDragVelocity({ x: 0, y: 0 });
    
    // Reset cursor
    document.body.style.cursor = '';
  }, [draggingNode, ghostPosition, updatePositionMutate, dragStartTime]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (draggedNode) {
      const touch = e.touches[0];
      setTouchStart({ x: touch.clientX, y: touch.clientY });
      setIsDragging(true);
    }
  }, [draggedNode]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (isDragging && touchStart) {
      e.preventDefault();
    }
  }, [isDragging, touchStart]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (isDragging && touchStart && draggedNode && canvasRef.current) {
      const touch = e.changedTouches[0];
      const rect = canvasRef.current.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
        const newNodeData = createNewNode(x, y);
        if (newNodeData) {
          createNodeMutate(newNodeData);
        }
      }

      setDraggedNode(null);
      setTouchStart(null);
      setIsDragging(false);
    }
  }, [isDragging, touchStart, draggedNode, createNodeMutate, setDraggedNode, snapPositionToGrid]);

  // Keyboard handler for toggling snap to grid
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Shift' && draggingNode) {
      setSnapToGrid(true);
    }
  }, [draggingNode]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      setSnapToGrid(false);
    }
  }, []);
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <div className="flex-1 relative overflow-hidden">
      <div
        ref={canvasRef}
        className={`w-full h-full bg-gray-50 relative overflow-auto transition-all duration-200 ${
          draggingNode ? 'cursor-grabbing' : 'cursor-default'
        }`}
        onClick={handleCanvasClick}
        onDrop={handleNodeDrop}
        onDragOver={(e) => e.preventDefault()}
        onMouseMove={handleDrag}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          backgroundImage: `radial-gradient(circle, ${snapToGrid ? '#3b82f6' : '#e5e7eb'} 1px, transparent 1px)`,
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
          backgroundPosition: snapToGrid ? '0 0' : 'initial'
        }}
      >
        <ConnectionLines connections={connections} />

        <NodesRenderer
          id={workflowId}
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          isConnecting={isConnecting}
          connectionStart={connectionStart}
          setIsConnecting={setIsConnecting}
          setConnectionStart={setConnectionStart}
          setConnections={setConnections}
          onDragStart={handleDragStart}
        />
        {draggingNode && ghostPosition && isDragPreview && (
          <div
            className="absolute rounded-lg border-2 shadow-xl pointer-events-none transition-all duration-150 ease-out"
            style={{
              left: ghostPosition.x,
              top: ghostPosition.y,
              width: 100,
              height: 100,
              zIndex: 1000,
              transform: `scale(1.05) rotate(${Math.sin(Date.now() / 1000) * 2}deg)`,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.95) 100%)',
              borderColor: snapToGrid ? '#3b82f6' : '#10b981',
              boxShadow: `
                0 20px 25px -5px rgba(0, 0, 0, 0.1),
                0 10px 10px -5px rgba(0, 0, 0, 0.04),
                0 0 0 1px rgba(0, 0, 0, 0.05),
                ${snapToGrid ? '0 0 20px rgba(59, 130, 246, 0.3)' : '0 0 20px rgba(16, 185, 129, 0.3)'}
              `,
              backdropFilter: 'blur(8px)',
            }}
          >
            <div className="p-3 h-full flex flex-col justify-center items-center relative">
              <div 
                className="absolute inset-0 rounded-lg border-2 opacity-50 animate-ping"
                style={{ 
                  borderColor: snapToGrid ? '#3b82f6' : '#10b981',
                  animationDuration: '2s'
                }}
              />

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-6 h-6 mb-1 opacity-80">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="text-gray-600">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700 text-center line-clamp-2">
                  {draggingNode.name}
                </span>
              </div>
              {Math.abs(dragVelocity.x) > 0.5 || Math.abs(dragVelocity.y) > 0.5 ? (
                <div 
                  className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full opacity-60 animate-pulse"
                  style={{
                    transform: `translate(${dragVelocity.x * 2}px, ${dragVelocity.y * 2}px)`
                  }}
                />
              ) : null}
            </div>
          </div>
        )}
        {snapToGrid && draggingNode && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
            <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg flex items-center space-x-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
              </svg>
              <span>Snap to Grid</span>
            </div>
          </div>
        )}
        {isDragging && draggedNode && (
          <div className="lg:hidden fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
            <div className={`p-4 rounded-2xl shadow-2xl transition-all duration-300 ${draggedNode.color} text-white animate-bounce`}>
              {React.createElement(draggedNode.icon, { size: 32 })}
              <div className="absolute -inset-2 rounded-2xl border-4 border-white opacity-50 animate-ping" />
            </div>
          </div>
        )}

        {draggingNode && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
            <div className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg flex items-center space-x-2">
              <span>Hold Shift to snap to grid</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};