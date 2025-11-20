import { useState } from 'react';
import { Play, Save, Settings, X, Menu, Zap } from 'lucide-react';

interface NavbarProps {
  workflowName: string;
  status?: string;
  id: string;
}

import { WorkflowHeaders } from './components/agentHeaders';

export const NavbarWork = ({ workflowName, status = "Draft", id }: NavbarProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  const handleExecute = () => {
    // Execute workflow logic
    console.log('Executing workflow');
  };

  const handleSave = () => {
    // Save workflow logic
    console.log('Saving workflow');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="text-white" size={16} />
            </div>
            
            <div className="flex flex-col">
              <WorkflowHeaders id={id} workflowName={workflowName} />
              
              {/* Mobile Status */}
              <span className="text-xs text-gray-500 lg:hidden mt-1">
                Status: <span className={`font-medium ${
                  status === "Draft" ? "text-orange-500" : 
                  status === "Running" ? "text-green-500" : 
                  "text-gray-600"
                }`}>
                  {status}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center space-x-2">
          <button 
            onClick={handleExecute}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm font-medium"
          >
            <Play size={16} />
            <span>Execute</span>
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2 text-sm font-medium"
          >
            <Save size={16} />
            <span>Save</span>
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Desktop Status */}
          <div className="hidden lg:flex items-center space-x-2">
            <span className="text-sm text-gray-500">Status:</span>
            <span className={`text-sm font-medium ${
              status === "Draft" ? "text-orange-500" : 
              status === "Running" ? "text-green-500" : 
              "text-gray-600"
            }`}>
              {status}
            </span>
          </div>
          
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-gray-200">
          <div className="flex flex-col space-y-2">
            <button 
              onClick={handleExecute}
              className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Play size={16} />
              <span>Execute Workflow</span>
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Save size={16} />
              <span>Save Workflow</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};