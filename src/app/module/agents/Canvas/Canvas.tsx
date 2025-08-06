"use client";
import React, { useRef, useState, useCallback } from 'react';
import { ConnectionLines } from './ConnectionLines';
import { NodesRenderer } from './NodesRenderer';
import { EmptyState } from './EmptyState';
import { CanvasProps } from './schema/canvasschema';
import { useParams } from 'next/navigation';
import { useTRPC } from '@/trpc/client';
import { useMutation } from '@tanstack/react-query';
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
  const params  = useParams();
  const workflowId = typeof params.id === "string" ? params.id : "";
  const trpc = useTRPC();
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === canvasRef.current) {
      setSelectedNode(null);
      if (isConnecting) {
        setIsConnecting(false);
        setConnectionStart(null);
      }
    }
  }, [isConnecting, setSelectedNode, setIsConnecting, setConnectionStart]);

  const { mutate: createNodeMutate, isPending: isCreatingNode } = useMutation(
    trpc.Noderouter.create.mutationOptions({
      onSuccess: (createdNode) => {
        setNodes(prev => [...prev, createdNode as Node]);
        alert("Node created successfully");
      },
      onError: (error) => {
        console.error("Failed to create node:", error);
        alert("Failed to create node");
      }
    })
  );

  const createNewNode = (x: number, y: number) => {
    if (!draggedNode) return null;

    return {
      workflowId: workflowId as string,
      type: "Trigger",
      name: "webhook",
      position: { x, y },
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
  }, [draggedNode, createNodeMutate, setDraggedNode]);

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
  }, [isDragging, touchStart, draggedNode, createNodeMutate, setDraggedNode]);

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
          id = {workflowId}
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          isConnecting={isConnecting}
          connectionStart={connectionStart}
          setIsConnecting={setIsConnecting}
          setConnectionStart={setConnectionStart}
          setConnections={setConnections}
        />

        {/* {nodes.length === 0 && <EmptyState />} */}

        {isDragging && draggedNode && (
          <div className="lg:hidden fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
            <div className={`p-3 rounded-lg ${draggedNode.color} text-white shadow-lg`}>
              {React.createElement(draggedNode.icon, { size: 24 })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
