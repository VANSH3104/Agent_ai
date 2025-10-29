// components/ExecutionCanvas.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { useTRPC } from '@/trpc/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Play, Pause, RotateCcw, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';

interface ExecutionCanvasProps {
  workflowId: string;
  executionId?: string;
}

export const ExecutionCanvas: React.FC<ExecutionCanvasProps> = ({ 
  workflowId, 
  executionId 
}) => {
  const trpc = useTRPC();
  const [selectedExecution, setSelectedExecution] = useState<string | null>(executionId || null);
  
  // Get executions for this workflow
  const { data: executions = [] } = useQuery(
    trpc.workflowRouter.getExecutions.queryOptions({ 
      workflowId,
      limit: 10 
    })
  );

  // Get execution graph if execution is selected
  const { data: executionGraph, refetch: refetchGraph } = useQuery(
    trpc.workflowRouter.getExecutionGraph.queryOptions({ 
      executionId: selectedExecution || '' 
    }),
    { enabled: !!selectedExecution }
  );

  // Mutations
  const startExecution = useMutation(trpc.workflowRouter.startExecution);
  const resumeExecution = useMutation(trpc.workflowRouter.resumeExecution);
  const pauseExecution = useMutation(trpc.workflowRouter.pauseExecution);

  // Auto-refresh for running executions
  useEffect(() => {
    if (selectedExecution && executionGraph?.execution?.status === 'running') {
      const interval = setInterval(() => {
        refetchGraph();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [selectedExecution, executionGraph?.execution?.status, refetchGraph]);

  const handleStartExecution = async () => {
    const result = await startExecution.mutateAsync({
      workflowId,
      triggerData: { timestamp: new Date().toISOString() }
    });
    setSelectedExecution(result.executionId);
  };

  const handleResumeExecution = async (fromNodeId?: string) => {
    if (!selectedExecution) return;
    
    await resumeExecution.mutateAsync({
      executionId: selectedExecution,
      fromNodeId
    });
    refetchGraph();
  };

  const handlePauseExecution = async () => {
    if (!selectedExecution) return;
    
    await pauseExecution.mutateAsync({
      executionId: selectedExecution
    });
    refetchGraph();
  };

  const getNodeStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-blue-500 animate-pulse';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };

  const getNodeStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'running': return Zap;
      case 'failed': return AlertCircle;
      case 'pending': return Clock;
      default: return Clock;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Execution Controls */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Workflow Execution</h2>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleStartExecution}
              disabled={startExecution.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              <Play size={16} />
              Start New
            </button>
            
            {selectedExecution && executionGraph && (
              <>
                {executionGraph.execution.status === 'running' && (
                  <button
                    onClick={handlePauseExecution}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                  >
                    <Pause size={16} />
                    Pause
                  </button>
                )}
                
                {(executionGraph.execution.status === 'error' || executionGraph.execution.status === 'paused') && executionGraph.state?.canResume && (
                  <button
                    onClick={() => handleResumeExecution()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    <RotateCcw size={16} />
                    Resume
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Execution History */}
        <div className="flex gap-2 overflow-x-auto">
          {executions.map((execution) => (
            <button
              key={execution.id}
              onClick={() => setSelectedExecution(execution.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border whitespace-nowrap ${
                selectedExecution === execution.id 
                  ? 'bg-blue-100 border-blue-500' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                execution.status === 'success' ? 'bg-green-500' :
                execution.status === 'error' ? 'bg-red-500' :
                execution.status === 'running' ? 'bg-blue-500 animate-pulse' :
                'bg-yellow-500'
              }`} />
              <span className="text-sm">
                {new Date(execution.startedAt).toLocaleTimeString()}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                execution.status === 'success' ? 'bg-green-100 text-green-800' :
                execution.status === 'error' ? 'bg-red-100 text-red-800' :
                execution.status === 'running' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {execution.status}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Execution Canvas */}
      <div className="flex-1 relative bg-gray-50 overflow-auto">
        {executionGraph ? (
          <ExecutionGraphRenderer 
            executionGraph={executionGraph}
            onResumeFromNode={handleResumeExecution}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Play size={48} className="mx-auto mb-4 opacity-50" />
              <p>Select an execution or start a new one to see the workflow graph</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// components/ExecutionGraphRenderer.tsx
interface ExecutionGraphRendererProps {
  executionGraph: any;
  onResumeFromNode: (nodeId: string) => void;
}

const ExecutionGraphRenderer: React.FC<ExecutionGraphRendererProps> = ({
  executionGraph,
  onResumeFromNode
}) => {
  const { execution, state, nodes, connections } = executionGraph;
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const getNodeStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };

  const getNodeStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'running': return Zap;
      case 'failed': return AlertCircle;
      case 'pending': return Clock;
      default: return Clock;
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Execution Status Bar */}
      <div className="absolute top-4 left-4 right-4 bg-white rounded-lg border border-gray-200 p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                execution.status === 'success' ? 'bg-green-500' :
                execution.status === 'error' ? 'bg-red-500' :
                execution.status === 'running' ? 'bg-blue-500 animate-pulse' :
                'bg-yellow-500'
              }`} />
              <span className="font-medium capitalize">{execution.status}</span>
            </div>
            
            <div className="text-sm text-gray-500">
              Started: {new Date(execution.startedAt).toLocaleString()}
            </div>
            
            {execution.finishedAt && (
              <div className="text-sm text-gray-500">
                Finished: {new Date(execution.finishedAt).toLocaleString()}
              </div>
            )}
          </div>

          {state && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-600">
                ✓ {state.completedNodes.length} completed
              </span>
              {state.failedNodes.length > 0 && (
                <span className="text-red-600">
                  ✗ {state.failedNodes.length} failed
                </span>
              )}
            </div>
          )}
        </div>

        {execution.error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            <strong>Error:</strong> {execution.error}
          </div>
        )}
      </div>

      {/* Nodes and Connections */}
      <div className="pt-24 p-8">
        {/* Render connections first */}
        <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
          {connections.map((connection: any, index: number) => {
            const fromNode = nodes.find((n: any) => n.id === connection.fromNodeId);
            const toNode = nodes.find((n: any) => n.id === connection.toNodeId);
            
            if (!fromNode || !toNode) return null;

            const fromX = fromNode.position.x + 100; // Node width
            const fromY = fromNode.position.y + 50;  // Node height / 2
            const toX = toNode.position.x;
            const toY = toNode.position.y + 50;

            // Connection status color
            const isActive = fromNode.status === 'completed' || fromNode.status === 'running';
            const strokeColor = isActive ? '#3b82f6' : '#d1d5db';

            return (
              <line
                key={`connection-${index}`}
                x1={fromX}
                y1={fromY}
                x2={toX}
                y2={toY}
                stroke={strokeColor}
                strokeWidth={2}
                markerEnd="url(#arrowhead)"
                className={isActive ? 'animate-pulse' : ''}
              />
            );
          })}
          
          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#3b82f6"
              />
            </marker>
          </defs>
        </svg>

        {/* Render nodes */}
        {nodes.map((node: any) => {
          const StatusIcon = getNodeStatusIcon(node.status);
          const isSelected = selectedNode === node.id;
          const canResumeFrom = node.status === 'failed' && state?.canResume;

          return (
            <div
              key={node.id}
              className={`absolute rounded-lg border-2 shadow-md cursor-pointer transition-all ${
                isSelected ? 'border-blue-500 shadow-lg scale-105' : 'border-gray-200 hover:border-gray-300'
              } ${getNodeStatusColor(node.status)}`}
              style={{
                left: node.position.x,
                top: node.position.y,
                width: 120,
                height: 80,
                zIndex: 2,
              }}
              onClick={() => setSelectedNode(node.id)}
            >
              <div className="p-3 h-full flex flex-col justify-center items-center relative">
                {/* Status indicator */}
                <div className="absolute top-1 right-1">
                  <StatusIcon size={16} className="text-white drop-shadow-sm" />
                </div>

                {/* Node content */}
                <span className="text-xs font-medium text-white text-center line-clamp-2 drop-shadow-sm">
                  {node.name}
                </span>

                {/* Resume button for failed nodes */}
                {canResumeFrom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onResumeFromNode(node.id);
                    }}
                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded-full shadow-lg transition-all"
                  >
                    Resume
                  </button>
                )}
              </div>

              {/* Input/Output handles */}
              <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gray-400 rounded-full border-2 border-white" />
              <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
            </div>
          );
        })}
      </div>

      {/* Node Details Panel */}
      {selectedNode && (
        <NodeDetailsPanel 
          node={nodes.find((n: any) => n.id === selectedNode)}
          execution={execution}
          state={state}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
};

// components/NodeDetailsPanel.tsx
interface NodeDetailsPanelProps {
  node: any;
  execution: any;
  state: any;
  onClose: () => void;
}

const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({
  node,
  execution,
  state,
  onClose
}) => {
  const failedNode = state?.failedNodes.find((f: any) => f.nodeId === node.id);

  return (
    <div className="absolute top-4 right-4 w-80 bg-white rounded-lg border border-gray-200 shadow-lg z-20">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold">{node.name}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Node Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            node.status === 'completed' ? 'bg-green-100 text-green-800' :
            node.status === 'running' ? 'bg-blue-100 text-blue-800' :
            node.status === 'failed' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {node.status}
          </span>
        </div>

        {/* Node Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <span className="text-sm text-gray-900">{node.type}</span>
        </div>

        {/* Node Parameters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Parameters</label>
          <pre className="text-xs bg-gray-50 p-2 rounded border overflow-auto max-h-32">
            {JSON.stringify(JSON.parse(node.parameters), null, 2)}
          </pre>
        </div>

        {/* Error Details */}
        {failedNode && (
          <div>
            <label className="block text-sm font-medium text-red-700 mb-1">Error</label>
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded border">
              {failedNode.error}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Failed at: {new Date(failedNode.timestamp).toLocaleString()}
            </div>
          </div>
        )}

        {/* Execution Timeline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Execution Timeline</label>
          <div className="space-y-2">
            {state?.completedNodes.includes(node.id) && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle size={16} className="text-green-500" />
                <span>Completed</span>
              </div>
            )}
            {failedNode && (
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle size={16} className="text-red-500" />
                <span>Failed</span>
              </div>
            )}
            {node.status === 'running' && (
              <div className="flex items-center gap-2 text-sm">
                <Zap size={16} className="text-blue-500" />
                <span>Currently running...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced NodesRenderer with execution status
export const EnhancedNodesRenderer: React.FC<CanvasProps & { 
  onDragStart: (node: Node, e: React.MouseEvent) => void;
  executionGraph?: any;
}> = ({
  id,
  selectedNode,
  setSelectedNode,
  isConnecting,
  connectionStart,
  setIsConnecting,
  setConnectionStart,
  setConnections,
  onDragStart,
  executionGraph
}) => {
  const trpc = useTRPC();
  const { data: nodes = [] } = useQuery(trpc.Noderouter.getMany.queryOptions({ workflowId: id }));
  
  // Test node execution
  const testNode = useMutation(trpc.workflowRouter.testNode);

  const handleNodeClick = (node: Node, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isConnecting && connectionStart && connectionStart !== node.id) {
      const fromNode = nodes.find((n) => n.id === connectionStart);
      if (!fromNode) return;

      const newConnection: Connection = {
        id: Date.now().toString(),
        fromNodeId: fromNode.id,
        toNodeId: node.id,
        outputIndex: 0,
      };

      setConnections((prev) => [...prev, newConnection]);
      setIsConnecting(false);
      setConnectionStart(null);
    } else {
      setSelectedNode(node);
    }
  };

  const startConnection = (node: Node, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConnecting(true);
    setConnectionStart(node.id);
  };

  const handleTestNode = async (nodeId: string) => {
    try {
      const result = await testNode.mutateAsync({ nodeId, testData: { test: true } });
      console.log('Test result:', result);
    } catch (error) {
      console.error('Test failed:', error);
    }
  };

  const getNodeExecutionStatus = (nodeId: string) => {
    if (!executionGraph?.nodes) return 'idle';
    const graphNode = executionGraph.nodes.find((n: any) => n.id === nodeId);
    return graphNode?.status || 'idle';
  };

  return (
    <>
      {nodes.map((node) => {
        const isSelected = selectedNode === node.id;
        const executionStatus = getNodeExecutionStatus(node.id);
        
        let x = 0, y = 0;
        try {
          const pos = typeof node.position === "string" ? JSON.parse(node.position) : node.position;
          x = pos?.x ?? 0;
          y = pos?.y ?? 0;
        } catch (e) {
          console.error("Invalid node position", node.position);
        }

        const nodeType = nodeTypes.find(nt => nt.id === node.type);

        // Determine node styling based on execution status
        let statusStyling = '';
        if (executionStatus === 'completed') {
          statusStyling = 'ring-2 ring-green-400 bg-green-50';
        } else if (executionStatus === 'running') {
          statusStyling = 'ring-2 ring-blue-400 bg-blue-50 animate-pulse';
        } else if (executionStatus === 'failed') {
          statusStyling = 'ring-2 ring-red-400 bg-red-50';
        }

        return (
          <div
            key={node.id}
            className={`absolute rounded-lg border-2 shadow-md cursor-move transition-all ${
              isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
            } ${nodeType?.color || 'bg-white'} ${statusStyling}`}
            style={{
              left: x,
              top: y,
              width: 120,
              height: 80,
              zIndex: 2,
            }}
            onClick={(e) => handleNodeClick(node, e)}
            onMouseDown={(e) => {
              if (e.button === 0) {
                onDragStart(node, e);
              }
            }}
          >
            <div className="p-3 h-full flex flex-col justify-center items-center relative">
              {/* Execution status indicator */}
              {executionStatus !== 'idle' && (
                <div className="absolute -top-1 -right-1 z-10">
                  {executionStatus === 'completed' && <CheckCircle size={16} className="text-green-500 bg-white rounded-full" />}
                  {executionStatus === 'running' && <Zap size={16} className="text-blue-500 bg-white rounded-full animate-pulse" />}
                  {executionStatus === 'failed' && <AlertCircle size={16} className="text-red-500 bg-white rounded-full" />}
                </div>
              )}

              {nodeType && React.createElement(nodeType.icon, {
                size: 24,
                className: 'mb-1 text-white drop-shadow-sm'
              })}
              <span className="text-xs font-medium text-white text-center line-clamp-2 drop-shadow-sm">
                {node.name}
              </span>

              {/* Test button for development */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTestNode(node.id);
                }}
                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-purple-500 hover:bg-purple-600 text-white text-xs px-2 py-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all"
              >
                Test
              </button>
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