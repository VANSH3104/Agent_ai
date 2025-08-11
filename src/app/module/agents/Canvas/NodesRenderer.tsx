"use client";
import React from 'react';
import { CanvasProps } from './schema/canvasschema';
import { Node, Connection } from '../schema/interfaces';
import { useTRPC } from '@/trpc/client';
import { useQuery } from '@tanstack/react-query';

export const NodesRenderer: React.FC<CanvasProps & { onDragStart: (node: Node, e: React.MouseEvent) => void }> = ({
  id,
  selectedNode,
  setSelectedNode,
  isConnecting,
  connectionStart,
  setIsConnecting,
  setConnectionStart,
  setConnections,
  onDragStart,
}) => {
  const trpc = useTRPC();
  const { data: nodes = [] } = useQuery(trpc.Noderouter.getMany.queryOptions({ workflowId: id }));
  console.log(nodes , "data")
  const handleNodeClick = (node: Node, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isConnecting && connectionStart && connectionStart !== node.id) {
      const fromNode = nodes.find((n) => n.id === connectionStart);
      if (!fromNode) return;

      const newConnection: Connection = {
        id: Date.now().toString(),
        fromNodeId: fromNode.id,
        toNodeId: node.id,
        outputIndex: 0,
      };

      setConnections((prev) => [...prev, newConnection]);
      setIsConnecting(false);
      setConnectionStart(null);
    } else {
      setSelectedNode(node.id);
    }
  };

  const startConnection = (node: Node, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConnecting(true);
    setConnectionStart(node.id);
  };

  return (
    <>
      {nodes.map((node) => {
        const isSelected = selectedNode === node.id;
        let x = 0;
        let y = 0;
        try {
          const pos = typeof node.position === "string" ? JSON.parse(node.position) : node.position;
          x = pos?.x ?? 0;
          y = pos?.y ?? 0;
        } catch (e) {
          console.error("Invalid node position", node.position);
        }

        return (
          <div
            key={node.id}
            className={`absolute bg-white rounded-lg border-2 shadow-md cursor-move transition-all ${
              isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
            }`}
            style={{
              left: x,
              top: y,
              width: 100,
              height: 100,
              zIndex: 2,
            }}
            onClick={(e) => handleNodeClick(node, e)}
            onMouseDown={(e) => {
              // Only start drag on left mouse button
              if (e.button === 0) {
                onDragStart(node, e);
              }
            }}
          >
            <div className="p-3 h-full flex flex-col justify-center items-center">
              <span className="text-xs font-medium text-gray-700 text-center line-clamp-2">
                {node.name}
              </span>
            </div>

            {/* Output handle */}
            <div
              className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white cursor-pointer hover:bg-blue-600 hover:scale-110 transition-all"
              onClick={(e) => startConnection(node, e)}
            />
            {/* Input handle */}
            <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gray-400 rounded-full border-2 border-white" />
          </div>
        );
      })}
    </>
  );
};