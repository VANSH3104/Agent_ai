'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Check, AlertCircle } from 'lucide-react';
import { useTRPC } from '@/trpc/client';
import { useQuery, useMutation } from '@tanstack/react-query';

interface SlackCredentials {
    botToken: string;
    workspaceId: string;
}

interface SlackConfig {
    channel: string;
    message: string;
    username?: string;
    iconEmoji?: string;
    threadTs?: string;
    asUser?: boolean;
}

interface SlackViewProps {
    initialData?: Partial<SlackConfig>;
    onSave?: (config: SlackConfig) => void;
    nodeData?: any;
}

export const SlackView: React.FC<SlackViewProps> = ({ initialData = {}, onSave, nodeData }) => {
    const [credentialsSaved, setCredentialsSaved] = useState(false);
    const [showCredentialsPanel, setShowCredentialsPanel] = useState(false);

    // Credentials state
    const [slackCreds, setSlackCreds] = useState<SlackCredentials>({
        botToken: '',
        workspaceId: '',
    });

    // Message config state
    const [config, setConfig] = useState<SlackConfig>({
        channel: initialData.channel || '',
        message: initialData.message || '',
        username: initialData.username || '',
        iconEmoji: initialData.iconEmoji || ':robot_face:',
        threadTs: initialData.threadTs || '',
        asUser: initialData.asUser ?? false,
    });

    // TRPC hooks
    const trpc = useTRPC();

    const existingCredentials = useQuery({
        queryKey: ['slackCredentials'],
        queryFn: () => trpc.credentials.getSlackCredentials.query(),
    });

    const saveCredentialsMutation = useMutation({
        mutationFn: (credentials: SlackCredentials) =>
            trpc.credentials.saveSlackCredentials.mutate({ credentials }),
        onSuccess: () => setCredentialsSaved(true),
    });

    // Load existing credentials
    useEffect(() => {
        if (existingCredentials?.data) {
            const creds = existingCredentials.data;
            setSlackCreds({
                botToken: creds.botToken || '',
                workspaceId: creds.workspaceId || '',
            });
            setCredentialsSaved(true);
        }
    }, [existingCredentials]);

    // Update config from initialData
    useEffect(() => {
        setConfig({
            channel: initialData.channel || '',
            message: initialData.message || '',
            username: initialData.username || '',
            iconEmoji: initialData.iconEmoji || ':robot_face:',
            threadTs: initialData.threadTs || '',
            asUser: initialData.asUser ?? false,
        });
    }, [initialData]);

    const updateConfig = (field: keyof SlackConfig, value: any) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveCredentials = () => {
        saveCredentialsMutation.mutate(slackCreds);
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
                    <MessageSquare size={24} className="text-purple-600" />
                    Slack Configuration
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">Send messages to Slack channels</p>
            </div>

            <div className="space-y-6">
                {/* Credentials Section */}
                <div className="border border-gray-200 rounded-lg">
                    <button
                        onClick={() => setShowCredentialsPanel(!showCredentialsPanel)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">Slack Credentials</span>
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
                                💡 Get your Bot Token from <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Slack API Dashboard</a>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bot Token * <span className="text-xs text-gray-500">(xoxb-...)</span>
                                </label>
                                <input
                                    type="password"
                                    value={slackCreds.botToken}
                                    onChange={(e) => setSlackCreds(prev => ({ ...prev, botToken: e.target.value }))}
                                    placeholder="xoxb-your-bot-token"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Workspace ID <span className="text-xs text-gray-500">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={slackCreds.workspaceId}
                                    onChange={(e) => setSlackCreds(prev => ({ ...prev, workspaceId: e.target.value }))}
                                    placeholder="T1234567890"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                />
                            </div>

                            <button
                                onClick={handleSaveCredentials}
                                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
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
                            Channel *
                        </label>
                        <input
                            type="text"
                            value={config.channel}
                            onChange={(e) => updateConfig('channel', e.target.value)}
                            placeholder="#general or @username"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Channel name (#channel) or user (@username)
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Message *
                        </label>
                        <textarea
                            value={config.message}
                            onChange={(e) => updateConfig('message', e.target.value)}
                            placeholder="Hello from workflow!"
                            rows={6}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Supports markdown and variables like {`{{data.name}}`}
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
                                placeholder="WorkflowBot"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Icon Emoji
                            </label>
                            <input
                                type="text"
                                value={config.iconEmoji}
                                onChange={(e) => updateConfig('iconEmoji', e.target.value)}
                                placeholder=":robot_face:"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={config.asUser}
                                onChange={(e) => updateConfig('asUser', e.target.checked)}
                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">Send as authenticated user</span>
                        </label>
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
