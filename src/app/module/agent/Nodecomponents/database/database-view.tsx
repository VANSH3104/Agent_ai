'use client';

import { useState, useEffect } from 'react';
import { useTRPC } from '@/trpc/client';
import { useQuery, useMutation } from '@tanstack/react-query';


interface FilterCondition {
    field: string;
    operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'startsWith' | 'endsWith';
    value: string;
}

interface DatabaseConfig {
    operation: 'select' | 'insert' | 'update' | 'delete' | 'raw';
    table?: string;
    query?: string;
    enableFilter?: boolean;
    filterConditions?: FilterCondition[];
    filterCombineOp?: 'AND' | 'OR';
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
    initialData?: Partial<DatabaseConfig>;
    onSave?: (config: DatabaseConfig & { credentials?: DatabaseCredentials }) => void;
    nodeData?: any;
}

interface ValidationErrors {
    operation?: string;
    table?: string;
    query?: string;
    connectionUrl?: string;
    host?: string;
    database?: string;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({ initialData = {}, onSave }) => {
    const trpc = useTRPC();

    const [dbConfig, setDbConfig] = useState<DatabaseConfig>({
        operation: initialData.operation || 'select',
        table: initialData.table || '',
        query: initialData.query || '',
        enableFilter: initialData.enableFilter || false,
        filterConditions: initialData.filterConditions || [{ field: '', operator: 'equals', value: '' }],
        filterCombineOp: initialData.filterCombineOp || 'AND',
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

    const [errors, setErrors] = useState<ValidationErrors>({});
    const [showCredentials, setShowCredentials] = useState(false);
    const [credentialsSaved, setCredentialsSaved] = useState(false);
    const [useConnectionUrl, setUseConnectionUrl] = useState(true);

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

            // Auto-detect connection mode
            if (creds.connectionUrl) {
                setUseConnectionUrl(true);
            } else if (creds.host) {
                setUseConnectionUrl(false);
            }
        }
    }, [existingCredentials]);

    // Update config from initialData
    useEffect(() => {
        setDbConfig({
            operation: initialData.operation || 'select',
            table: initialData.table || '',
            query: initialData.query || '',
            enableFilter: initialData.enableFilter || false,
            filterConditions: initialData.filterConditions || [{ field: '', operator: 'equals', value: '' }],
            filterCombineOp: initialData.filterCombineOp || 'AND',
        });
    }, [initialData]);


    const updateDbConfig = (field: keyof DatabaseConfig, value: any) => {
        setDbConfig(prev => ({ ...prev, [field]: value }));
        if (errors[field as keyof ValidationErrors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const updateCredentials = (field: keyof DatabaseCredentials, value: any) => {
        setDbCredentials(prev => ({ ...prev, [field]: value }));
        if (errors[field as keyof ValidationErrors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const validateCredentials = (): boolean => {
        const newErrors: ValidationErrors = {};

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
        if (onSave) {
            onSave({
                ...dbConfig,
                credentials: dbCredentials
            });
        }
    };

    const connectionTypes = [
        { value: 'postgres', label: 'PostgreSQL', defaultPort: 5432 },
        { value: 'mysql', label: 'MySQL', defaultPort: 3306 },
        { value: 'mongodb', label: 'MongoDB', defaultPort: 27017 },
        { value: 'sqlite', label: 'SQLite', defaultPort: 0 },
    ];

    const currentConnectionType = connectionTypes.find(ct => ct.value === dbCredentials.connectionType) || connectionTypes[0];

    const filterOperators = [
        { label: 'Equals', value: 'equals' },
        { label: 'Not Equals', value: 'notEquals' },
        { label: 'Greater Than', value: 'greaterThan' },
        { label: 'Less Than', value: 'lessThan' },
        { label: 'Contains', value: 'contains' },
        { label: 'Starts With', value: 'startsWith' },
        { label: 'Ends With', value: 'endsWith' },
    ];

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
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Database Configuration</h1>
                <p className="text-xs sm:text-sm text-gray-600">Configure database connection and queries</p>
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

                            <div className="flex items-center justify-between mb-2">
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
                                        <span className="text-xs text-gray-500 font-normal ml-1">(supports env variables)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={dbCredentials.connectionUrl}
                                        onChange={(e) => updateCredentials('connectionUrl', e.target.value)}
                                        placeholder="postgres://user:pass@host:5432/dbname or ${DATABASE_URL}"
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.connectionUrl ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {errors.connectionUrl && (
                                        <p className="mt-1 text-sm text-red-600">{errors.connectionUrl}</p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">
                                        💡 Use ${'{'}VARIABLE_NAME{'}'} to reference environment variables
                                    </p>
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
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.host ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                            />
                                            {errors.host && (
                                                <p className="mt-1 text-sm text-red-600">{errors.host}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Port
                                            </label>
                                            <input
                                                type="number"
                                                value={dbCredentials.port}
                                                onChange={(e) => updateCredentials('port', parseInt(e.target.value))}
                                                placeholder={currentConnectionType.defaultPort.toString()}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Database Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={dbCredentials.database}
                                            onChange={(e) => updateCredentials('database', e.target.value)}
                                            placeholder="mydb"
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.database ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        />
                                        {errors.database && (
                                            <p className="mt-1 text-sm text-red-600">{errors.database}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Username
                                            </label>
                                            <input
                                                type="text"
                                                value={dbCredentials.username}
                                                onChange={(e) => updateCredentials('username', e.target.value)}
                                                placeholder="username"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Password
                                            </label>
                                            <input
                                                type="password"
                                                value={dbCredentials.password}
                                                onChange={(e) => updateCredentials('password', e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="ssl"
                                            checked={dbCredentials.ssl}
                                            onChange={(e) => updateCredentials('ssl', e.target.checked)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor="ssl" className="text-sm text-gray-700">
                                            Use SSL/TLS
                                        </label>
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

                {/* Query Configuration */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Query Configuration</h2>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                            💡 <strong>Query Parameters:</strong> Input data from the previous node will be available for parameterized queries.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Operation *
                        </label>
                        <select
                            value={dbConfig.operation}
                            onChange={(e) => updateDbConfig('operation', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                            <option value="select">Select</option>
                            <option value="insert">Insert</option>
                            <option value="update">Update</option>
                            <option value="delete">Delete</option>
                            <option value="raw">Raw Query</option>
                        </select>
                    </div>

                    {dbConfig.operation !== 'raw' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Table Name
                            </label>
                            <input
                                type="text"
                                value={dbConfig.table}
                                onChange={(e) => updateDbConfig('table', e.target.value)}
                                placeholder="users"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {dbConfig.operation === 'raw' ? 'SQL Query' : 'Custom Query (Optional)'}
                        </label>
                        <textarea
                            value={dbConfig.query}
                            onChange={(e) => updateDbConfig('query', e.target.value)}
                            placeholder={
                                dbConfig.operation === 'raw'
                                    ? 'SELECT * FROM users WHERE id = $1'
                                    : 'WHERE age > $1 ORDER BY name'
                            }
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-y font-mono"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Use $1, $2, etc. for parameterized queries
                        </p>
                    </div>

                    {/* Filter Configuration */}
                    <div className="border-t pt-4">
                        <div className="flex items-center gap-2 mb-3">
                            <input
                                type="checkbox"
                                id="enableFilter"
                                checked={dbConfig.enableFilter}
                                onChange={(e) => updateDbConfig('enableFilter', e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="enableFilter" className="text-sm font-medium text-gray-700">
                                Enable Post-Query Filter
                            </label>
                        </div>

                        {dbConfig.enableFilter && (
                            <div className="ml-6 space-y-3 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center just ify-between">
                                    <p className="text-xs text-gray-600">
                                        Filter results after query execution
                                    </p>
                                    <button
                                        onClick={() => {
                                            const conditions = dbConfig.filterConditions || [];
                                            setDbConfig(prev => ({
                                                ...prev,
                                                filterConditions: [...conditions, { field: '', operator: 'equals', value: '' }]
                                            }));
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 border border-blue-300 rounded"
                                    >
                                        + Add Condition
                                    </button>
                                </div>

                                {(dbConfig.filterConditions || []).length > 1 && (
                                    <div>
                                        <select
                                            value={dbConfig.filterCombineOp || 'AND'}
                                            onChange={(e) => updateDbConfig('filterCombineOp', e.target.value as ' AND' | 'OR')}
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                                        >
                                            <option value="AND">AND (all must match)</option>
                                            <option value="OR">OR (any must match)</option>
                                        </select>
                                    </div>
                                )}

                                {(dbConfig.filterConditions || []).map((condition, index) => (
                                    <div key={index} className="relative border border-gray-200 rounded p-2 bg-white">
                                        {(dbConfig.filterConditions || []).length > 1 && (
                                            <button
                                                onClick={() => {
                                                    const conditions = dbConfig.filterConditions || [];
                                                    setDbConfig(prev => ({
                                                        ...prev,
                                                        filterConditions: conditions.filter((_, i) => i !== index)
                                                    }));
                                                }}
                                                className="absolute top-1 right-1 text-red-600 hover:bg-red-100 rounded p-0.5 text-xs"
                                                title="Remove"
                                            >
                                                ✕
                                            </button>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Field
                                                </label>
                                                <input
                                                    type="text"
                                                    value={condition.field}
                                                    onChange={(e) => {
                                                        const conditions = dbConfig.filterConditions || [];
                                                        setDbConfig(prev => ({
                                                            ...prev,
                                                            filterConditions: conditions.map((c, i) =>
                                                                i === index ? { ...c, field: e.target.value } : c
                                                            )
                                                        }));
                                                    }}
                                                    placeholder="age"
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Operator
                                                </label>
                                                <select
                                                    value={condition.operator}
                                                    onChange={(e) => {
                                                        const conditions = dbConfig.filterConditions || [];
                                                        setDbConfig(prev => ({
                                                            ...prev,
                                                            filterConditions: conditions.map((c, i) =>
                                                                i === index ? { ...c, operator: e.target.value as any } : c
                                                            )
                                                        }));
                                                    }}
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                                >
                                                    {filterOperators.map(op => (
                                                        <option key={op.value} value={op.value}>{op.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Value
                                                </label>
                                                <input
                                                    type="text"
                                                    value={condition.value}
                                                    onChange={(e) => {
                                                        const conditions = dbConfig.filterConditions || [];
                                                        setDbConfig(prev => ({
                                                            ...prev,
                                                            filterConditions: conditions.map((c, i) =>
                                                                i === index ? { ...c, value: e.target.value } : c
                                                            )
                                                        }));
                                                    }}
                                                    placeholder="25"
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                                />
                                            </div>
                                        </div>

                                        {index < (dbConfig.filterConditions || []).length - 1 && (
                                            <div className="mt-1 text-center">
                                                <span className="inline-block px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-medium rounded">
                                                    {dbConfig.filterCombineOp || 'AND'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
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
