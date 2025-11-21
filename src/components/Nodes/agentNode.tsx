"use client"
import { NodeToolbar, Position } from "@xyflow/react";
import { Settings2, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { useState, useRef } from "react";

interface AgentNodeTypes {
  children: React.ReactNode;
  showToolbar?: boolean;
  onDelete?: () => void;
  onSetting?: () => void;
  name?: string;
  description?: string;
}

export const AgentNode = ({children, showToolbar, onDelete, onSetting, name, description}: AgentNodeTypes)=>{
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 200); // 200ms delay before hiding
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showToolbar && (
        <NodeToolbar 
          isVisible={isHovered}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Button onClick={onDelete} variant="ghost" size="sm">
            <Trash2 className="size-4"/>
          </Button>
          <Button onClick={onSetting} variant="ghost" size="sm">
            <Settings2 className="size-4"/>
          </Button>
        </NodeToolbar>
      )}
      {children}
      
      {/* Replace the bottom NodeToolbar with a regular div */}
      {name && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-center max-w-[200px] w-full">
          <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
            {name}
          </div>
          {description &&(
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {description}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 