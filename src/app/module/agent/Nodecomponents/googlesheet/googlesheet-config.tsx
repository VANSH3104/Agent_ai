import React from 'react';
import { FileSpreadsheet } from 'lucide-react';

interface GoogleSheetConfigProps {
    nodeData: any;
    updateNodeData: (key: string, value: any) => void;
}

export const GoogleSheetConfig: React.FC<GoogleSheetConfigProps> = ({
    nodeData,
    updateNodeData
}) => {
    if (!nodeData) return null;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 pb-2 border-b">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                <h3 className="text-sm font-semibold text-gray-900">Google Sheet Configuration</h3>
            </div>

            {/* Spreadsheet Settings */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-800 mb-3">Sheet Connection</h4>

                <div className="space-y-3">
                    {/* Spreadsheet ID */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Spreadsheet ID *
                        </label>
                        <input
                            type="text"
                            value={nodeData.spreadsheetId || ''}
                            onChange={(e) => updateNodeData('spreadsheetId', e.target.value)}
                            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                            className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Found in the sheet URL between /d/ and /edit
                        </p>
                    </div>

                    {/* Sheet Name */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Sheet Name
                        </label>
                        <input
                            type="text"
                            value={nodeData.sheetName || ''}
                            onChange={(e) => updateNodeData('sheetName', e.target.value)}
                            placeholder="Sheet1"
                            className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Name of the specific sheet tab (default: Sheet1)
                        </p>
                    </div>

                    {/* Operation Type */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                            Operation
                        </label>
                        <select
                            value={nodeData.operation || 'append'}
                            onChange={(e) => updateNodeData('operation', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="append">Append Row</option>
                            <option value="update">Update Row</option>
                            <option value="clear">Clear Range</option>
                        </select>
                    </div>

                    {/* Range (for update/clear) */}
                    {(nodeData.operation === 'update' || nodeData.operation === 'clear') && (
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Range
                            </label>
                            <input
                                type="text"
                                value={nodeData.range || ''}
                                onChange={(e) => updateNodeData('range', e.target.value)}
                                placeholder="A2:D2"
                                className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Specify the range to update/clear (e.g., A2:D2)
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Data Mapping */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-800 mb-3">Data Configuration</h4>

                <div className="space-y-3">
                    {/* Header Row */}
                    <div>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={nodeData.hasHeader !== false}
                                onChange={(e) => updateNodeData('hasHeader', e.target.checked)}
                                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-gray-700">First row contains headers</span>
                        </label>
                    </div>

                    {/* Column Mapping */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Column Mapping
                        </label>
                        <textarea
                            rows={4}
                            value={nodeData.columnMapping ? JSON.stringify(nodeData.columnMapping, null, 2) : '{}'}
                            onChange={(e) => {
                                try {
                                    const parsed = JSON.parse(e.target.value);
                                    updateNodeData('columnMapping', parsed);
                                } catch {
                                    updateNodeData('columnMapping', e.target.value);
                                }
                            }}
                            placeholder={`{
  "name": "A",
  "email": "B",
  "status": "C"
}`}
                            className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Map input field names to column letters
                        </p>
                    </div>
                </div>
            </div>

            {/* Authentication Note */}
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-xs text-blue-800">
                    <strong>Note:</strong> This node requires Google Sheets API credentials.
                    Make sure to configure OAuth2 or Service Account authentication.
                </p>
            </div>
        </div>
    );
};
