import { useState } from 'react';
import { Play, Save, Settings, X, Menu, Zap, Square } from 'lucide-react';
import { editorAtom } from "../../Canvas/store/atomsNode";
import { useAtomValue } from "jotai";
import { useUpdateAgent, useToggleExecution } from '@/app/module/Agents/server/hooks/agentHook';
import { toast } from 'sonner';

interface NavbarProps {
  workflowName: string;
  status?: string;
  id: string;
}

export const Handlesave = ({ id }: { id: string }) => {
  const canvas = useAtomValue(editorAtom);
  const saveAgent = useUpdateAgent();

  const handleSave = async () => {
    if (!canvas) {
      toast.error('Canvas not initialized');
      return;
    }

    try {
      // Fix: getNodes() not getNode()
      const nodes = canvas.getNodes();
      const edges = canvas.getEdges();

      console.log('Saving workflow:', { id, nodes, edges });

      // Validate we have arrays
      if (!Array.isArray(nodes)) {
        toast.error('Invalid nodes data');
        return;
      }

      if (!Array.isArray(edges)) {
        toast.error('Invalid edges data');
        return;
      }

      // Transform nodes and edges to match the expected format
      saveAgent.mutate({
        id,
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type || 'manual',
          position: node.position,
          data: node.data
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle || undefined,
          targetHandle: edge.targetHandle || undefined
        }))
      });

    } catch (error) {
      console.error('Save error:', error);
      toast.error(`Failed to save: ${(error as any).message}`);
    }
  }

  return (
    <>
      <button
        onClick={handleSave}
        disabled={saveAgent.isPending}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save size={16} />
        <span>{saveAgent.isPending ? 'Saving...' : 'Save'}</span>
      </button>
    </>
  )
}

import { WorkflowHeaders } from './components/agentHeaders';

export const NavbarWork = ({ workflowName, status = "Draft", id }: NavbarProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const canvas = useAtomValue(editorAtom);
  const saveAgent = useUpdateAgent();
  const toggleExecution = useToggleExecution();

  const isRunning = status === 'RUNNING';

  const handleExecute = () => {
    toggleExecution.mutate({
      workflowId: id,
      isPolling: !isRunning
    });
  };

  const handleSave = async () => {
    if (!canvas) {
      toast.error('Canvas not initialized');
      return;
    }

    try {
      const nodes = canvas.getNodes();
      const edges = canvas.getEdges();

      console.log('Saving workflow:', { id, nodes, edges });

      if (!Array.isArray(nodes)) {
        toast.error('Invalid nodes data');
        return;
      }

      if (!Array.isArray(edges)) {
        toast.error('Invalid edges data');
        return;
      }

      saveAgent.mutate({
        id,
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type || 'manual',
          position: node.position,
          data: node.data
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle || undefined,
          targetHandle: edge.targetHandle || undefined
        }))
      });

    } catch (error) {
      console.error('Save error:', error);
      toast.error(`Failed to save: ${(error as any).message}`);
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="text-white" size={16} />
            </div>

            <div className="flex flex-col">
              <WorkflowHeaders id={id} workflowName={workflowName} />

              {/* Mobile Status */}
              <span className="text-xs text-gray-500 lg:hidden mt-1">
                Status: <span className={`font-medium ${status === "Draft" ? "text-orange-500" :
                  status === "Running" || status === "RUNNING" ? "text-green-500" :
                    "text-gray-600"
                  }`}>
                  {status}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center space-x-2">
          <button
            onClick={handleExecute}
            disabled={toggleExecution.isPending}
            className={`px-4 py-2 ${isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md transition-colors flex items-center space-x-2 text-sm font-medium disabled:opacity-50`}
          >
            {toggleExecution.isPending ? (
              <span>Processing...</span>
            ) : isRunning ? (
              <>
                <Square size={16} />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>Execute</span>
              </>
            )}
          </button>
          <Handlesave id={id} />
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Desktop Status */}
          <div className="hidden lg:flex items-center space-x-2">
            <span className="text-sm text-gray-500">Status:</span>
            <span className={`text-sm font-medium ${status === "Draft" ? "text-orange-500" :
              status === "Running" || status === "RUNNING" ? "text-green-500" :
                "text-gray-600"
              }`}>
              {status}
            </span>
          </div>

          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-gray-200">
          <div className="flex flex-col space-y-2">
            <button
              onClick={handleExecute}
              className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              {isRunning ? <Square size={16} /> : <Play size={16} />}
              <span>{isRunning ? 'Stop Workflow' : 'Execute Workflow'}</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saveAgent.isPending}
              className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              <span>{saveAgent.isPending ? 'Saving...' : 'Save Workflow'}</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};