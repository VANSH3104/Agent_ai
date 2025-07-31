import React from 'react';
import { X } from 'lucide-react';
//@ts-expect-error
export const PropertiesPanel = ({ selectedNode, setSelectedNode, setNodes, setConnections, isOpen, setIsOpen }) => {
  const deleteNode = (nodeId:string) => {
    setNodes((prev: any[]) => prev.filter(n => n.id !== nodeId));
    setConnections((prev: any[]) => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
    setSelectedNode(null);
    setIsOpen(false);
  };

  if (!selectedNode) return null;

  return (
    <>
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <div className={`
        fixed lg:relative inset-y-0 right-0 z-50 lg:z-auto
        w-80 bg-white border-l border-gray-200 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-800">Node Properties</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => deleteNode(selectedNode.id)}
                className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 rounded hover:bg-red-50"
              >
                Delete
              </button>
              <button 
                className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
                onClick={() => setIsOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Node Name</label>
              <input
                type="text"
                value={selectedNode.name}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                onChange={(e) => {
                  setNodes(prev => prev.map(n => 
                    n.id === selectedNode.id ? { ...n, name: e.target.value } : n
                  ));
                  setSelectedNode(prev => ({ ...prev, name: e.target.value }));
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                placeholder="Add a description for this node..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Configuration</label>
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-sm text-gray-600">Configure {selectedNode.name} settings here...</p>
                <div className="mt-3 space-y-2">
                  <input 
                    type="text" 
                    placeholder="Parameter 1"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <input 
                    type="text" 
                    placeholder="Parameter 2"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};