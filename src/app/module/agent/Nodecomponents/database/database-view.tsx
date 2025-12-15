'use client';

import { useState, useEffect } from 'react';
import { useTRPC } from '@/trpc/client';
import { useQuery, useMutation } from '@tanstack/react-query';

interface SimpleDatabaseConfig {
    operation: 'insert' | 'raw'; //insert uses the simple UI, raw allows custom SQL
    multipleQueries?: boolean; // Enable multiple inserts
    queries?: Array<{
        tableName: string;
        columnName: string;
        insertMode?: 'fullJson' | 'specificField';
        fieldToExtract?: string;
    }>;
    insertMode?: 'fullJson' | 'specificField';
    tableName?: string;
    columnName?: string;
    fieldToExtract?: string;
    rawSql?: string; // For raw SQL mode
}

interface DatabaseCredentials {
    connectionType: 'postgres' | 'mysql' | 'mongodb' | 'sqlite';
    connectionUrl?: string;
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    ssl?: boolean;
}

interface DatabaseViewProps {
    initialData?: Partial<SimpleDatabaseConfig>;
    onSave?: (config: SimpleDatabaseConfig & { credentials?: DatabaseCredentials }) => void;
    nodeData?: any;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({ initialData = {}, onSave, nodeData }) => {
    const trpc = useTRPC();

    const [config, setConfig] = useState<SimpleDatabaseConfig>({
        operation: initialData.operation || 'insert',
        insertMode: initialData.insertMode || 'fullJson',
        tableName: initialData.tableName || '',
        columnName: initialData.columnName || 'data',
        fieldToExtract: initialData.fieldToExtract || '',
        rawSql: initialData.rawSql || '',
        multipleQueries: initialData.multipleQueries || false,
        queries: initialData.queries || [],
    });

    const [dbCredentials, setDbCredentials] = useState<DatabaseCredentials>({
        connectionType: 'postgres',
        connectionUrl: '',
        host: '',
        port: 5432,
        database: '',
        username: '',
        password: '',
        ssl: false,
    });

    const [showCredentials, setShowCredentials] = useState(false);
    const [credentialsSaved, setCredentialsSaved] = useState(false);
    const [useConnectionUrl, setUseConnectionUrl] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Sample input for preview
    const sampleInput = { test: "data", message: "from webhook" };

    // Fetch existing credentials
    const { data: existingCredentials, isLoading } = useQuery(
        trpc.credentials.getDatabaseCredentials.queryOptions()
    );

    const saveCredentialsMutation = useMutation(
        trpc.credentials.saveDatabaseCredentials.mutationOptions()
    );

    // Load credentials when available
    useEffect(() => {
        if (existingCredentials?.data) {
            const creds = existingCredentials.data;
            setDbCredentials({
                connectionType: creds.connectionType || 'postgres',
                connectionUrl: creds.connectionUrl || '',
                host: creds.host || '',
                port: creds.port || 5432,
                database: creds.database || '',
                username: creds.username || '',
                password: creds.password || '',
                ssl: creds.ssl || false,
            });
            setCredentialsSaved(true);

            if (creds.connectionUrl) {
                setUseConnectionUrl(true);
            } else if (creds.host) {
                setUseConnectionUrl(false);
            }
        }
    }, [existingCredentials]);

    // Update config from initialData
    useEffect(() => {
        setConfig({
            operation: initialData.operation || 'insert',
            insertMode: initialData.insertMode || 'fullJson',
            tableName: initialData.tableName || '',
            columnName: initialData.columnName || 'data',
            fieldToExtract: initialData.fieldToExtract || '',
            rawSql: initialData.rawSql || '',
            multipleQueries: initialData.multipleQueries || false,
            queries: initialData.queries || [],
        });
    }, [initialData]);

    const updateConfig = (field: keyof SimpleDatabaseConfig, value: any) => {
        setConfig(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const updateCredentials = (field: keyof DatabaseCredentials, value: any) => {
        setDbCredentials(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateCredentials = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (useConnectionUrl) {
            if (!dbCredentials.connectionUrl?.trim()) {
                newErrors.connectionUrl = 'Connection URL is required';
            }
        } else {
            if (!dbCredentials.host?.trim()) {
                newErrors.host = 'Host is required';
            }
            if (!dbCredentials.database?.trim()) {
                newErrors.database = 'Database name is required';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveCredentials = async () => {
        if (!validateCredentials()) {
            return;
        }

        try {
            await saveCredentialsMutation.mutateAsync(dbCredentials);
            setCredentialsSaved(true);
            setShowCredentials(false);
            alert('Database credentials saved successfully!');
        } catch (error) {
            alert('Failed to save credentials. Please try again.');
        }
    };

    const handleSave = () => {
        console.log('🔵 DatabaseView - Saving config:', config);
        if (onSave) {
            onSave({
                ...config,
                credentials: dbCredentials
            });
        }
    };

    // Generate preview query
    const getPreviewQuery = () => {
        if (!config.tableName) return null;

        let value;
        if (config.insertMode === 'fullJson') {
            value = JSON.stringify(sampleInput);
        } else {
            value = sampleInput[config.fieldToExtract as keyof typeof sampleInput] || '<field_value>';
        }

        return `INSERT INTO ${config.tableName} ("${config.columnName}") VALUES ('${value}') RETURNING *`;
    };

    const connectionTypes = [
        { value: 'postgres', label: 'PostgreSQL', defaultPort: 5432 },
        { value: 'mysql', label: 'MySQL', defaultPort: 3306 },
        { value: 'mongodb', label: 'MongoDB', defaultPort: 27017 },
        { value: 'sqlite', label: 'SQLite', defaultPort: 0 },
    ];

    const currentConnectionType = connectionTypes.find(ct => ct.value === dbCredentials.connectionType) || connectionTypes[0];

    if (isLoading) {
        return (
            <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-white">
                <div className="text-center py-8">Loading credentials...</div>
            </div>
        );
    }

    const previewQuery = getPreviewQuery();

    return (
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-white">
            <div className="mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Database Insert Configuration</h1>
                <p className="text-xs sm:text-sm text-gray-600">Simple configuration for inserting webhook/input data</p>
            </div>

            <div className="space-y-6">
                {/* Database Credentials Section */}
                <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Database Credentials
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
                                    Connection Type *
                                </label>
                                <select
                                    value={dbCredentials.connectionType}
                                    onChange={(e) => {
                                        const newType = e.target.value as any;
                                        const connType = connectionTypes.find(ct => ct.value === newType);
                                        updateCredentials('connectionType', newType);
                                        if (connType && !useConnectionUrl) {
                                            updateCredentials('port', connType.defaultPort);
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                >
                                    {connectionTypes.map(ct => (
                                        <option key={ct.value} value={ct.value}>{ct.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center just ify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Connection Method
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setUseConnectionUrl(!useConnectionUrl)}
                                    className="text-xs text-blue-600 hover:text-blue-700"
                                >
                                    {useConnectionUrl ? 'Use Individual Parameters' : 'Use Connection URL'}
                                </button>
                            </div>

                            {useConnectionUrl ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Connection URL *
                                    </label>
                                    <input
                                        type="text"
                                        value={dbCredentials.connectionUrl}
                                        onChange={(e) => updateCredentials('connectionUrl', e.target.value)}
                                        placeholder="postgresql://user:pass@host:5432/dbname"
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.connectionUrl ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {errors.connectionUrl && (
                                        <p className="mt-1 text-sm text-red-600">{errors.connectionUrl}</p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Host *
                                            </label>
                                            <input
                                                type="text"
                                                value={dbCredentials.host}
                                                onChange={(e) => updateCredentials('host', e.target.value)}
                                                placeholder="localhost"
                                                className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.host ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                            />
                                            {errors.host && <p className="mt-1 text-sm text-red-600">{errors.host}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Port</label>
                                            <input
                                                type="number"
                                                value={dbCredentials.port}
                                                onChange={(e) => updateCredentials('port', parseInt(e.target.value))}
                                                placeholder={currentConnectionType.defaultPort.toString()}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Database Name *</label>
                                        <input
                                            type="text"
                                            value={dbCredentials.database}
                                            onChange={(e) => updateCredentials('database', e.target.value)}
                                            placeholder="mydb"
                                            className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.database ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        />
                                        {errors.database && <p className="mt-1 text-sm text-red-600">{errors.database}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                                            <input
                                                type="text"
                                                value={dbCredentials.username}
                                                onChange={(e) => updateCredentials('username', e.target.value)}
                                                placeholder="username"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                            <input
                                                type="password"
                                                value={dbCredentials.password}
                                                onChange={(e) => updateCredentials('password', e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="ssl"
                                            checked={dbCredentials.ssl}
                                            onChange={(e) => updateCredentials('ssl', e.target.checked)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                                        />
                                        <label htmlFor="ssl" className="text-sm text-gray-700">Use SSL/TLS</label>
                                    </div>
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    onClick={handleSaveCredentials}
                                    disabled={saveCredentialsMutation.isPending}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                                >
                                    {saveCredentialsMutation.isPending ? 'Saving...' : 'Save Database Credentials'}
                                </button>
                            </div>
                        </div>
                    )}

                    {!showCredentials && credentialsSaved && (
                        <p className="text-sm text-gray-600">
                            Configured: <span className="font-medium">{currentConnectionType.label}</span>
                            {dbCredentials.connectionUrl && ' (Connection URL)'}
                            {!dbCredentials.connectionUrl && dbCredentials.database && ` - ${dbCredentials.database}`}
                        </p>
                    )}

                    {!showCredentials && !credentialsSaved && (
                        <p className="text-sm text-amber-600">
                            ⚠ Database credentials not configured. Please add credentials to use database.
                        </p>
                    )}
                </div>

                {/* Insert Configuration */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Insert Configuration</h2>

                    {/* Operation Mode Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Operation Mode *</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => updateConfig('operation', 'insert')}
                                className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${config.operation === 'insert'
                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 hover:border-gray-400 text-gray-700'
                                    }`}
                            >
                                📝 Simple Insert
                            </button>
                            <button
                                type="button"
                                onClick={() => updateConfig('operation', 'raw')}
                                className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${config.operation === 'raw'
                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 hover:border-gray-400 text-gray-700'
                                    }`}
                            >
                                ⚡ Raw SQL
                            </button>
                        </div>
                    </div>

                    {config.operation === 'insert' ? (
                        /* Insert Mode UI */
                        <>
                            {/* Multiple Inserts Toggle */}
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="multipleInserts"
                                    checked={config.multipleQueries || false}
                                    onChange={(e) => {
                                        updateConfig('multipleQueries', e.target.checked);
                                        if (e.target.checked && (!config.queries || config.queries.length === 0)) {
                                            // Initialize with current single config
                                            updateConfig('queries', [{
                                                tableName: config.tableName || '',
                                                columnName: config.columnName || 'data',
                                                insertMode: config.insertMode || 'fullJson',
                                                fieldToExtract: config.fieldToExtract || ''
                                            }]);
                                        }
                                    }}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <label htmlFor="multipleInserts" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    Insert multiple columns in one row
                                </label>
                            </div>

                            {config.multipleQueries ? (
                                /* Multiple Inserts Mode */
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-600">Add columns to insert in a single row</p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newQueries = [...(config.queries || []), {
                                                    tableName: '',
                                                    columnName: 'data',
                                                    insertMode: 'fullJson' as const,
                                                    fieldToExtract: ''
                                                }];
                                                updateConfig('queries', newQueries);
                                            }}
                                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                        >
                                            + Add Column
                                        </button>
                                    </div>

                                    {(config.queries || []).map((query, index) => (
                                        <div key={index} className="border rounded-lg p-3 bg-white space-y-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-sm">Column #{index + 1}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newQueries = (config.queries || []).filter((_, i) => i !== index);
                                                        updateConfig('queries', newQueries);
                                                    }}
                                                    className="text-red-600 hover:text-red-700 text-sm"
                                                >
                                                    ✕ Remove
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Table Name *</label>
                                                    <input
                                                        type="text"
                                                        value={query.tableName}
                                                        onChange={(e) => {
                                                            const newQueries = [...(config.queries || [])];
                                                            newQueries[index].tableName = e.target.value;
                                                            updateConfig('queries', newQueries);
                                                        }}
                                                        placeholder="data"
                                                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Column Name *</label>
                                                    <input
                                                        type="text"
                                                        value={query.columnName}
                                                        onChange={(e) => {
                                                            const newQueries = [...(config.queries || [])];
                                                            newQueries[index].columnName = e.target.value;
                                                            updateConfig('queries', newQueries);
                                                        }}
                                                        placeholder="data"
                                                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Insert Mode *</label>
                                                <select
                                                    value={query.insertMode || 'fullJson'}
                                                    onChange={(e) => {
                                                        const newQueries = [...(config.queries || [])];
                                                        newQueries[index].insertMode = e.target.value as 'fullJson' | 'specificField';
                                                        updateConfig('queries', newQueries);
                                                    }}
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                                >
                                                    <option value="fullJson">Full JSON</option>
                                                    <option value="specificField">Specific Field</option>
                                                </select>
                                            </div>

                                            {query.insertMode === 'specificField' && (
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Field to Extract *</label>
                                                    <input
                                                        type="text"
                                                        value={query.fieldToExtract || ''}
                                                        onChange={(e) => {
                                                            const newQueries = [...(config.queries || [])];
                                                            newQueries[index].fieldToExtract = e.target.value;
                                                            updateConfig('queries', newQueries);
                                                        }}
                                                        placeholder="message"
                                                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Combined Multi-Column Query Preview */}
                                    {config.queries && config.queries.length > 0 && config.queries[0]?.tableName && (
                                        <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-semibold text-gray-400 uppercase">Combined Query Preview</span>
                                                <span className="text-xs text-green-400">Auto-generated</span>
                                            </div>
                                            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-words">
                                                {(() => {
                                                    const tableName = config.queries[0].tableName;
                                                    const columns = config.queries
                                                        .map(q => `"${q.columnName || 'data'}"`)
                                                        .join(', ');
                                                    const values = config.queries
                                                        .map(q => {
                                                            const val = q.insertMode === 'fullJson'
                                                                ? JSON.stringify(sampleInput)
                                                                : sampleInput[q.fieldToExtract as keyof typeof sampleInput] || '<field_value>';
                                                            return `'${val}'`;
                                                        })
                                                        .join(', ');
                                                    return `INSERT INTO ${tableName} (${columns}) VALUES (${values}) RETURNING *`;
                                                })()}
                                            </pre>
                                            <div className="mt-3 pt-3 border-t border-gray-700">
                                                <p className="text-xs text-gray-400 mb-2">Sample Input:</p>
                                                <pre className="text-xs text-blue-300 font-mono">
                                                    {JSON.stringify(sampleInput, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Single Insert Mode */
                                <>

                                    {/* Insert Mode */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">Insert Mode *</label>
                                        <div className="space-y-2">
                                            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                                <input
                                                    type="radio"
                                                    name="insertMode"
                                                    value="fullJson"
                                                    checked={config.insertMode === 'fullJson'}
                                                    onChange={(e) => updateConfig('insertMode', e.target.value)}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-gray-900">Insert Full JSON</div>
                                                    <div className="text-xs text-gray-500">
                                                        Inserts entire input as JSON string: <code className="bg-gray-100 px-1">{'{"test":"data","message":"from webhook"}'}</code>
                                                    </div>
                                                </div>
                                            </label>

                                            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                                <input
                                                    type="radio"
                                                    name="insertMode"
                                                    value="specificField"
                                                    checked={config.insertMode === 'specificField'}
                                                    onChange={(e) => updateConfig('insertMode', e.target.value)}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-gray-900">Insert Specific Field</div>
                                                    <div className="text-xs text-gray- 500">
                                                        Extracts one field only: <code className="bg-gray-100 px-1">message</code> → <code className="bg-gray-100 px-1">"from webhook"</code>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Table Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Table Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={config.tableName}
                                            onChange={(e) => updateConfig('tableName', e.target.value)}
                                            placeholder="data"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                        />
                                    </div>

                                    {/* Column Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Column Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={config.columnName}
                                            onChange={(e) => updateConfig('columnName', e.target.value)}
                                            placeholder="data"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                        />
                                    </div>

                                    {/* Field to Extract (only for specificField mode) */}
                                    {config.insertMode === 'specificField' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Field to Extract *
                                            </label>
                                            <input
                                                type="text"
                                                value={config.fieldToExtract}
                                                onChange={(e) => updateConfig('fieldToExtract', e.target.value)}
                                                placeholder="message"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                Field name from input object (e.g., "message", "test", "data")
                                            </p>
                                        </div>
                                    )}

                                    {/* Query Preview */}
                                    {previewQuery && (
                                        <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-semibold text-gray-400 uppercase">Generated Query Preview</span>
                                                <span className="text-xs text-green-400">Auto-generated</span>
                                            </div>
                                            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-words">
                                                {previewQuery}
                                            </pre>
                                            <div className="mt-3 pt-3 border-t border-gray-700">
                                                <p className="text-xs text-gray-400 mb-2">Sample Input:</p>
                                                <pre className="text-xs text-blue-300 font-mono">
                                                    {JSON.stringify(sampleInput, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    ) : (
                        /* Raw SQL Mode UI */
                        <div className="space-y-4">
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                    ⚡ <strong>Raw SQL Mode:</strong> Write any custom SQL. Separate multiple queries with semicolons (;)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    SQL Query *
                                </label>
                                <textarea
                                    value={config.rawSql}
                                    onChange={(e) => updateConfig('rawSql', e.target.value)}
                                    placeholder={`INSERT INTO table1 (data) VALUES ('{{input}}');
INSERT INTO table2 (message) VALUES ('{{input.message}}');
-- Use {{input}} for full JSON or {{input.fieldName}} for specific fields`}
                                    rows={10}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-y font-mono"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    💡 Use <code className="bg-gray-100 px-1">{`{{input}}`}</code> for full JSON or <code className="bg-gray-100 px-1">{`{{input.fieldName}}`}</code> for specific fields
                                </p>
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
