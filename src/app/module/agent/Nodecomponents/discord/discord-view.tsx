'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Check, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useTRPC } from '@/trpc/client';
import { useQuery, useMutation } from '@tanstack/react-query';

interface DiscordCredentials {
    webhookUrl: string;
}

interface EmbedField {
    name: string;
    value: string;
    inline?: boolean;
}

interface DiscordEmbed {
    title?: string;
    description?: string;
    color?: string;
    fields?: EmbedField[];
    footer?: string;
    timestamp?: boolean;
}

interface DiscordConfig {
    content?: string;
    username?: string;
    avatarUrl?: string;
    useEmbed: boolean;
    embed?: DiscordEmbed;
}

interface DiscordViewProps {
    initialData?: Partial<DiscordConfig>;
    onSave?: (config: DiscordConfig) => void;
    nodeData?: any;
}

export const DiscordView: React.FC<DiscordViewProps> = ({ initialData = {}, onSave, nodeData }) => {
    const [credentialsSaved, setCredentialsSaved] = useState(false);
    const [showCredentialsPanel, setShowCredentialsPanel] = useState(false);

    // Credentials state
    const [discordCreds, setDiscordCreds] = useState<DiscordCredentials>({
        webhookUrl: '',
    });

    // Message config state
    const [config, setConfig] = useState<DiscordConfig>({
        content: initialData.content || '',
        username: initialData.username || '',
        avatarUrl: initialData.avatarUrl || '',
        useEmbed: initialData.useEmbed ?? true,
        embed: initialData.embed || {
            title: '',
            description: '',
            color: '#5865F2',
            fields: [],
            footer: '',
            timestamp: true,
        },
    });

    // TRPC hooks
    const trpc = useTRPC();

    const existingCredentials = useQuery({
        queryKey: ['discordCredentials'],
        queryFn: () => trpc.credentials.getDiscordCredentials.query(),
    });

    const saveCredentialsMutation = useMutation({
        mutationFn: (credentials: DiscordCredentials) =>
            trpc.credentials.saveDiscordCredentials.mutate({ credentials }),
        onSuccess: () => setCredentialsSaved(true),
    });

    // Load existing credentials
    useEffect(() => {
        if (existingCredentials?.data) {
            setDiscordCreds({
                webhookUrl: existingCredentials.data.webhookUrl || '',
            });
            setCredentialsSaved(true);
        }
    }, [existingCredentials]);

    // Update config from initialData
    useEffect(() => {
        setConfig({
            content: initialData.content || '',
            username: initialData.username || '',
            avatarUrl: initialData.avatarUrl || '',
            useEmbed: initialData.useEmbed ?? true,
            embed: initialData.embed || {
                title: '',
                description: '',
                color: '#5865F2',
                fields: [],
                footer: '',
                timestamp: true,
            },
        });
    }, [initialData]);

    const updateConfig = (field: keyof DiscordConfig, value: any) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    const updateEmbed = (field: keyof DiscordEmbed, value: any) => {
        setConfig(prev => ({
            ...prev,
            embed: { ...prev.embed, [field]: value },
        }));
    };

    const addEmbedField = () => {
        setConfig(prev => ({
            ...prev,
            embed: {
                ...prev.embed!,
                fields: [...(prev.embed?.fields || []), { name: '', value: '', inline: false }],
            },
        }));
    };

    const removeEmbedField = (index: number) => {
        setConfig(prev => ({
            ...prev,
            embed: {
                ...prev.embed!,
                fields: prev.embed?.fields?.filter((_, i) => i !== index) || [],
            },
        }));
    };

    const updateEmbedField = (index: number, field: keyof EmbedField, value: any) => {
        setConfig(prev => ({
            ...prev,
            embed: {
                ...prev.embed!,
                fields: prev.embed?.fields?.map((f, i) =>
                    i === index ? { ...f, [field]: value } : f
                ) || [],
            },
        }));
    };

    const handleSaveCredentials = () => {
        saveCredentialsMutation.mutate(discordCreds);
    };

    const handleSave = () => {
        if (onSave) {
            onSave(config);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-white">
            <div className="mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <MessageCircle size={24} className="text-indigo-600" />
                    Discord Configuration
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">Send messages and embeds to Discord channels</p>
            </div>

            <div className="space-y-6">
                {/* Credentials Section */}
                <div className="border border-gray-200 rounded-lg">
                    <button
                        onClick={() => setShowCredentialsPanel(!showCredentialsPanel)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">Discord Webhook</span>
                            {credentialsSaved && (
                                <span className="flex items-center gap-1 text-xs text-green-600">
                                    <Check size={14} /> Saved
                                </span>
                            )}
                            {!credentialsSaved && (
                                <span className="flex items-center gap-1 text-xs text-amber-600">
                                    <AlertCircle size={14} /> Not configured
                                </span>
                            )}
                        </div>
                        <span className="text-gray-500">{showCredentialsPanel ? '▼' : '▶'}</span>
                    </button>

                    {showCredentialsPanel && (
                        <div className="p-4 border-t space-y-4 bg-gray-50">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                                💡 Create a webhook in Discord: Server Settings → Integrations → Webhooks
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Webhook URL *
                                </label>
                                <input
                                    type="password"
                                    value={discordCreds.webhookUrl}
                                    onChange={(e) => setDiscordCreds({ webhookUrl: e.target.value })}
                                    placeholder="https://discord.com/api/webhooks/..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                />
                            </div>

                            <button
                                onClick={handleSaveCredentials}
                                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                            >
                                Save Credentials
                            </button>
                        </div>
                    )}
                </div>

                {/* Message Configuration */}
                <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Message Configuration</h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Message Content
                        </label>
                        <textarea
                            value={config.content}
                            onChange={(e) => updateConfig('content', e.target.value)}
                            placeholder="Hello from workflow! (optional if using embed)"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Plain text message (supports {`{{variables}}`})
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Bot Username
                            </label>
                            <input
                                type="text"
                                value={config.username}
                                onChange={(e) => updateConfig('username', e.target.value)}
                                placeholder="Workflow Bot"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Avatar URL
                            </label>
                            <input
                                type="text"
                                value={config.avatarUrl}
                                onChange={(e) => updateConfig('avatarUrl', e.target.value)}
                                placeholder="https://..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={config.useEmbed}
                                onChange={(e) => updateConfig('useEmbed', e.target.checked)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Use Rich Embed</span>
                        </label>
                    </div>

                    {/* Embed Configuration */}
                    {config.useEmbed && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                            <h4 className="text-sm font-semibold text-gray-900">Embed Settings</h4>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={config.embed?.title}
                                    onChange={(e) => updateEmbed('title', e.target.value)}
                                    placeholder="Workflow Notification"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={config.embed?.description}
                                    onChange={(e) => updateEmbed('description', e.target.value)}
                                    placeholder="Detailed message..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Color
                                </label>
                                <input
                                    type="color"
                                    value={config.embed?.color}
                                    onChange={(e) => updateEmbed('color', e.target.value)}
                                    className="h-10 w-full rounded-lg border border-gray-300"
                                />
                            </div>

                            {/* Embed Fields */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        Fields
                                    </label>
                                    <button
                                        onClick={addEmbedField}
                                        className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                    >
                                        <Plus size={14} /> Add Field
                                    </button>
                                </div>

                                {config.embed?.fields?.map((field, index) => (
                                    <div key={index} className="relative p-3 bg-white rounded border border-gray-200 mb-2">
                                        <button
                                            onClick={() => removeEmbedField(index)}
                                            className="absolute top-2 right-2 p-1 text-red-600 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 size={14} />
                                        </button>

                                        <div className="space-y-2 pr-8">
                                            <input
                                                type="text"
                                                value={field.name}
                                                onChange={(e) => updateEmbedField(index, 'name', e.target.value)}
                                                placeholder="Field Name"
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                            />
                                            <input
                                                type="text"
                                                value={field.value}
                                                onChange={(e) => updateEmbedField(index, 'value', e.target.value)}
                                                placeholder="Field Value"
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                            />
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={field.inline}
                                                    onChange={(e) => updateEmbedField(index, 'inline', e.target.checked)}
                                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-xs text-gray-700">Inline</span>
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Footer
                                </label>
                                <input
                                    type="text"
                                    value={config.embed?.footer}
                                    onChange={(e) => updateEmbed('footer', e.target.value)}
                                    placeholder="Workflow execution"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                />
                            </div>

                            <div>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={config.embed?.timestamp}
                                        onChange={(e) => updateEmbed('timestamp', e.target.checked)}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700">Include timestamp</span>
                                </label>
                            </div>
                        </div>
                    )}
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
