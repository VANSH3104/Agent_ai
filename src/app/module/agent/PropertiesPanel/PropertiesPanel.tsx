"use client"
import { useState } from "react";
import { NodePropertiesConfig } from "../components/constrants/nodeproperties";
import { X } from "lucide-react";
import { useTriggerAgent } from "../../Agents/server/hooks/agentHook";

interface PropertiesPanelProps {
  selectedNode: Node | null ;

  setSelectedNode: (node: Node | null) => void;
  setNodes: (nodes: Node[]) => void;
  isOpen: boolean;
  workflowId: string;
  setIsOpen: (isOpen: boolean) => void;

  // Optional services (e.g., to update DB or run tests)
  onRunTest?: (nodeId: string, input: any) => Promise<any>;
  onSaveConfig?: (nodeId: string, data: any) => Promise<void>;
}
export const PropertiesPanel = ({
  selectedNode,
  workflowId,
  setSelectedNode,
  setNodes,
  setConnections,
  isOpen,
  setIsOpen,
}: PropertiesPanelProps) => {
  const trigger = useTriggerAgent();
  const [activeTab, setActiveTab] = useState<'inputs' | 'params' | 'outputs'>('params');
  if (!selectedNode) return null;
  const nodeType = selectedNode.type;
  console.log("node types " , selectedNode.type)
  if(selectedNode?.type === 'manual'){
    setIsOpen(false);
    trigger.mutate({
      workflowId: workflowId,
      triggerData: {},
      mode: 'test'
    })
    
  }
  const config = NodePropertiesConfig[nodeType];
  console.log(config, "config")
  const InputsComponent = config?.Inputs;
  const ParamsComponent = config?.Params;
  const OutputsComponent = config?.Outputs;
  console.log('selectedNode', selectedNode);
  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`fixed inset-0 m-auto z-50 backdrop-blur-lg
        w-full max-w-7xl h-[85vh] md:h-[90vh] bg-white rounded-lg shadow-xl flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}
      >
       
        {/* HEADER */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-800 truncate max-w-[50%]">
            Node: {selectedNode?.data?.label || config?.label}
          </h3>

          <button 
            className="p-1 text-gray-500 hover:text-gray-700"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* TABS */}
        <div className="lg:hidden border-b border-gray-200">
          <div className="flex">
            {["inputs", "params", "outputs"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-3 text-sm font-medium ${
                  activeTab === tab ? 
                  'text-blue-600 border-b-2 border-blue-600' : 
                  'text-gray-500'
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 flex overflow-hidden">

          {/* INPUTS */}
          <div className={`w-full lg:w-1/3 border-r p-4 overflow-y-auto 
            ${activeTab !== 'inputs' ? 'hidden lg:block' : 'block'}
          `}>
            <h4 className="text-lg font-semibold mb-4 pb-2 border-b hidden lg:block">Inputs</h4>

            {InputsComponent ? <InputsComponent nodeData={selectedNode} /> : <p>No Inputs</p>}
          </div>

          {/* PARAMS */}
          <div className={`w-full lg:w-1/3 border-r p-4 overflow-y-auto
            ${activeTab !== 'params' ? 'hidden lg:block' : 'block'}
          `}>
            <h4 className="text-lg font-semibold mb-4 pb-2 border-b hidden lg:block">Parameters</h4>

            {ParamsComponent ? <ParamsComponent nodeData={selectedNode} /> : <p>No Parameters</p>}
          </div>

          {/* OUTPUTS */}
          <div className={`w-full lg:w-1/3 p-4 overflow-y-auto
            ${activeTab !== 'outputs' ? 'hidden lg:block' : 'block'}
          `}>
            <h4 className="text-lg font-semibold mb-4 pb-2 border-b hidden lg:block">Outputs</h4>

            {OutputsComponent ? <OutputsComponent nodeData={selectedNode} /> : <p>No Outputs</p>}
          </div>
        </div>
      </div>
    </>
  );
};
