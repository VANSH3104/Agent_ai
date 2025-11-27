// components/AgentComponents/googleforms/google-form-outputs.tsx
import React from 'react';

interface GoogleFormOutputsProps {
  nodeData: any;
}

export const GoogleFormOutputs: React.FC<GoogleFormOutputsProps> = ({
  nodeData
}) => {
  
  const sampleOutput = {
    submissionId: "ABC123XYZ",
    submittedAt: "2024-01-15T10:30:00.000Z",
    form: {
      id: "FORM_123",
      title: "Customer Feedback Form"
    },
    respondent: {
      email: "user@example.com"
    },
    answers: {
      name: "John Doe",
      email: "john@example.com",
      rating: "5",
      comments: "Great service!",
      product: "Premium Plan"
    },
    metadata: {
      source: "GoogleForm",
      workflowId: nodeData.workflowId,
      receivedAt: new Date().toISOString()
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-green-800 mb-3">Google Forms Output Data</h4>
        
        <div className="space-y-3">
          {/* Output Structure */}
          <div>
            <label className="block text-xs font-medium text-green-700 mb-2">
              Output Data Structure
            </label>
            <div className="bg-white p-3 border border-green-200 rounded text-xs font-mono overflow-x-auto">
              {JSON.stringify(sampleOutput, null, 2)}
            </div>
          </div>

          {/* Available Variables */}
          <div>
            <label className="block text-xs font-medium text-green-700 mb-2">
              Available Variables for Next Nodes
            </label>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 bg-green-100 rounded">
                <code className="text-green-800">{"{{input.submissionId}}"}</code>
                <span className="text-green-600">Unique submission ID</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-100 rounded">
                <code className="text-green-800">{"{{input.submittedAt}}"}</code>
                <span className="text-green-600">Submission timestamp</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-100 rounded">
                <code className="text-green-800">{"{{input.form.title}}"}</code>
                <span className="text-green-600">Form title</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-100 rounded">
                <code className="text-green-800">{"{{input.answers.name}}"}</code>
                <span className="text-green-600">Respondent's name</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-100 rounded">
                <code className="text-green-800">{"{{input.answers.email}}"}</code>
                <span className="text-green-600">Respondent's email</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-100 rounded">
                <code className="text-green-800">{"{{input.answers.*}}"}</code>
                <span className="text-green-600">Any form field</span>
              </div>
            </div>
          </div>

          {/* Usage Examples */}
          <div>
            <label className="block text-xs font-medium text-green-700 mb-2">
              Usage Examples in HTTP Node
            </label>
            <div className="space-y-2 text-xs">
              <div className="p-2 bg-white border border-green-200 rounded">
                <div className="text-green-600 mb-1">Send to CRM:</div>
                <code className="text-gray-700">
                  {`Body: { "customer": "{{input.answers.name}}", "email": "{{input.answers.email}}" }`}
                </code>
              </div>
              <div className="p-2 bg-white border border-green-200 rounded">
                <div className="text-green-600 mb-1">Send to Slack:</div>
                <code className="text-gray-700">
                  {`Body: { "text": "New response from {{input.answers.name}}" }`}
                </code>
              </div>
            </div>
          </div>

          {/* Test Webhook */}
          <div className="pt-2">
            <button
              onClick={() => {
                // Simulate a test webhook call
                console.log('Test webhook triggered for Google Forms node');
              }}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded text-sm font-medium transition-colors"
            >
              Test Webhook Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};