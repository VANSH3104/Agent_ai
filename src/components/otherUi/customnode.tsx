import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { 
  Webhook, 
  Play, 
  Calendar, 
  Globe2, 
  Database, 
  Send, 
  FileCode, 
  Split, 
  Shuffle,
  Trash2,
  Settings
} from 'lucide-react';
import { BaseNode } from './base-node';
import { SiGoogleforms } from 'react-icons/si';
import { useRemoveNode } from '@/app/module/Agents/server/hooks/agentHook';
import { toast } from 'sonner';

// Compact Icon-focused Node Component
const WorkflowNode = memo(({ 
  data, 
  isConnectable,
  id,
  hasInput = true,
  hasOutput = true,
  icon: Icon,
  bgColor,
  borderColor,
  iconColor = '#ffffff'
}: NodeProps & { 
  hasInput?: boolean;
  hasOutput?: boolean;
  icon: React.ElementType;
  bgColor: string;
  borderColor: string;
  iconColor?: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const removeNodeMutation = useRemoveNode();
  const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      
      // Debug: log all available data
      console.log('Delete clicked - Available data:', {
        nodeId: id,
        nodeData: data,
        hasWorkflowId: !!data?.workflowId,
        workflowId: data?.workflowId
      });
      
      // Check if we have the required data
      if (!data?.workflowId) {
        console.error('Missing workflowId in node data. Full data:', data);
        toast.error('Cannot delete node: Missing workflow information. Please try refreshing the page.');
        return;
      }
      
      console.log('Calling removeNode mutation with:', {
        workflowId: data.workflowId,
        nodeId: id
      });
      
      removeNodeMutation.mutate({ 
        workflowId: data.workflowId, 
        nodeId: id 
      });
    };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data?.onEdit) {
      data.onEdit(id);
    }
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <BaseNode 
        className="w-[80px] p-0 overflow-visible transition-all hover:shadow-xl"
        style={{ 
          borderColor: borderColor,
          borderWidth: '2px',
          borderRadius: '8px'
        }}
      >
        {hasInput && (
          <Handle
            type="target"
            position={Position.Left}
            isConnectable={isConnectable}
            className="!w-2.5 !h-2.5 !bg-white !border-2 !rounded-full"
            style={{ borderColor, left: '-6px' }}
          />
        )}
        
        {/* Icon Container - FIXED: Removed strokeWidth */}
        <div 
          className="flex items-center justify-center h-14 rounded-t-md"
          style={{ backgroundColor: bgColor }}
        >
          <Icon size={22} style={{ color: iconColor }} />
        </div>

        {/* Node Name */}
        <div className="px-2 py-1.5 bg-white rounded-b-md text-center border-t-0">
          <div className="text-[10px] font-semibold text-gray-700 leading-tight line-clamp-2">
            {data.label}
          </div>
        </div>
        
        {/* Output Handle */}
        {hasOutput && (
          <Handle
            type="source"
            position={Position.Right}
            isConnectable={isConnectable}
            className="!w-2.5 !h-2.5 !bg-white !border-2 !rounded-full"
            style={{ borderColor, right: '-6px' }}
          />
        )}
      </BaseNode>

      {/* Hover Actions */}
      {isHovered && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex gap-1 bg-white rounded-lg shadow-xl border border-gray-300 p-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <button
            onClick={handleEdit}
            className="p-1.5 hover:bg-blue-50 rounded-md transition-colors group"
            title="Edit node"
          >
            <Settings size={13} className="text-gray-600 group-hover:text-blue-600" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 hover:bg-red-50 rounded-md transition-colors group"
            title="Delete node"
          >
            <Trash2 size={13} className="text-gray-600 group-hover:text-red-600" />
          </button>
        </div>
      )}
    </div>
  );
});

WorkflowNode.displayName = 'WorkflowNode';

// Webhook Node - Trigger (no input)
export const WebhookNode = memo((props: NodeProps) => (
  <WorkflowNode 
    {...props} 
    icon={Webhook}
    bgColor="#10b981"
    borderColor="#059669"
    hasInput={false}
  />
));

WebhookNode.displayName = 'WebhookNode';

// Manual Trigger Node - Trigger (no input)
export const ManualNode = memo((props: NodeProps) => (
  <WorkflowNode 
    {...props} 
    icon={Play}
    bgColor="#3b82f6"
    borderColor="#2563eb"
    hasInput={false}
  />
));

ManualNode.displayName = 'ManualNode';

// Schedule Node - Trigger (no input)
export const ScheduleNode = memo((props: NodeProps) => (
  <WorkflowNode 
    {...props} 
    icon={Calendar}
    bgColor="#06b6d4"
    borderColor="#0891b2"
    hasInput={false}
  />
));

ScheduleNode.displayName = 'ScheduleNode';

// HTTP Request Node - Action
export const HttpNode = memo((props: NodeProps) => (
  <WorkflowNode 
    {...props} 
    icon={Globe2}
    bgColor="#a855f7"
    borderColor="#9333ea"
  />
));

HttpNode.displayName = 'HttpNode';

export const GoogleformsNode = memo((props: NodeProps) => (
  <WorkflowNode 
    {...props} 
    icon={SiGoogleforms}
    bgColor="#7b5cf3"
    borderColor="#7c3aed"
    hasInput={false} // Since it's a trigger
  />
));

GoogleformsNode.displayName = 'GoogleformsNode';
// Database Node - Action
export const DatabaseNode = memo((props: NodeProps) => (
  <WorkflowNode 
    {...props} 
    icon={Database}
    bgColor="#f97316"
    borderColor="#ea580c"
  />
));

DatabaseNode.displayName = 'DatabaseNode';

// Email Node - Action
export const EmailNode = memo((props: NodeProps) => (
  <WorkflowNode 
    {...props} 
    icon={Send}
    bgColor="#f43f5e"
    borderColor="#e11d48"
  />
));

EmailNode.displayName = 'EmailNode';

// Code Node - Action
export const CodeNode = memo((props: NodeProps) => (
  <WorkflowNode 
    {...props} 
    icon={FileCode}
    bgColor="#475569"
    borderColor="#334155"
  />
));

CodeNode.displayName = 'CodeNode';

// Condition Node - Logic (Diamond with hover actions)
export const ConditionNode = memo(({ data, isConnectable, id }: NodeProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data?.onDelete) {
      data.onDelete(id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data?.onEdit) {
      data.onEdit(id);
    }
  };

  return (
    <div 
      className="relative" 
      style={{ width: '80px', height: '95px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Input Handle - Top */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="!w-2.5 !h-2.5 !bg-white !border-2 !border-amber-600 !rounded-full"
        style={{ left: '50%', top: '-6px' }}
      />
      
      {/* Diamond Shape */}
      <div className="absolute" style={{ top: '10px', left: '10px', width: '60px', height: '60px' }}>
        <BaseNode
          className="absolute inset-0 rotate-45 overflow-hidden"
          style={{ 
            backgroundColor: '#f59e0b',
            borderColor: '#d97706',
            borderWidth: '2px',
            borderRadius: '8px'
          }}
        />
        
        {/* Content - Not rotated */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 pointer-events-none">
          <Split size={18} strokeWidth={2.5} />
        </div>
      </div>

      {/* Node Name Below */}
      <div className="absolute bottom-0 left-0 right-0 text-center">
        <div className="text-[10px] font-semibold text-gray-700 bg-white px-1.5 py-1 rounded-md border border-gray-200 inline-block shadow-sm">
          {data?.label || 'IF'}
        </div>
      </div>
      
      {/* Output Handle - Right (TRUE) */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        isConnectable={isConnectable}
        className="!w-2.5 !h-2.5 !bg-green-500 !border-2 !border-green-700 !rounded-full"
        style={{ top: '40px', right: '-6px' }}
      />
      
      {/* Output Handle - Bottom (FALSE) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        isConnectable={isConnectable}
        className="!w-2.5 !h-2.5 !bg-red-500 !border-2 !border-red-700 !rounded-full"
        style={{ left: '40px', bottom: '27px' }}
      />

      {/* Hover Actions */}
      {isHovered && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex gap-1 bg-white rounded-lg shadow-xl border border-gray-300 p-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <button
            onClick={handleEdit}
            className="p-1.5 hover:bg-blue-50 rounded-md transition-colors group"
            title="Edit node"
          >
            <Settings size={13} className="text-gray-600 group-hover:text-blue-600" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 hover:bg-red-50 rounded-md transition-colors group"
            title="Delete node"
          >
            <Trash2 size={13} className="text-gray-600 group-hover:text-red-600" />
          </button>
        </div>
      )}
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';

// Filter Node - Logic
export const FilterNode = memo((props: NodeProps) => (
  <WorkflowNode 
    {...props} 
    icon={Shuffle}
    bgColor="#6366f1"
    borderColor="#4f46e5"
  />
));

FilterNode.displayName = 'FilterNode';