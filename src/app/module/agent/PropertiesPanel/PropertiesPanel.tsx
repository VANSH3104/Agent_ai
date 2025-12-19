"use client"
import { useState } from "react";
import { NodePropertiesConfig } from "../components/constrants/nodeproperties";
import { X, Play, Trash, Loader2 } from "lucide-react";
import { useTriggerAgent, useExecuteFromNode, useClearNodeExecution } from "../../Agents/server/hooks/agentHook";
import { Node } from "@xyflow/react";
import { LogViewer } from "./LogViewer";

interface PropertiesPanelProps {
  selectedNode: Node | null;

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
  isOpen,
  setIsOpen,
  onSaveConfig,
}: PropertiesPanelProps) => {
  const trigger = useTriggerAgent();
  const executeNode = useExecuteFromNode();
  const clearNode = useClearNodeExecution();

  const [activeTab, setActiveTab] = useState<'inputs' | 'params' | 'outputs'>('params');

  const handleExecute = () => {
    if (!selectedNode) return;
    executeNode.mutate({
      workflowId,
      nodeId: selectedNode.id,
      mode: 'test'
    });
    // Valid UX to switch to outputs tab to see result
    setActiveTab('outputs');
  };

  const handleClear = () => {
    if (!selectedNode) return;
    clearNode.mutate({
      workflowId,
      nodeId: selectedNode.id
    });
  };

  if (!selectedNode) return null;
  const nodeType = selectedNode.type || 'manual';
  console.log("node types ", selectedNode.type)
  if (selectedNode?.type === 'manual') {
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
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <h3 className="text-lg font-medium text-gray-800 truncate max-w-[40%] flex items-center gap-2">
            <div className="w-2 h-6 bg-blue-500 rounded-full" />
            {String(selectedNode?.data?.label || config?.label || '')}
          </h3>

          <div className="flex items-center gap-2">
            <button
              disabled={executeNode.isPending}
              onClick={handleExecute}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {executeNode.isPending ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              Execute Node
            </button>

            <button
              disabled={clearNode.isPending}
              onClick={handleClear}
              title="Clear Data"
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash size={16} />
            </button>

            <div className="h-4 w-px bg-gray-300 mx-1" />

            <button
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="lg:hidden border-b border-gray-200">
          <div className="flex">
            {["inputs", "params", "outputs"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-3 text-sm font-medium ${activeTab === tab ?
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

            {InputsComponent ? <InputsComponent nodeData={selectedNode} /> : (
              <LogViewer
                nodeId={selectedNode.id}
                workflowId={workflowId}
                type="input"
              />
            )}
          </div>

          {/* PARAMS */}
          <div className={`w-full lg:w-1/3 border-r p-4 overflow-y-auto
            ${activeTab !== 'params' ? 'hidden lg:block' : 'block'}
          `}>
            <h4 className="text-lg font-semibold mb-4 pb-2 border-b hidden lg:block">Parameters</h4>

            {ParamsComponent ? (
              <ParamsComponent
                key={selectedNode.id}
                nodeData={selectedNode}
                initialData={selectedNode.data}
                onSave={(data: any) => {
                  if (onSaveConfig && selectedNode) {
                    onSaveConfig(selectedNode.id, data);
                  }
                }}
              />
            ) : <p>No Parameters</p>}
          </div>

          {/* OUTPUTS */}
          <div className={`w-full lg:w-1/3 p-4 overflow-y-auto
            ${activeTab !== 'outputs' ? 'hidden lg:block' : 'block'}
          `}>
            <h4 className="text-lg font-semibold mb-4 pb-2 border-b hidden lg:block">Outputs</h4>

            {OutputsComponent ? <OutputsComponent nodeData={selectedNode} /> : (
              <LogViewer
                nodeId={selectedNode.id}
                workflowId={workflowId}
                type="output"
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};
