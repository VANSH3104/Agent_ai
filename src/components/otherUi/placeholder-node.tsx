"use client";
import React, { forwardRef, type ReactNode } from "react";
import {  
  Handle,
  Position,
  type NodeProps,
} from "@xyflow/react";
import { BaseNode } from "@/components/BaseNode";
import { Plus } from "lucide-react";

export type PlaceholderNodeProps = Partial<NodeProps> & {
  children?: ReactNode;
  onClick?: () => void;
};

export const PlaceholderNode = forwardRef<HTMLDivElement, PlaceholderNodeProps>(
  ({ children, onClick, data }, ref) => {
    return (
      <BaseNode
        ref={ref}
        className="w-[80px] p-0 border-dashed border-2 border-gray-300 overflow-hidden shadow-none cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
        style={{ borderRadius: '8px' }}
        onClick={onClick}
      >
        {/* Icon Area */}
        <div className="flex items-center justify-center h-14 bg-gray-50/50">
          <Plus className="w-6 h-6 text-gray-400" strokeWidth={2.5} />
        </div>

        {/* Name Area */}
        <div className="px-2 py-1.5 bg-white text-center border-t border-dashed border-gray-200">
          <div className="text-[10px] font-semibold text-gray-400 leading-tight">
            {data?.label || "Add Node"}
          </div>
        </div>
        {children}
        {/* Hidden handles for connection compatibility */}
        <Handle
          type="target"
          style={{ visibility: "hidden" }}
          position={Position.Left}
          isConnectable={false}
        />
        <Handle
          type="source"
          style={{ visibility: "hidden" }}
          position={Position.Right}
          isConnectable={false}
        />
      </BaseNode>
    );
  }
);

PlaceholderNode.displayName = "PlaceholderNode";