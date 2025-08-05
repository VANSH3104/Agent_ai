import React from 'react';
import { X } from 'lucide-react';
import { Connection } from '../schema/interfaces';

export const PropertiesPanel = ({
  selectedNode,
  setSelectedNode,
  setNodes,
  setConnections,
  isOpen,
  setIsOpen,
}) => {
  const deleteNode = (nodeId: string) => {
    setNodes((prev: Node[]) => prev.filter(n => n.id !== nodeId));
    setConnections((prev: Connection[]) => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
    setSelectedNode(null);
    setIsOpen(false);
  };

  if (!selectedNode) return null;
  console.log(selectedNode , "node")
  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <div className={`
        fixed inset-0 m-auto z-50 backdrop-blur-lg
        w-full max-w-4xl h-[80vh] bg-white rounded-lg shadow-xl flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}
      `}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-800">
            Node Properties: {selectedNode.name}
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => deleteNode(selectedNode.id)}
              className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 rounded hover:bg-red-50"
            >
              Delete Node
            </button>
            <button 
              className="p-1 text-gray-500 hover:text-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Properties */}
          <div className="w-1/2 border-r border-gray-200 p-4 overflow-y-auto">
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
                    setSelectedNode({ ...selectedNode, name: e.target.value });
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
                  <p className="text-sm text-gray-600">Configure node settings here...</p>
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
          
          {/* Right Panel - Input/Output Tests */}
          <div className="w-1/2 p-4 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-2">Input Tests</h4>
                <div className="space-y-2">
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-blue-800">Test Case 1</p>
                    <textarea
                      rows={2}
                      className="w-full mt-1 px-2 py-1 border border-blue-200 rounded text-sm bg-white"
                      placeholder="Input data..."
                    />
                  </div>
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-blue-800">Test Case 2</p>
                    <textarea
                      rows={2}
                      className="w-full mt-1 px-2 py-1 border border-blue-200 rounded text-sm bg-white"
                      placeholder="Input data..."
                    />
                  </div>
                  <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    + Add Test Case
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-2">Expected Outputs</h4>
                <div className="space-y-2">
                  <div className="bg-green-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-green-800">Output for Case 1</p>
                    <textarea
                      rows={2}
                      className="w-full mt-1 px-2 py-1 border border-green-200 rounded text-sm bg-white"
                      placeholder="Expected output..."
                    />
                  </div>
                  <div className="bg-green-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-green-800">Output for Case 2</p>
                    <textarea
                      rows={2}
                      className="w-full mt-1 px-2 py-1 border border-green-200 rounded text-sm bg-white"
                      placeholder="Expected output..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium">
                  Run Tests
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};