'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Split } from 'lucide-react';

interface Condition {
    field: string;
    operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'greaterOrEqual' | 'lessOrEqual' | 'contains' | 'startsWith' | 'endsWith';
    value: string;
}

interface ConditionConfig {
    conditions: Condition[];
    combineOperation: 'AND' | 'OR';
    trueOutputSource?: string;
    falseOutputSource?: string;
}

interface ConditionViewProps {
    initialData?: Partial<ConditionConfig>;
    onSave?: (config: ConditionConfig) => void;
    nodeData?: any;
}

export const ConditionView: React.FC<ConditionViewProps> = ({ initialData = {}, onSave }) => {
    const [config, setConfig] = useState<ConditionConfig>({
        conditions: initialData.conditions || [{ field: '', operator: 'equals', value: '' }],
        combineOperation: initialData.combineOperation || 'AND',
        trueOutputSource: initialData.trueOutputSource || '',
        falseOutputSource: initialData.falseOutputSource || '',
    });

    useEffect(() => {
        setConfig({
            conditions: initialData.conditions || [{ field: '', operator: 'equals', value: '' }],
            combineOperation: initialData.combineOperation || 'AND',
            trueOutputSource: initialData.trueOutputSource || '',
            falseOutputSource: initialData.falseOutputSource || '',
        });
    }, [initialData]);

    const operators = [
        { label: 'Equals', value: 'equals' },
        { label: 'Not Equals', value: 'notEquals' },
        { label: 'Greater Than', value: 'greaterThan' },
        { label: 'Less Than', value: 'lessThan' },
        { label: 'Greater or Equal', value: 'greaterOrEqual' },
        { label: 'Less or Equal', value: 'lessOrEqual' },
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

    const updateCondition = (index: number, field: keyof Condition, value: any) => {
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

    const isSplitterMode = !!(config.trueOutputSource && config.falseOutputSource);

    return (
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-white">
            <div className="mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Condition Configuration</h1>
                <p className="text-xs sm:text-sm text-gray-600">Create conditional branches or split arrays based on field paths</p>
            </div>

            <div className="space-y-6">
                {/* Mode Indicator */}
                {isSplitterMode && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-start gap-2">
                        <Split className="text-purple-600 mt-0.5" size={18} />
                        <div>
                            <p className="text-sm font-semibold text-purple-900">Array Splitter Mode Active</p>
                            <p className="text-xs text-purple-700 mt-1">
                                This node will split input arrays into True and False outputs based on the configured field paths.
                            </p>
                        </div>
                    </div>
                )}

                {!isSplitterMode && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                            💡 <strong>Boolean Branching Mode:</strong> Evaluates conditions and routes to True or False output.
                        </p>
                    </div>
                )}

                {/* Combine Operation */}
                {config.conditions.length > 1 && !isSplitterMode && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Combine Conditions
                        </label>
                        <select
                            value={config.combineOperation}
                            onChange={(e) => setConfig(prev => ({ ...prev, combineOperation: e.target.value as 'AND' | 'OR' }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                            <option value="AND">AND (all conditions must be true)</option>
                            <option value="OR">OR (any condition must be true)</option>
                        </select>
                    </div>
                )}

                {/* Output Source Configuration */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="flex items-center gap-2 mb-3">
                        <Split size={20} className="text-purple-600" />
                        <h3 className="text-sm font-semibold text-gray-900">Output Source Configuration</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                True Output Field Path
                            </label>
                            <input
                                type="text"
                                value={config.trueOutputSource || ''}
                                onChange={(e) => setConfig(prev => ({ ...prev, trueOutputSource: e.target.value }))}
                                placeholder="e.g. passed or data.active"
                                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                            <p className="mt-1 text-xs text-blue-600">
                                {isSplitterMode ? 'Array field to send to True output' : 'Optional: Extract specific field for True branch'}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                False Output Field Path
                            </label>
                            <input
                                type="text"
                                value={config.falseOutputSource || ''}
                                onChange={(e) => setConfig(prev => ({ ...prev, falseOutputSource: e.target.value }))}
                                placeholder="e.g. removed or data.inactive"
                                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                            />
                            <p className="mt-1 text-xs text-red-600">
                                {isSplitterMode ? 'Array field to send to False output' : 'Optional: Extract specific field for False branch'}
                            </p>
                        </div>
                    </div>

                    {isSplitterMode && (
                        <div className="mt-3 p-3 bg-white rounded border border-purple-200">
                            <p className="text-xs text-gray-700">
                                <strong>Array Splitter Mode:</strong> When both paths are set, the node extracts arrays from the specified fields and sends them to their respective outputs. Conditions are ignored in this mode.
                            </p>
                        </div>
                    )}
                </div>

                {/* Conditions - Only show if NOT in splitter mode */}
                {!isSplitterMode && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Conditions</h2>
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
                                            placeholder="status"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">Field from input data</p>
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
                                            placeholder="active"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">Value to compare</p>
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
                )}
               
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t mt-6">
                <button
                    onClick={handleSave}
                    className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base font-medium"
                >
                    Save Configuration
                </button>
            </div>
        </div>
    );
};