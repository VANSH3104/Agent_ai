import React from 'react';
import { CanvasProps } from './schema/canvasschema';
import { Node, Connection } from '../schema/interfaces';

export const NodesRenderer: React.FC<CanvasProps> = ({
  nodes,
  selectedNode,
  setSelectedNode,
  isConnecting,
  connectionStart,
  setIsConnecting,
  setConnectionStart,
  setConnections,
}) => {
  const handleNodeClick = (node: Node, e: React.MouseEvent) => {
    e.stopPropagation();

    if (isConnecting && connectionStart && connectionStart !== node.id) {
      const fromNode = nodes.find((n) => n.id === connectionStart);
      if (!fromNode) return;

      const newConnection: Connection = {
        id: Date.now().toString(),
        fromNodeId: fromNode.id,
        toNodeId: node.id,
        outputIndex: 0

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
        const IconComponent = node.icon;
        const isSelected = selectedNode === node.id;

        return (
          <div
            key={node.id}
            className={`absolute bg-white rounded-lg border-2 shadow-md cursor-pointer transition-all ${
              isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
            }`}
            style={{
              left: node.position.x,
              top: node.position.y,
              width: 100,
              height: 100,
              zIndex: 2,
            }}
            onClick={(e) => handleNodeClick(node, e)}
          >
            <div className="p-3 h-full flex flex-col justify-center items-center">
              <div className={`p-2 rounded-md ${node.color} text-white mb-2`}>
                <IconComponent size={20} />
              </div>
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
