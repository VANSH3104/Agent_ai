import React, { useMemo } from 'react';
import { useWorkflowExecutions, useExecutionDetails } from '../../Agents/server/hooks/agentHook';

interface LogViewerProps {
    nodeId: string;
    workflowId: string;
    type: 'input' | 'output';
}

export const LogViewer = ({ nodeId, workflowId, type }: LogViewerProps) => {
    // 1. Get latest workflow execution ID
    const { data: executions, isLoading: isLoadingExecutions } = useWorkflowExecutions(workflowId, 1);

    const latestExecutionId = useMemo(() => {
        if (executions && executions.length > 0) {
            return executions[0].id;
        }
        return null;
    }, [executions]);

    // 2. Fetch detailed execution data for that ID
    const { data: details, isLoading: isLoadingDetails } = useExecutionDetails(latestExecutionId || '');

    const nodeExecution = useMemo(() => {
        if (!details || !details.nodeExecutions) return null;

        console.log('DEBUG LogViewer: Finding execution for node', nodeId);
        console.log('DEBUG LogViewer: Available node executions:', details.nodeExecutions);

        return details.nodeExecutions.find((ne: any) => ne.nodeId === nodeId);
    }, [details, nodeId]);

    const displayData = useMemo(() => {
        if (!nodeExecution) return null;
        if (type === 'input') {
            // Try to show context or inputData
            return nodeExecution.inputData || {};
        } else {
            return nodeExecution.outputData || {};
        }
    }, [nodeExecution, type]);

    if (isLoadingExecutions || (latestExecutionId && isLoadingDetails)) {
        return <div className="p-4 text-xs text-gray-500">Loading logs...</div>;
    }

    if (!latestExecutionId) {
        return <div className="p-4 text-xs text-gray-400">No execution history found.</div>;
    }

    if (!nodeExecution) {
        return (
            <div className="p-4 text-xs text-gray-500">
                <p className="mb-2">Execution ID: {latestExecutionId.slice(0, 8)}...</p>
                <p>No execution data for this node yet.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 rounded-md overflow-hidden">
            <div className="bg-gray-100 px-3 py-2 border-b border-gray-200 flex justify-between items-center">
                <span className="text-xs font-medium text-gray-700 uppercase">{type} Logs</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${nodeExecution.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                    nodeExecution.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                    }`}>
                    {nodeExecution.status}
                </span>
            </div>
            <div className="flex-1 overflow-auto p-2">
                <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap break-all">
                    {JSON.stringify(displayData, null, 2)}
                </pre>
            </div>
            <div className="bg-gray-50 px-3 py-1 border-t border-gray-200 text-[10px] text-gray-400">
                {new Date(nodeExecution.startedAt).toLocaleString()}
            </div>
        </div>
    );
};
