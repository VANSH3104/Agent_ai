'use client';

import { useState, useEffect } from 'react';
import { Webhook as WebhookIcon, Copy, Check } from 'lucide-react';

interface WebhookConfig {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    authentication: 'none' | 'basic' | 'apikey';
    apiKey?: string;
    username?: string;
    password?: string;
    responseMode: 'lastNode' | 'firstSucceeding' | 'custom';
    customResponse?: string;
}

interface WebhookViewProps {
    initialData?: Partial<WebhookConfig>;
    onSave?: (config: WebhookConfig) => void;
    nodeData?: any;
}

export const WebhookView: React.FC<WebhookViewProps> = ({ initialData = {}, onSave, nodeData }) => {
    const [config, setConfig] = useState<WebhookConfig>({
        method: initialData.method || 'POST',
        path: initialData.path || '/webhook',
        authentication: initialData.authentication || 'none',
        apiKey: initialData.apiKey || '',
        username: initialData.username || '',
        password: initialData.password || '',
        responseMode: initialData.responseMode || 'lastNode',
        customResponse: initialData.customResponse || '',
    });

    const [copied, setCopied] = useState(false);
    const [errors, setErrors] = useState<{ path?: string }>({});

    // Generate webhook URL
    // nodeData is the full node object from PropertiesPanel
    // workflowId is stored in nodeData.data.workflowId
    const workflowId = nodeData?.data?.workflowId || nodeData?.workflowId || 'WORKFLOW_ID_NOT_FOUND';
    console.log("Full nodeData object:", nodeData);
    console.log("Extracted workflowId:", workflowId);
    const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/webhooks${config.path}?workflowId=${workflowId}`;
    console.log("Generated webhook URL:", webhookUrl);
    useEffect(() => {
        setConfig({
            method: initialData.method || 'POST',
            path: initialData.path || '/webhook',
            authentication: initialData.authentication || 'none',
            apiKey: initialData.apiKey || '',
            username: initialData.username || '',
            password: initialData.password || '',
            responseMode: initialData.responseMode || 'lastNode',
            customResponse: initialData.customResponse || '',
        });
    }, [initialData]);

    const updateConfig = (field: keyof WebhookConfig, value: any) => {
        setConfig(prev => ({ ...prev, [field]: value }));
        if (errors[field as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(webhookUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const validatePath = (path: string): boolean => {
        if (!path.trim()) {
            setErrors({ path: 'Path is required' });
            return false;
        }
        if (!path.startsWith('/')) {
            setErrors({ path: 'Path must start with /' });
            return false;
        }
        return true;
    };

    const handleSave = () => {
        if (!validatePath(config.path)) {
            return;
        }

        if (onSave) {
            onSave(config);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-white">
            <div className="mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <WebhookIcon size={24} />
                    Webhook Configuration
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">Configure HTTP webhook to trigger this workflow</p>
            </div>

            <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                        💡 <strong>Trigger:</strong> External systems can call this webhook URL to trigger the workflow with custom data.
                    </p>
                </div>

                {/* Webhook URL Display */}
                <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Your Webhook URL
                    </label>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-xs sm:text-sm text-gray-800 overflow-x-auto">
                            {webhookUrl}
                        </code>
                        <button
                            onClick={handleCopyUrl}
                            className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                            title="Copy URL"
                        >
                            {copied ? (
                                <>
                                    <Check size={16} />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy size={16} />
                                    Copy
                                </>
                            )}
                        </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-600">
                        Use this URL in external systems to trigger your workflow
                    </p>
                </div>

                {/* HTTP Method */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        HTTP Method *
                    </label>
                    <select
                        value={config.method}
                        onChange={(e) => updateConfig('method', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                        The HTTP method that will be accepted by this webhook
                    </p>
                </div>

                {/* Webhook Path */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Webhook Path *
                    </label>
                    <input
                        type="text"
                        value={config.path}
                        onChange={(e) => updateConfig('path', e.target.value)}
                        placeholder="/my-webhook"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.path ? 'border-red-500' : 'border-gray-300'
                            }`}
                    />
                    {errors.path && (
                        <p className="mt-1 text-sm text-red-600">{errors.path}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                        Custom path for your webhook (must start with /)
                    </p>
                </div>

                {/* Authentication */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Authentication</h3>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Authentication Type
                        </label>
                        <select
                            value={config.authentication}
                            onChange={(e) => updateConfig('authentication', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                            <option value="none">None (Public)</option>
                            <option value="basic">Basic Auth</option>
                            <option value="apikey">API Key</option>
                        </select>
                    </div>

                    {config.authentication === 'basic' && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Username *
                                </label>
                                <input
                                    type="text"
                                    value={config.username}
                                    onChange={(e) => updateConfig('username', e.target.value)}
                                    placeholder="admin"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Password *
                                </label>
                                <input
                                    type="password"
                                    value={config.password}
                                    onChange={(e) => updateConfig('password', e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {config.authentication === 'apikey' && (
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                API Key *
                            </label>
                            <input
                                type="password"
                                value={config.apiKey}
                                onChange={(e) => updateConfig('apiKey', e.target.value)}
                                placeholder="your-api-key-here"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Include this in the <code className="bg-white px-1 rounded">X-API-Key</code> header
                            </p>
                        </div>
                    )}

                    {config.authentication === 'none' && (
                        <div className="bg-amber-50 border border-amber-200 rounded p-2">
                            <p className="text-xs text-amber-800">
                                ⚠️ Warning: This webhook will be publicly accessible without authentication
                            </p>
                        </div>
                    )}
                </div>

                {/* Response Mode */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Response Configuration</h3>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Response Mode
                        </label>
                        <select
                            value={config.responseMode}
                            onChange={(e) => updateConfig('responseMode', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                            <option value="lastNode">Last Node Output</option>
                            <option value="firstSucceeding">First Succeeding Node</option>
                            <option value="custom">Custom Response</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            What data to return in the HTTP response
                        </p>
                    </div>

                    {config.responseMode === 'custom' && (
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Custom Response (JSON)
                            </label>
                            <textarea
                                value={config.customResponse}
                                onChange={(e) => updateConfig('customResponse', e.target.value)}
                                placeholder='{"status": "success", "message": "Workflow triggered"}'
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                            />
                        </div>
                    )}
                </div>

                {/* Example Request */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Example Request</h3>
                    <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
                        {`curl -X ${config.method} "${webhookUrl}" \\
  -H "Content-Type: application/json" \\${config.authentication === 'apikey' ? `\n  -H "X-API-Key: ${config.apiKey || 'your-api-key'}" \\` : ''}${config.authentication === 'basic' ? `\n  -u "${config.username || 'username'}:${config.password || 'password'}" \\` : ''}
  -d '{"key": "value"}'`}
                    </pre>
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
