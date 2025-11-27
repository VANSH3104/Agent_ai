// components/AgentComponents/googleforms/google-form-config.tsx
import React from 'react';

interface GoogleFormConfigProps {
  nodeData: any;
  updateNodeData: (key: string, value: any) => void;
}

export const GoogleFormConfig: React.FC<GoogleFormConfigProps> = ({
  nodeData,
  updateNodeData
}) => {
  if(!nodeData) return null;
  return (
    <div className="space-y-4">
      {/* Basic Settings */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-800 mb-3">Google Forms Configuration</h4>
        
        <div className="space-y-3">
          {/* Form ID */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Google Form ID
            </label>
            <input
              type="text"
              value={nodeData.formId || ''}
              onChange={(e) => updateNodeData('formId', e.target.value)}
              placeholder="1FAIpQLS... (optional)"
              className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: For tracking which form submissions belong to which form
            </p>
          </div>

          {/* Form Title */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Form Title
            </label>
            <input
              type="text"
              value={nodeData.formTitle || ''}
              onChange={(e) => updateNodeData('formTitle', e.target.value)}
              placeholder="Customer Feedback Form"
              className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Response Handling */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Response Handling
            </label>
            <select
              value={nodeData.responseHandling || 'process'}
              onChange={(e) => updateNodeData('responseHandling', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="process">Process immediately</option>
              <option value="queue">Add to queue</option>
              <option value="validate">Validate first</option>
            </select>
          </div>

          {/* Duplicate Protection */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={nodeData.preventDuplicates || false}
                onChange={(e) => updateNodeData('preventDuplicates', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Prevent duplicate submissions</span>
            </label>
          </div>

          {/* Timeout Settings */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Webhook Timeout (seconds)
            </label>
            <input
              type="number"
              min="5"
              max="30"
              value={nodeData.timeout || 15}
              onChange={(e) => updateNodeData('timeout', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-800 mb-3">Security Settings</h4>
        
        <div className="space-y-3">
          {/* Secret Token */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Webhook Secret Token
            </label>
            <input
              type="password"
              value={nodeData.secretToken || ''}
              onChange={(e) => updateNodeData('secretToken', e.target.value)}
              placeholder="Enter secret token for verification"
              className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Add a token that Google Forms should send for verification
            </p>
          </div>

          {/* IP Whitelist */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Allowed IP Addresses
            </label>
            <textarea
              rows={3}
              value={nodeData.allowedIPs || ''}
              onChange={(e) => updateNodeData('allowedIPs', e.target.value)}
              placeholder="173.194.0.0/16&#10;74.125.0.0/16"
              className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter one IP range per line (Google IP ranges shown as example)
            </p>
          </div>
        </div>
      </div>

      {/* Data Transformation */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-800 mb-3">Data Transformation</h4>
        
        <div className="space-y-3">
          {/* Auto-transform answers */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={nodeData.autoTransform !== false}
                onChange={(e) => updateNodeData('autoTransform', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Auto-transform answers to standard format</span>
            </label>
          </div>

          {/* Field Mapping */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Custom Field Mapping
            </label>
            <textarea
              rows={4}
              value={nodeData.fieldMapping ? JSON.stringify(nodeData.fieldMapping, null, 2) : '{}'}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updateNodeData('fieldMapping', parsed);
                } catch {
                  // Keep as string if invalid JSON
                  updateNodeData('fieldMapping', e.target.value);
                }
              }}
              placeholder={`{
  "name": "fullName",
  "email": "emailAddress",
  "rating": "satisfactionScore"
}`}
              className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Map Google Forms field names to your preferred field names
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};