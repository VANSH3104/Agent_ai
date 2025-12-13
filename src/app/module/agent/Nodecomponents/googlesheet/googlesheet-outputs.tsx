import React from 'react';

interface GoogleSheetOutputsProps {
    nodeData: any;
}

export const GoogleSheetOutputs: React.FC<GoogleSheetOutputsProps> = ({ nodeData }) => {
    return (
        <div className="space-y-3">
            <div className="text-xs font-medium text-gray-700">Operation Result</div>
            <div className="space-y-2">
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                    <div className="text-xs font-medium text-gray-600 mb-1">success</div>
                    <p className="text-xs text-gray-500">Boolean indicating if operation succeeded</p>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                    <div className="text-xs font-medium text-gray-600 mb-1">updatedRange</div>
                    <p className="text-xs text-gray-500">The range that was modified (e.g., "Sheet1!A2:C2")</p>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                    <div className="text-xs font-medium text-gray-600 mb-1">rowsAffected</div>
                    <p className="text-xs text-gray-500">Number of rows added or updated</p>
                </div>
            </div>
        </div>
    );
};
