import React, { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState<'inputs' | 'params' | 'outputs'>('params');
  
  const deleteNode = (nodeId: string) => {
    setNodes((prev: Node[]) => prev.filter(n => n.id !== nodeId));
    setConnections((prev: Connection[]) => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
    setSelectedNode(null);
    setIsOpen(false);
  };

  if (!selectedNode) return null;

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
        w-full max-w-7xl h-[85vh] md:h-[90vh] bg-white rounded-lg shadow-xl flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-medium text-gray-800 truncate max-w-[50%]">
            Node: {selectedNode.name}
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => deleteNode(selectedNode.id)}
              className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 rounded hover:bg-red-50"
            >
              Delete
            </button>
            <button 
              className="p-1 text-gray-500 hover:text-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Mobile Tabs */}
        <div className="lg:hidden border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('inputs')}
              className={`flex-1 py-3 text-sm font-medium ${activeTab === 'inputs' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
              Inputs
            </button>
            <button
              onClick={() => setActiveTab('params')}
              className={`flex-1 py-3 text-sm font-medium ${activeTab === 'params' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
              Parameters
            </button>
            <button
              onClick={() => setActiveTab('outputs')}
              className={`flex-1 py-3 text-sm font-medium ${activeTab === 'outputs' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
              Outputs
            </button>
          </div>
        </div>
        
        {/* Three Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Inputs */}
          <div className={`w-full lg:w-1/3 border-r border-gray-200 p-4 overflow-y-auto ${activeTab !== 'inputs' ? 'hidden lg:block' : 'block'}`}>
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 hidden lg:block">
                Inputs
              </h4>
              
              <div className="space-y-3">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-800">Input 1</p>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">String</span>
                  </div>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Enter input data..."
                    defaultValue='{"name": "example", "value": 123}'
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-800">Input 2</p>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Number</span>
                  </div>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter number..."
                    defaultValue={42}
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-800">Input 3</p>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Boolean</span>
                  </div>
                  <select className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </div>
                
                <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium py-2 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors">
                  + Add Input
                </button>
              </div>
            </div>
          </div>
          
          {/* Middle Panel - Parameters/Configuration */}
          <div className={`w-full lg:w-1/3 border-r border-gray-200 p-4 overflow-y-auto ${activeTab !== 'params' ? 'hidden lg:block' : 'block'}`}>
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 hidden lg:block">
                Parameters
              </h4>
              
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timeout (seconds)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="30"
                    defaultValue={30}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Retry Count</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="3"
                    defaultValue={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Environment Variables</label>
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Key"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <button className="px-2 py-1 text-red-500 hover:bg-red-50 rounded text-sm">×</button>
                    </div>
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                      + Add Variable
                    </button>
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Enable Error Handling</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Panel - Outputs */}
          <div className={`w-full lg:w-1/3 p-4 overflow-y-auto ${activeTab !== 'outputs' ? 'hidden lg:block' : 'block'}`}>
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 hidden lg:block">
                Outputs
              </h4>
              
              <div className="space-y-3">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-green-800">Success Output</p>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Object</span>
                  </div>
                  <pre className="bg-white p-3 border border-green-200 rounded text-xs text-gray-700 overflow-x-auto">
{`{
  "status": "success",
  "data": {
    "id": "12345",
    "processed": true,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}`}
                  </pre>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-red-800">Error Output</p>
                    <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">Object</span>
                  </div>
                  <pre className="bg-white p-3 border border-red-200 rounded text-xs text-gray-700 overflow-x-auto">
{`{
  "status": "error",
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Invalid input parameters"
  }
}`}
                  </pre>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-800">Schema</p>
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">JSON</span>
                  </div>
                  <pre className="bg-white p-3 border border-gray-200 rounded text-xs text-gray-700 overflow-x-auto">
{`{
  "type": "object",
  "properties": {
    "status": {"type": "string"},
    "data": {"type": "object"}
  },
  "required": ["status"]
}`}
                  </pre>
                </div>
              </div>
              
              <div className="pt-4 space-y-2">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors">
                  Test Node
                </button>
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md text-sm font-medium transition-colors">
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};