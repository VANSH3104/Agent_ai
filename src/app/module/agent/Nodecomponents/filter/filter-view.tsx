'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface FilterCondition {
    field: string;
    operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'startsWith' | 'endsWith';
    value: string;
}

interface FilterConfig {
    conditions: FilterCondition[];
    combineOperation: 'AND' | 'OR';
}

interface FilterViewProps {
    initialData?: Partial<FilterConfig>;
    onSave?: (config: FilterConfig) => void;
    nodeData?: any;
}

export const FilterView: React.FC<FilterViewProps> = ({ initialData = {}, onSave }) => {
    const [config, setConfig] = useState<FilterConfig>({
        conditions: initialData.conditions || [{ field: '', operator: 'equals', value: '' }],
        combineOperation: initialData.combineOperation || 'AND',
    });

    useEffect(() => {
        setConfig({
            conditions: initialData.conditions || [{ field: '', operator: 'equals', value: '' }],
            combineOperation: initialData.combineOperation || 'AND',
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
    ];

    const addCondition = () => {
        setConfig(prev => ({
            ...prev,
            conditions: [...prev.conditions, { field: '', operator: 'equals', value: '' }]
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
                                    <input
                                        type="text"
                                        value={condition.field}
                                        onChange={(e) => updateCondition(index, 'field', e.target.value)}
                                        placeholder="age"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
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
                        <p><strong>Removed Items:</strong> Items that didn't match the conditions</p>
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
