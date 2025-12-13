import React from 'react';

interface GoogleSheetInputsProps {
    nodeData: any;
}

export const GoogleSheetInputs: React.FC<GoogleSheetInputsProps> = ({ nodeData }) => {
    return (
        <div className="space-y-3">
            <div className="text-xs font-medium text-gray-700">Row Data</div>
            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <p className="text-xs text-gray-600">
                    Accepts JSON object with data to write to the sheet
                </p>
                <div className="mt-2 font-mono text-xs bg-white p-2 rounded border">
                    {`{ "name": "John", "email": "john@example.com" }`}
                </div>
            </div>
        </div>
    );
};
