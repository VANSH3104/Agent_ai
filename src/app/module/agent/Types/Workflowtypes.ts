export interface WorkflowMessage {
  executionId: string;
  workflowId: string;
  nodeId: string;
  data: any;
  metadata: {
    timestamp: number;
    attempt: number;
    previousNodeId?: string;
    connectionOutputIndex?: number;
    retryCount?: number;
    maxRetries?: number;
  };
}

export interface NodeExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  nextNodes?: { nodeId: string; outputIndex: number }[];
}

export interface ExecutionState {
  id: string;
  workflowId: string;
  status: 'running' | 'success' | 'error' | 'paused';
  currentNodeId?: string;
  failedNodeId?: string;
  errorMessage?: string;
  canResume: boolean;
  pausedAt?: Date;
  completedNodes: string[];
  failedNodes: { nodeId: string; error: string; timestamp: Date }[];
}