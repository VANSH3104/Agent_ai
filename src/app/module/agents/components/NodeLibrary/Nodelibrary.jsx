
import React from 'react';
import { Search, X, Plus } from 'lucide-react';
import { NodeLibraryItem} from './NodeLibraryItem';
import { nodeTypes } from "../constrants/nodetypes"

export const NodeLibrary = ({ searchTerm, setSearchTerm, setDraggedNode, isOpen, setIsOpen, setNodes }) => {
  const filteredNodes = nodeTypes.filter(node => 
    node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedNodes = filteredNodes.reduce((acc, node) => {
    if (!acc[node.category]) acc[node.category] = [];
    acc[node.category].push(node);
    return acc;
  }, {});

  const handleMobileAddNode = (nodeType) => {
    const newNode = {
      id: Date.now().toString(),
      type: nodeType.id,
      name: nodeType.name,
      icon: nodeType.icon,
      color: nodeType.color,
      x: Math.random() * 200 + 100,
      y: Math.random() * 200 + 100,
      width: 150,
      height: 80
    };

    setNodes(prev => [...prev, newNode]);
    setIsOpen(false);
  };

  return (
    <>
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
        w-80 bg-white border-r border-gray-200 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3 lg:mb-0">
            <h2 className="text-lg font-medium text-gray-800 lg:hidden">Node Library</h2>
            <button 
              className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search nodes..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="lg:hidden px-4 py-2 bg-blue-50 border-b border-gray-200">
          <p className="text-xs text-blue-600">
            Tap any node below to add it to your workflow
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {Object.entries(groupedNodes).map(([category, categoryNodes]) => (
            <div key={category} className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryNodes.map((nodeType) => (
                  <NodeLibraryItem 
                    key={nodeType.id}
                    nodeType={nodeType}
                    setDraggedNode={setDraggedNode}
                    onMobileAdd={handleMobileAddNode}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
