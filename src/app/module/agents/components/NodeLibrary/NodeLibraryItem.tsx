import React from 'react';
import { Plus } from 'lucide-react';
//@ts-ignore
export const NodeLibraryItem = ({ nodeType, setDraggedNode, onMobileAdd }) => {
  const isMobile = window.innerWidth < 1024;
  const IconComponent = nodeType.icon;

  const handleClick = () => {
    if (isMobile && onMobileAdd) {
      onMobileAdd(nodeType);
    }
  };

  const handleTouchStart = (e) => {
    if (isMobile) {
      e.preventDefault();
      setDraggedNode(nodeType);
    }
  };

  return (
    <div
      draggable={!isMobile}
      onDragStart={() => !isMobile && setDraggedNode(nodeType)}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      className={`flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors ${
        isMobile ? 'cursor-pointer active:bg-gray-200' : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      <div className={`p-2 rounded-md ${nodeType.color} text-white mr-3 flex-shrink-0`}>
        <IconComponent size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium text-gray-700 block truncate">{nodeType.name}</span>
      </div>
      {isMobile && (
        <div className="flex-shrink-0 ml-2">
          <Plus size={16} className="text-gray-400" />
        </div>
      )}
    </div>
  );
};
