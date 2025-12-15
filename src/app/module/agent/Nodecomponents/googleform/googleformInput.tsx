import React from 'react';

interface GoogleFormInputsProps {
  nodeData: any;
  updateNodeData: (key: string, value: any) => void;
}

export const GoogleFormInputs: React.FC<GoogleFormInputsProps> = ({
  nodeData,
  updateNodeData
}) => {
  if(!nodeData) return null;
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-3">Google Forms Input Configuration</h4>
        
        <div className="space-y-3">
          {/* Webhook URL Display */}
          <div>
            <label className="block text-xs font-medium text-blue-700 mb-1">
              Webhook URL
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/webhooks/google-forms/${nodeData?.workflowId || 'WORKFLOW_ID'}`}
                className="flex-1 px-3 py-2 border border-blue-200 rounded text-sm bg-blue-100 text-blue-800"
              />
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/webhooks/google-forms/${nodeData?.workflowId || 'WORKFLOW_ID'}`)}
                className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Use this URL in Google Apps Script or Make.com
            </p>
          </div>

          {/* Expected Input Format */}
          <div>
            <label className="block text-xs font-medium text-blue-700 mb-2">
              Expected Input Format
            </label>
            <div className="bg-white p-3 border border-blue-200 rounded text-xs font-mono">
              {`{
  "responseId": "ABC123",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "formId": "FORM_123",
  "formTitle": "Your Form Title",
  "respondentEmail": "user@example.com",
  "answers": {
    "name": "John Doe",
    "email": "john@example.com",
    "question1": "Answer 1",
    "question2": "Answer 2"
  }
}`}
            </div>
          </div>

          {/* Input Validation */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={nodeData?.validateInput || true}
                onChange={(e) => updateNodeData('validateInput', e.target.checked)}
                className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-blue-700">Validate incoming data</span>
            </label>
          </div>

          {/* Required Fields */}
          <div>
            <label className="block text-xs font-medium text-blue-700 mb-2">
              Required Fields
            </label>
            <div className="space-y-1 text-xs text-blue-600">
              <div>• responseId</div>
              <div>• timestamp</div>
              <div>• formId</div>
              <div>• answers object</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};