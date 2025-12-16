'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface FilterCondition {
    field: string;
    operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'startsWith' | 'endsWith' | 'typeIs';
    value: string;
}

interface FilterConfig {
    conditions: FilterCondition[];
    combineOperation: 'AND' | 'OR';
    arrayPath?: string;
}

interface FilterViewProps {
    initialData?: Partial<FilterConfig>;
    onSave?: (config: FilterConfig) => void;
    nodeData?: any;
    inputData?: any[]; // Re-add input data
}

export const FilterView: React.FC<FilterViewProps> = ({
    initialData = {},
    onSave,
    inputData = [] // Default to empty array
}) => {
    const [config, setConfig] = useState<FilterConfig>({
        conditions: initialData.conditions || [{ field: '', operator: 'equals', value: '' }],
        combineOperation: initialData.combineOperation || 'AND',
        arrayPath: initialData.arrayPath || '',
    });

    const [availableFields, setAvailableFields] = useState<string[]>([]);

    // Extract available fields from input data
    useEffect(() => {
        if (inputData) {
            // Handle both array and single object input for field extraction
            let sampleItem = null;
            if (Array.isArray(inputData) && inputData.length > 0) {
                sampleItem = inputData[0];
            } else if (!Array.isArray(inputData) && typeof inputData === 'object') {
                sampleItem = inputData;
            }

            if (sampleItem && typeof sampleItem === 'object') {
                const extractKeys = (obj: any, prefix = ''): string[] => {
                    return Object.keys(obj).reduce((acc: string[], key) => {
                        const newKey = prefix ? `${prefix}.${key}` : key;
                        if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                            return [...acc, ...extractKeys(obj[key], newKey)];
                        }
                        return [...acc, newKey];
                    }, []);
                };
                setAvailableFields(extractKeys(sampleItem));
            }
        }
    }, [inputData]);

    useEffect(() => {
        setConfig({
            conditions: initialData.conditions || [{ field: '', operator: 'equals', value: '' }],
            combineOperation: initialData.combineOperation || 'AND',
            arrayPath: initialData.arrayPath || '',
        });
    }, [initialData]);

    const operators = [
        { label: 'Equals', value: 'equals' },
        { label: 'Not Equals', value: 'notEquals' },
        { label: 'Greater Than', value: 'greaterThan' },
        { label: 'Less Than', value: 'lessThan' },
        { label: 'Contains', value: 'contains' },
        { label: 'Starts With', value: 'startsWith' },
        { label: 'Ends With', value: 'endsWith' },
        { label: 'Type Is', value: 'typeIs' }, // Added Type check capability
    ];

    const addCondition = () => {
        setConfig(prev => ({
            ...prev,
            conditions: [...prev.conditions, { field: availableFields[0] || '', operator: 'equals', value: '' }]
        }));
    };

    const removeCondition = (index: number) => {
        setConfig(prev => ({
            ...prev,
            conditions: prev.conditions.filter((_, i) => i !== index)
        }));
    };

    const updateCondition = (index: number, field: keyof FilterCondition, value: any) => {
        setConfig(prev => ({
            ...prev,
            conditions: prev.conditions.map((cond, i) =>
                i === index ? { ...cond, [field]: value } : cond
            )
        }));
    };

    const handleSave = () => {
        if (onSave) {
            onSave(config);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-white">
            <div className="mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Filter Configuration</h1>
                <p className="text-xs sm:text-sm text-gray-600">Filter array items based on multiple conditions</p>
            </div>

            <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                        💡 <strong>Input:</strong> This node expects an array of items from the previous node. Each item will be evaluated against the filter conditions.
                    </p>
                </div>

                {/* Array Path Configuration */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Array Path (Optional)
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={(config as any).arrayPath || ''}
                            onChange={(e) => setConfig(prev => ({ ...prev, arrayPath: e.target.value }))}
                            placeholder="e.g. 'body' or 'data.items' (leave empty to auto-detect)"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        Specify where the list is located in the input data. Essential for Webhook inputs (e.g., use "body").
                    </p>
                </div>

                {/* Combine Operation */}
                {config.conditions.length > 1 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Combine Conditions
                        </label>
                        <select
                            value={config.combineOperation}
                            onChange={(e) => setConfig(prev => ({ ...prev, combineOperation: e.target.value as 'AND' | 'OR' }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                            <option value="AND">AND (all conditions must match)</option>
                            <option value="OR">OR (any condition must match)</option>
                        </select>
                    </div>
                )}

                {/* Filter Conditions */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Filter Conditions</h2>
                        <button
                            onClick={addCondition}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus size={16} />
                            Add Condition
                        </button>
                    </div>

                    {config.conditions.map((condition, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-gray-50 relative">
                            {config.conditions.length > 1 && (
                                <button
                                    onClick={() => removeCondition(index)}
                                    className="absolute top-2 right-2 p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                    title="Remove condition"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Field Name *
                                    </label>
                                    {availableFields.length > 0 ? (
                                        <select
                                            value={condition.field}
                                            onChange={(e) => updateCondition(index, 'field', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        >
                                            <option value="">Select a field</option>
                                            {availableFields.map(field => (
                                                <option key={field} value={field}>{field}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={condition.field}
                                            onChange={(e) => updateCondition(index, 'field', e.target.value)}
                                            placeholder="age"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Operator *
                                    </label>
                                    <select
                                        value={condition.operator}
                                        onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    >
                                        {operators.map(op => (
                                            <option key={op.value} value={op.value}>{op.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Value *
                                    </label>
                                    <input
                                        type="text"
                                        value={condition.value}
                                        onChange={(e) => updateCondition(index, 'value', e.target.value)}
                                        placeholder="25"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                </div>
                            </div>

                            {index < config.conditions.length - 1 && (
                                <div className="mt-2 text-center">
                                    <span className="inline-block px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded">
                                        {config.combineOperation}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Example */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Example Output</h3>
                    <div className="text-xs text-gray-600 space-y-1">
                        <p><strong>Filtered Items:</strong> Items that match {config.combineOperation === 'AND' ? 'all' : 'any'} conditions</p>
                        <p><strong>Count:</strong> Number of items that matched</p>
                        <p><strong>Removed Items:</strong> Items that didn&apos;t match the conditions</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t mt-6">
                <button
                    onClick={handleSave}
                    className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                    Save Configuration
                </button>
            </div>
        </div>
    );
};
