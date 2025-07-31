import React from 'react';
//@ts-expect-error
export const NodesRenderer = ({ 
  nodes, 
  selectedNode, 
  setSelectedNode,
  isConnecting,
  connectionStart,
  setIsConnecting,
  setConnectionStart,
  setConnections
}) => {
  const handleNodeClick = (node, e) => {
    e.stopPropagation();
    if (isConnecting && connectionStart && connectionStart.id !== node.id) {
      const newConnection = {
        id: Date.now().toString(),
        from: connectionStart.id,
        to: node.id,
        fromX: connectionStart.x + connectionStart.width,
        fromY: connectionStart.y + connectionStart.height / 2,
        toX: node.x,
        toY: node.y + node.height / 2
      };
      setConnections(prev => [...prev, newConnection]);
      setIsConnecting(false);
      setConnectionStart(null);
    } else {
      setSelectedNode(node);
    }
  };

  const startConnection = (node, e) => {
    e.stopPropagation();
    setIsConnecting(true);
    setConnectionStart(node);
  };

  return (
    <>
      {nodes.map((node) => {
        const IconComponent = node.icon;
        const isSelected = selectedNode?.id === node.id;
        return (
          <div
            key={node.id}
            className={`absolute bg-white rounded-lg border-2 shadow-md cursor-pointer transition-all ${
              isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
            }`}
            style={{
              left: node.x,
              top: node.y,
              width: node.width,
              height: node.height,
              zIndex: 2
            }}
            onClick={(e) => handleNodeClick(node, e)}
          >
            <div className="p-3 h-full flex flex-col justify-center items-center">
              <div className={`p-2 rounded-md ${node.color} text-white mb-2`}>
                <IconComponent size={20} />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center line-clamp-2">{node.name}</span>
            </div>
            
            <div
              className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white cursor-pointer hover:bg-blue-600 hover:scale-110 transition-all"
              onClick={(e) => startConnection(node, e)}
            />
            <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gray-400 rounded-full border-2 border-white" />
          </div>
        );
      })}
    </>
  );
};
