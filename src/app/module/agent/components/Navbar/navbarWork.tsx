import React, { useState } from 'react';
import { Play, Save, Settings, X, Menu, Zap } from 'lucide-react';

export const  NavbarWork = ({ workflowName = "My Workflow", status = "Draft" }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="text-white" size={16} />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-semibold text-gray-800">{workflowName}</h1>
              <span className="text-xs text-gray-500 lg:hidden">Status: {status}</span>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2">
          <button className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-1 text-sm">
            <Play size={14} />
            <span className="hidden md:inline">Execute</span>
          </button>
          <button className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:green-blue-700 transition-colors flex items-center space-x-1 text-sm">
            <Save size={14} />
            <span className="hidden md:inline">Save</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <span className="hidden lg:block text-sm text-gray-500">Status: {status}</span>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md">
            <Settings size={18} />
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-gray-200">
          <div className="flex flex-col space-y-2">
            <button className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
              <Play size={16} />
              <span>Execute Workflow</span>
            </button>
            <button className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
              <Save size={16} />
              <span>Save Workflow</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};