import { useState } from 'react';
import { X, Plus, ChevronDown } from 'lucide-react';

interface KeyValuePair {
  key: string;
  value: string;
}

interface BodyConfig {
  type: 'json' | 'form' | 'raw' | 'none';
  content: string;
}

interface AuthConfig {
  username?: string;
  password?: string;
  token?: string;
  location?: 'header' | 'query';
  keyName?: string;
  keyValue?: string;
}

interface HttpConfig {
  method: string;
  url: string;
  authentication: 'none' | 'basic' | 'bearer' | 'apiKey';
  authConfig: AuthConfig;
  headers: KeyValuePair[];
  queryParams: KeyValuePair[];
  body: BodyConfig;
  timeout: number;
  followRedirects: boolean;
}

interface HttpViewProps {
  initialData?: Partial<HttpConfig>;
  onSave?: (config: HttpConfig) => void;
}

export const HttpView: React.FC<HttpViewProps> = ({ initialData = {}, onSave }) => {
  const [httpConfig, setHttpConfig] = useState<HttpConfig>({
    method: initialData.method || 'GET',
    url: initialData.url || '',
    authentication: initialData.authentication || 'none',
    authConfig: initialData.authConfig || {},
    headers: initialData.headers || [],
    queryParams: initialData.queryParams || [],
    body: initialData.body || {
      type: 'json',
      content: ''
    },
    timeout: initialData.timeout || 30000,
    followRedirects: initialData.followRedirects !== false,
  });

  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
  const authTypes = [
    { value: 'none', label: 'None' },
    { value: 'basic', label: 'Basic Auth' },
    { value: 'bearer', label: 'Bearer Token' },
    { value: 'apiKey', label: 'API Key' }
  ] as const;
  const bodyTypes = [
    { value: 'json', label: 'JSON' },
    { value: 'form', label: 'Form Data' },
    { value: 'raw', label: 'Raw' },
    { value: 'none', label: 'None' }
  ] as const;

  const updateConfig = <K extends keyof HttpConfig>(field: K, value: HttpConfig[K]) => {
    setHttpConfig(prev => ({ ...prev, [field]: value }));
  };

  const addHeader = () => {
    setHttpConfig(prev => ({
      ...prev,
      headers: [...prev.headers, { key: '', value: '' }]
    }));
  };

  const updateHeader = (index: number, field: keyof KeyValuePair, value: string) => {
    const newHeaders = [...httpConfig.headers];
    newHeaders[index][field] = value;
    updateConfig('headers', newHeaders);
  };

  const removeHeader = (index: number) => {
    const newHeaders = httpConfig.headers.filter((_, i) => i !== index);
    updateConfig('headers', newHeaders);
  };

  const addQueryParam = () => {
    setHttpConfig(prev => ({
      ...prev,
      queryParams: [...prev.queryParams, { key: '', value: '' }]
    }));
  };

  const updateQueryParam = (index: number, field: keyof KeyValuePair, value: string) => {
    const newParams = [...httpConfig.queryParams];
    newParams[index][field] = value;
    updateConfig('queryParams', newParams);
  };

  const removeQueryParam = (index: number) => {
    const newParams = httpConfig.queryParams.filter((_, i) => i !== index);
    updateConfig('queryParams', newParams);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(httpConfig);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-white">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">HTTP Request</h1>
        <p className="text-xs sm:text-sm text-gray-600">Configure HTTP request to external APIs</p>
      </div>

      {/* Method and URL */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Request Method
          </label>
          <select
            value={httpConfig.method}
            onChange={(e) => updateConfig('method', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          >
            {httpMethods.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL *
          </label>
          <input
            type="text"
            value={httpConfig.url}
            onChange={(e) => updateConfig('url', e.target.value)}
            placeholder="https://api.example.com/endpoint"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Authentication */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Authentication
        </label>
        <select
          value={httpConfig.authentication}
          onChange={(e) => updateConfig('authentication', e.target.value as HttpConfig['authentication'])}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3 text-sm sm:text-base"
        >
          {authTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>

        {httpConfig.authentication === 'basic' && (
          <div className="space-y-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <input
              type="text"
              placeholder="Username"
              value={httpConfig.authConfig.username || ''}
              onChange={(e) => updateConfig('authConfig', { ...httpConfig.authConfig, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base"
            />
            <input
              type="password"
              placeholder="Password"
              value={httpConfig.authConfig.password || ''}
              onChange={(e) => updateConfig('authConfig', { ...httpConfig.authConfig, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base"
            />
          </div>
        )}

        {httpConfig.authentication === 'bearer' && (
          <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
            <input
              type="password"
              placeholder="Bearer Token"
              value={httpConfig.authConfig.token || ''}
              onChange={(e) => updateConfig('authConfig', { ...httpConfig.authConfig, token: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base"
            />
          </div>
        )}

        {httpConfig.authentication === 'apiKey' && (
          <div className="space-y-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <select
              value={httpConfig.authConfig.location || 'header'}
              onChange={(e) => updateConfig('authConfig', { ...httpConfig.authConfig, location: e.target.value as 'header' | 'query' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base"
            >
              <option value="header">Header</option>
              <option value="query">Query Parameter</option>
            </select>
            <input
              type="text"
              placeholder="Key Name"
              value={httpConfig.authConfig.keyName || ''}
              onChange={(e) => updateConfig('authConfig', { ...httpConfig.authConfig, keyName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base"
            />
            <input
              type="password"
              placeholder="API Key Value"
              value={httpConfig.authConfig.keyValue || ''}
              onChange={(e) => updateConfig('authConfig', { ...httpConfig.authConfig, keyValue: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base"
            />
          </div>
        )}
      </div>

      {/* Query Parameters */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Query Parameters
          </label>
          <button
            onClick={addQueryParam}
            className="flex items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-700 w-full sm:w-auto"
          >
            <Plus size={16} />
            Add Parameter
          </button>
        </div>
        <div className="space-y-2">
          {httpConfig.queryParams.map((param, index) => (
            <div key={index} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Key"
                value={param.key}
                onChange={(e) => updateQueryParam(index, 'key', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base"
              />
              <input
                type="text"
                placeholder="Value"
                value={param.value}
                onChange={(e) => updateQueryParam(index, 'value', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base"
              />
              <button
                onClick={() => removeQueryParam(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg self-center sm:self-auto"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Headers */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Headers
          </label>
          <button
            onClick={addHeader}
            className="flex items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-700 w-full sm:w-auto"
          >
            <Plus size={16} />
            Add Header
          </button>
        </div>
        <div className="space-y-2">
          {httpConfig.headers.map((header, index) => (
            <div key={index} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Header Name"
                value={header.key}
                onChange={(e) => updateHeader(index, 'key', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base"
              />
              <input
                type="text"
                placeholder="Value"
                value={header.value}
                onChange={(e) => updateHeader(index, 'value', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base"
              />
              <button
                onClick={() => removeHeader(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg self-center sm:self-auto"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Body (for POST, PUT, PATCH) */}
      {['POST', 'PUT', 'PATCH'].includes(httpConfig.method) && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Request Body
          </label>
          <select
            value={httpConfig.body.type}
            onChange={(e) => updateConfig('body', { ...httpConfig.body, type: e.target.value as BodyConfig['type'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm sm:text-base"
          >
            {bodyTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

          {httpConfig.body.type !== 'none' && (
            <textarea
              value={httpConfig.body.content}
              onChange={(e) => updateConfig('body', { ...httpConfig.body, content: e.target.value })}
              placeholder={httpConfig.body.type === 'json' ? '{\n  "key": "value"\n}' : 'Request body content'}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs sm:text-sm"
            />
          )}
        </div>
      )}

      {/* Advanced Options */}
      <div className="mb-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 w-full sm:w-auto"
        >
          <ChevronDown 
            size={16} 
            className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
          />
          Advanced Options
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeout (ms)
              </label>
              <input
                type="number"
                value={httpConfig.timeout}
                onChange={(e) => updateConfig('timeout', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="followRedirects"
                checked={httpConfig.followRedirects}
                onChange={(e) => updateConfig('followRedirects', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="followRedirects" className="text-sm text-gray-700">
                Follow Redirects
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
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