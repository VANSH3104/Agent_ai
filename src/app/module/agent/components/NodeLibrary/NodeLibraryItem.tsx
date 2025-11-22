"use client";
import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { NodeTypeUI } from '../constrants/nodetypes';

interface NodeLibraryItemProps {
  nodeType: NodeTypeUI;
  setDraggedNode: (node: NodeTypeUI) => void;
  onMobileAdd: (node: NodeTypeUI) => void;
}

export const NodeLibraryItem = ({ 
  nodeType, 
  setDraggedNode, 
  onMobileAdd 
}: NodeLibraryItemProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const IconComponent = nodeType.icon;

  const handleClick = () => {
    if (isMobile && onMobileAdd) {
      onMobileAdd(nodeType);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!isMobile) {
      setDraggedNode(nodeType);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isMobile) {
      e.preventDefault();
      setDraggedNode(nodeType);
    }
  };

  return (
    <div
      draggable={!isMobile}
      onDragStart={handleDragStart}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      className={`
        group flex items-start p-3 bg-gray-50 rounded-lg border border-gray-200 
        hover:bg-gray-100 hover:border-gray-300 transition-all duration-200
        ${isMobile 
          ? 'cursor-pointer active:bg-gray-200 active:scale-98' 
          : 'cursor-grab active:cursor-grabbing active:opacity-50'
        }
      `}
    >
      <div className={`
        p-2 rounded-md ${nodeType.color} text-white mr-3 flex-shrink-0
        group-hover:shadow-md transition-shadow duration-200
      `}>
        <IconComponent size={18} />
      </div>
      
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-sm font-medium text-gray-800 truncate">
            {nodeType.name}
          </span>
          {isMobile && (
            <Plus 
              size={16} 
              className="text-gray-400 group-hover:text-gray-600 flex-shrink-0 ml-2 transition-colors" 
            />
          )}
        </div>
        {nodeType.description && (
          <p className="text-xs text-gray-500 line-clamp-2">
            {nodeType.description}
          </p>
        )}
      </div>
    </div>
  );
};