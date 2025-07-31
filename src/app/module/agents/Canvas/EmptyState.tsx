import React from 'react';
import { Plus } from 'lucide-react';

export const EmptyState = () => (
  <div className="absolute inset-0 flex items-center justify-center p-4">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
        <Plus className="text-gray-400" size={24} />
      </div>
      <h3 className="text-lg font-medium text-gray-600 mb-2">Start Building Your Workflow</h3>
      <p className="text-gray-500 text-sm sm:text-base">
        <span className="hidden lg:inline">Drag and drop nodes from the sidebar to get started</span>
        <span className="lg:hidden">Tap the menu button to add nodes and start building</span>
      </p>
    </div>
  </div>
);