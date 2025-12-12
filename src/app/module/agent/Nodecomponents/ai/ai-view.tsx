'use client';

import { useState, useEffect } from 'react';
import { useTRPC } from '@/trpc/client';
import { useQuery, useMutation } from '@tanstack/react-query';

interface AIConfig {
    systemPrompt: string;
    userPrompt: string;
    temperature: number;
    maxTokens: number;
}

interface AICredentials {
    provider: string;
    apiKey: string;
    model: string;
}

interface AIViewProps {
    initialData?: Partial<AIConfig>;
    onSave?: (config: AIConfig & { credentials?: AICredentials }) => void;
    nodeData?: any;
}

interface ValidationErrors {
    systemPrompt?: string;
    userPrompt?: string;
    provider?: string;
    apiKey?: string;
    model?: string;
}

export const AIView: React.FC<AIViewProps> = ({ initialData = {}, onSave }) => {
    const trpc = useTRPC();

    const [aiConfig, setAIConfig] = useState<AIConfig>({
        systemPrompt: initialData.systemPrompt || '',
        userPrompt: initialData.userPrompt || '',
        temperature: initialData.temperature ?? 0.7,
        maxTokens: initialData.maxTokens || 1000,
    });

    const [aiCredentials, setAICredentials] = useState<AICredentials>({
        provider: 'openai',
        apiKey: '',
        model: 'gpt-4',
    });

    const [errors, setErrors] = useState<ValidationErrors>({});
    const [showCredentials, setShowCredentials] = useState(false);
    const [credentialsSaved, setCredentialsSaved] = useState(false);
    const [useCustomModel, setUseCustomModel] = useState(false);
    const [customModel, setCustomModel] = useState('');

    // Fetch existing credentials
    const { data: existingCredentials, isLoading } = useQuery(
        trpc.credentials.getAICredentials.queryOptions()
    );
    const saveCredentialsMutation = useMutation(
        trpc.credentials.saveAICredentials.mutationOptions()
    );

    // Load credentials when available
    useEffect(() => {
        if (existingCredentials?.data) {
            const creds = existingCredentials.data;
            setAICredentials({
                provider: creds.provider || 'openai',
                apiKey: creds.apiKey || '',
                model: creds.model || 'gpt-4',
            });
            setCredentialsSaved(true);
        }
    }, [existingCredentials]);

    // Update config from initialData
    useEffect(() => {
        setAIConfig({
            systemPrompt: initialData.systemPrompt || '',
            userPrompt: initialData.userPrompt || '',
            temperature: initialData.temperature ?? 0.7,
            maxTokens: initialData.maxTokens || 1000,
        });
    }, [initialData]);

    const updateAIConfig = (field: keyof AIConfig, value: string | number) => {
        setAIConfig(prev => ({ ...prev, [field]: value }));
        if (errors[field as keyof ValidationErrors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const updateCredentials = (field: keyof AICredentials, value: string) => {
        setAICredentials(prev => ({ ...prev, [field]: value }));
        if (errors[field as keyof ValidationErrors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const validateFields = (): boolean => {
        const newErrors: ValidationErrors = {};

        if (!aiCredentials.provider.trim()) {
            newErrors.provider = 'Provider is required';
        }

        if (!aiCredentials.apiKey.trim()) {
            newErrors.apiKey = 'API Key is required';
        }

        if (!aiCredentials.model.trim()) {
            newErrors.model = 'Model is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveCredentials = async () => {
        if (!validateFields()) {
            return;
        }

        try {
            await saveCredentialsMutation.mutateAsync(aiCredentials);
            setCredentialsSaved(true);
            setShowCredentials(false);
            alert('AI credentials saved successfully!');
        } catch (error) {
            alert('Failed to save credentials. Please try again.');
        }
    };

    const handleSave = () => {
        if (onSave) {
            onSave({
                ...aiConfig,
                credentials: aiCredentials
            });
        }
    };

    const providers = [
        { value: 'openai', label: 'OpenAI', models: ['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-3.5-turbo', 'o1-preview', 'o1-mini'] },
        { value: 'anthropic', label: 'Anthropic (Claude)', models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307', 'claude-3-5-sonnet-20241022'] },
        { value: 'google', label: 'Google Gemini', models: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'] },
    ];

    const currentProvider = providers.find(p => p.value === aiCredentials.provider) || providers[0];

    // Check if current model is in the predefined list
    const isModelInList = currentProvider.models.includes(aiCredentials.model);

    // Auto-detect custom model on load
    if (!isModelInList && aiCredentials.model && !useCustomModel) {
        setUseCustomModel(true);
        setCustomModel(aiCredentials.model);
    }

    if (isLoading) {
        return (
            <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-white">
                <div className="text-center py-8">Loading credentials...</div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-white">
            <div className="mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">AI Configuration</h1>
                <p className="text-xs sm:text-sm text-gray-600">Configure AI model and prompts</p>
            </div>

            <div className="space-y-6">
                {/* AI Credentials Section */}
                <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            AI API Credentials
                            {credentialsSaved && (
                                <span className="ml-2 text-sm text-green-600">✓ Saved</span>
                            )}
                        </h2>
                        <button
                            onClick={() => setShowCredentials(!showCredentials)}
                            className="text-sm text-blue-600 hover:text-blue-700"
                        >
                            {showCredentials ? 'Hide' : credentialsSaved ? 'Edit' : 'Show'}
                        </button>
                    </div>

                    {showCredentials && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Provider *
                                </label>
                                <select
                                    value={aiCredentials.provider}
                                    onChange={(e) => updateCredentials('provider', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.provider ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                >
                                    {providers.map(p => (
                                        <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                </select>
                                {errors.provider && (
                                    <p className="mt-1 text-sm text-red-600">{errors.provider}</p>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Model *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUseCustomModel(!useCustomModel);
                                            if (!useCustomModel) {
                                                setCustomModel(aiCredentials.model);
                                            } else {
                                                updateCredentials('model', currentProvider.models[0]);
                                            }
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-700"
                                    >
                                        {useCustomModel ? 'Use Preset Models' : 'Use Custom Model'}
                                    </button>
                                </div>

                                {useCustomModel ? (
                                    <input
                                        type="text"
                                        value={customModel}
                                        onChange={(e) => {
                                            setCustomModel(e.target.value);
                                            updateCredentials('model', e.target.value);
                                        }}
                                        placeholder="Enter custom model name (e.g., gpt-4o-mini)"
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.model ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                ) : (
                                    <select
                                        value={aiCredentials.model}
                                        onChange={(e) => updateCredentials('model', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.model ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    >
                                        {currentProvider.models.map(model => (
                                            <option key={model} value={model}>{model}</option>
                                        ))}
                                    </select>
                                )}

                                {errors.model && (
                                    <p className="mt-1 text-sm text-red-600">{errors.model}</p>
                                )}
                                {useCustomModel && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        💡 Enter any model name supported by {currentProvider.label}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    API Key *
                                </label>
                                <input
                                    type="password"
                                    value={aiCredentials.apiKey}
                                    onChange={(e) => updateCredentials('apiKey', e.target.value)}
                                    placeholder="sk-..."
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.apiKey ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.apiKey && (
                                    <p className="mt-1 text-sm text-red-600">{errors.apiKey}</p>
                                )}
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={handleSaveCredentials}
                                    disabled={saveCredentialsMutation.isPending}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                                >
                                    {saveCredentialsMutation.isPending ? 'Saving...' : 'Save AI Credentials'}
                                </button>
                            </div>
                        </div>
                    )}

                    {!showCredentials && credentialsSaved && (
                        <p className="text-sm text-gray-600">
                            Configured: <span className="font-medium">{currentProvider.label}</span> - {aiCredentials.model}
                        </p>
                    )}

                    {!showCredentials && !credentialsSaved && (
                        <p className="text-sm text-amber-600">
                            ⚠ AI credentials not configured. Please add credentials to use AI.
                        </p>
                    )}
                </div>

                {/* Prompt Configuration */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Prompt Configuration</h2>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                            💡 <strong>User Message:</strong> The user prompt will be automatically populated from the previous node's output data. You can also set a default prompt below.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            System Prompt (Optional)
                        </label>
                        <textarea
                            value={aiConfig.systemPrompt}
                            onChange={(e) => updateAIConfig('systemPrompt', e.target.value)}
                            placeholder="You are a helpful assistant that..."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-y"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Optional: Set the AI's behavior and personality
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Default User Prompt (Optional)
                        </label>
                        <textarea
                            value={aiConfig.userPrompt}
                            onChange={(e) => updateAIConfig('userPrompt', e.target.value)}
                            placeholder="Analyze the following data..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-y"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Optional: Default prompt (will be overridden by input data)
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Temperature (0-2)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="2"
                                step="0.1"
                                value={aiConfig.temperature}
                                onChange={(e) => updateAIConfig('temperature', parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Higher = more creative, Lower = more focused
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Tokens
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="4000"
                                value={aiConfig.maxTokens}
                                onChange={(e) => updateAIConfig('maxTokens', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Maximum length of AI response
                            </p>
                        </div>
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
