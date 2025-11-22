
import React from 'react';
import { Search, X } from 'lucide-react';
import { NodeLibraryItem } from './NodeLibraryItem';
import { nodeTypes, NodeTypeUI } from "../constrants/nodetypes";

interface NodeLibraryProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  setDraggedNode: (node: any) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onAddNode: (nodeType: any) => void;
}

export const NodeLibrary = ({ 
  searchTerm, 
  setSearchTerm, 
  setDraggedNode, 
  isOpen, 
  setIsOpen,
  onAddNode
}: NodeLibraryProps) => {
  const filteredNodes = nodeTypes.filter(node => 
    node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedNodes = filteredNodes.reduce((acc, node) => {
    if (!acc[node.category]) acc[node.category] = [];
    acc[node.category].push(node);
    return acc;
  }, {} as Record<string, NodeTypeUI[]>);

  // Category order
  const categoryOrder: Array<'Triggers' | 'Actions' | 'Logic'> = ['Triggers', 'Actions', 'Logic'];

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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Node Library</h2>
            <button 
              className="lg:hidden p-1 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
              onClick={() => setIsOpen(false)}
              aria-label="Close library"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search nodes..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="lg:hidden px-4 py-2 bg-blue-50 border-b border-gray-200">
          <p className="text-xs text-blue-600">
            💡 Drag to canvas or tap to add node
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {filteredNodes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No nodes found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            categoryOrder.map((category) => {
              const categoryNodes = groupedNodes[category];
              if (!categoryNodes || categoryNodes.length === 0) return null;
              
              return (
                <div key={category} className="mb-6 last:mb-0">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                    {category}
                    <span className="ml-2 text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                      {categoryNodes.length}
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {categoryNodes.map((nodeType) => (
                      <NodeLibraryItem 
                        key={nodeType.id}
                        nodeType={nodeType}
                        setDraggedNode={setDraggedNode}
                        onMobileAdd={onAddNode}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};