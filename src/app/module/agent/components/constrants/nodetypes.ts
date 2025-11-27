// types/node-configs.ts
import { 
  Webhook, 
  Play, 
  Calendar, 
  Globe2, 
  Database, 
  Send, 
  FileCode, 
  Split, 
  Shuffle
} from 'lucide-react';
import { SiGoogleforms } from "react-icons/si";

export interface NodeInputField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'json' | 'select' | 'multiselect';
  required?: boolean;
  defaultValue?: any;
  placeholder?: string;
  options?: { label: string; value: string }[];
  description?: string;
}

export interface NodeOutputField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'json' | 'array' | 'object';
  description?: string;
  sampleData?: any;
}

export interface NodeParameter {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea' | 'json' | 'url' | 'email';
  required?: boolean;
  defaultValue?: any;
  placeholder?: string;
  options?: { label: string; value: string }[];
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface NodeConfig {
  type: string;
  displayName: string;
  description: string;
  icon: any;
  iconName: string;
  color: string;
  category: 'Triggers' | 'Actions' | 'Logic';
  inputs: NodeInputField[];
  parameters: NodeParameter[];
  outputs: NodeOutputField[];
}

// Node configurations for different types
export const NODE_CONFIGS: Record<string, NodeConfig> = {
  WEBHOOK: {
    type: 'WEBHOOK',
    displayName: 'Webhook',
    description: 'Trigger workflow via HTTP webhook',
    icon: Webhook,
    iconName: 'Webhook',
    color: 'bg-emerald-500',
    category: 'Triggers',
    inputs: [],
    parameters: [
      {
        id: 'method',
        name: 'HTTP Method',
        type: 'select',
        required: true,
        defaultValue: 'POST',
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'DELETE', value: 'DELETE' },
        ],
        description: 'The HTTP method to accept'
      },
      {
        id: 'path',
        name: 'Webhook Path',
        type: 'string',
        required: true,
        placeholder: '/my-webhook',
        description: 'The URL path for this webhook',
      },
      {
        id: 'authentication',
        name: 'Authentication',
        type: 'select',
        defaultValue: 'none',
        options: [
          { label: 'None', value: 'none' },
          { label: 'Basic Auth', value: 'basic' },
          { label: 'API Key', value: 'apikey' },
        ],
        description: 'Authentication method for the webhook'
      },
      {
        id: 'responseMode',
        name: 'Response Mode',
        type: 'select',
        defaultValue: 'lastNode',
        options: [
          { label: 'Last Node', value: 'lastNode' },
          { label: 'First Succeeding Node', value: 'firstSucceeding' },
          { label: 'Custom', value: 'custom' },
        ],
        description: 'What to return in the webhook response'
      },
    ],
    outputs: [
      {
        id: 'body',
        name: 'Request Body',
        type: 'json',
        description: 'The body of the incoming request',
        sampleData: { key: 'value' },
      },
      {
        id: 'headers',
        name: 'Headers',
        type: 'object',
        description: 'Request headers',
        sampleData: { 'content-type': 'application/json' },
      },
      {
        id: 'query',
        name: 'Query Parameters',
        type: 'object',
        description: 'URL query parameters',
        sampleData: { param1: 'value1' },
      },
    ],
  },

  MANUAL: {
    type: 'MANUAL',
    displayName: 'Manual Trigger',
    description: 'Start workflow manually',
    icon: Play,
    iconName: 'Play',
    color: 'bg-blue-500',
    category: 'Triggers',
    inputs: [],
    parameters: [
      {
        id: 'testData',
        name: 'Test Data',
        type: 'json',
        placeholder: '{"example": "data"}',
        description: 'Data to use when manually testing the workflow',
      },
    ],
    outputs: [
      {
        id: 'data',
        name: 'Manual Data',
        type: 'json',
        description: 'The data provided when triggering manually',
        sampleData: { example: 'data' },
      },
    ],
  },

  GOOGLEFORM: {
    type: 'GOOGLEFORM',
    displayName: 'Google Form',
    description: 'Trigger workflow from Google Form submissions',
    icon: SiGoogleforms,
    iconName: 'SiGoogleforms',
    color: 'bg-purple-500',
    category: 'Triggers',
    inputs: [
      {
        id: 'webhookData',
        name: 'Webhook Data',
        type: 'json',
        required: false,
        placeholder: 'Data from Google Forms webhook',
        description: 'Raw data received from Google Forms webhook'
      },
    ],
    parameters: [
      {
        id: 'formId',
        name: 'Google Form ID',
        type: 'string',
        placeholder: '1FAIpQLS...',
        description: 'Optional: For tracking form submissions',
      },
      {
        id: 'formTitle',
        name: 'Form Title',
        type: 'string',
        placeholder: 'Customer Feedback Form',
        description: 'Display name for the form'
      },
      {
        id: 'webhookUrl',
        name: 'Webhook URL',
        type: 'string',
        placeholder: '/webhooks/googleform/{workflowId}',
        description: 'URL to configure in Google Apps Script'
      },
      {
        id: 'authentication',
        name: 'Authentication',
        type: 'select',
        defaultValue: 'none',
        options: [
          { label: 'None', value: 'none' },
          { label: 'Secret Token', value: 'token' },
          { label: 'IP Whitelist', value: 'ip' },
        ],
        description: 'Security method for webhook'
      },
      {
        id: 'secretToken',
        name: 'Secret Token',
        type: 'string',
        placeholder: 'your-secret-token',
        description: 'Token for webhook verification'
      },
      {
        id: 'responseHandling',
        name: 'Response Handling',
        type: 'select',
        defaultValue: 'process',
        options: [
          { label: 'Process immediately', value: 'process' },
          { label: 'Add to queue', value: 'queue' },
          { label: 'Validate first', value: 'validate' },
        ],
        description: 'How to handle incoming submissions'
      },
    ],
    outputs: [
      {
        id: 'submissionData',
        name: 'Submission Data',
        type: 'object',
        description: 'Processed form submission data',
        sampleData: {
          submissionId: "ABC123",
          submittedAt: "2024-01-15T10:30:00.000Z",
          form: { id: "FORM_123", title: "Feedback Form" },
          respondent: { email: "user@example.com" },
          answers: { name: "John Doe", rating: "5" }
        },
      },
      {
        id: 'rawData',
        name: 'Raw Data',
        type: 'json',
        description: 'Original webhook payload',
        sampleData: {
          responseId: "ABC123",
          timestamp: "2024-01-15T10:30:00.000Z",
          formId: "FORM_123",
          answers: { name: "John Doe" }
        },
      },
    ],
  },

  SCHEDULE: {
    type: 'SCHEDULE',
    displayName: 'Schedule',
    description: 'Run on a schedule',
    icon: Calendar,
    iconName: 'Calendar',
    color: 'bg-cyan-500',
    category: 'Triggers',
    inputs: [],
    parameters: [
      {
        id: 'scheduleType',
        name: 'Schedule Type',
        type: 'select',
        required: true,
        defaultValue: 'interval',
        options: [
          { label: 'Interval', value: 'interval' },
          { label: 'Cron Expression', value: 'cron' },
          { label: 'Daily', value: 'daily' },
          { label: 'Weekly', value: 'weekly' },
        ],
        description: 'Type of schedule'
      },
      {
        id: 'interval',
        name: 'Interval (minutes)',
        type: 'number',
        placeholder: '60',
        description: 'Run every X minutes (for interval type)',
        validation: { min: 1 }
      },
      {
        id: 'cronExpression',
        name: 'Cron Expression',
        type: 'string',
        placeholder: '0 0 * * *',
        description: 'Cron expression (for cron type)',
      },
      {
        id: 'timezone',
        name: 'Timezone',
        type: 'string',
        defaultValue: 'UTC',
        placeholder: 'America/New_York',
        description: 'Timezone for the schedule',
      },
    ],
    outputs: [
      {
        id: 'timestamp',
        name: 'Execution Time',
        type: 'string',
        description: 'ISO timestamp of when the schedule triggered',
        sampleData: '2024-01-15T10:30:00Z',
      },
    ],
  },

  HTTP: {
    type: 'HTTP',
    displayName: 'HTTP Request',
    description: 'Make HTTP API calls',
    icon: Globe2,
    iconName: 'Globe2',
    color: 'bg-purple-500',
    category: 'Actions',
    inputs: [
      {
        id: 'body',
        name: 'Request Body',
        type: 'json',
        placeholder: 'Request payload',
        description: 'Body data for POST/PUT/PATCH requests'
      },
      {
        id: 'queryParams',
        name: 'Query Parameters',
        type: 'json',
        placeholder: '{"key": "value"}',
        description: 'URL query parameters'
      },
    ],
    parameters: [
      {
        id: 'method',
        name: 'Method',
        type: 'select',
        required: true,
        defaultValue: 'GET',
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'DELETE', value: 'DELETE' },
          { label: 'PATCH', value: 'PATCH' },
        ],
      },
      {
        id: 'url',
        name: 'URL',
        type: 'url',
        required: true,
        placeholder: 'https://api.example.com/endpoint',
        description: 'Full URL including protocol'
      },
      {
        id: 'authentication',
        name: 'Authentication',
        type: 'select',
        defaultValue: 'none',
        options: [
          { label: 'None', value: 'none' },
          { label: 'Bearer Token', value: 'bearer' },
          { label: 'Basic Auth', value: 'basic' },
          { label: 'API Key', value: 'apikey' },
        ],
      },
      {
        id: 'headers',
        name: 'Headers',
        type: 'json',
        placeholder: '{"Authorization": "Bearer token"}',
        description: 'Request headers as JSON object',
      },
      {
        id: 'timeout',
        name: 'Timeout (ms)',
        type: 'number',
        defaultValue: 30000,
        validation: { min: 1000, max: 300000 },
        description: 'Request timeout in milliseconds'
      },
    ],
    outputs: [
      {
        id: 'response',
        name: 'Response',
        type: 'json',
        description: 'API response body',
        sampleData: { success: true, data: {} },
      },
      {
        id: 'statusCode',
        name: 'Status Code',
        type: 'number',
        description: 'HTTP status code',
        sampleData: 200,
      },
      {
        id: 'headers',
        name: 'Response Headers',
        type: 'object',
        description: 'Response headers',
        sampleData: { 'content-type': 'application/json' },
      },
    ],
  },

  DATABASE: {
    type: 'DATABASE',
    displayName: 'Database',
    description: 'Execute database queries',
    icon: Database,
    iconName: 'Database',
    color: 'bg-orange-500',
    category: 'Actions',
    inputs: [
      {
        id: 'parameters',
        name: 'Query Parameters',
        type: 'json',
        placeholder: '{"id": 123, "name": "John"}',
        description: 'Parameters to use in the query (for parameterized queries)'
      },
    ],
    parameters: [
      {
        id: 'operation',
        name: 'Operation',
        type: 'select',
        required: true,
        defaultValue: 'select',
        options: [
          { label: 'Select', value: 'select' },
          { label: 'Insert', value: 'insert' },
          { label: 'Update', value: 'update' },
          { label: 'Delete', value: 'delete' },
          { label: 'Raw Query', value: 'raw' },
        ],
      },
      {
        id: 'connection',
        name: 'Database Connection',
        type: 'select',
        required: true,
        options: [
          { label: 'PostgreSQL', value: 'postgres' },
          { label: 'MySQL', value: 'mysql' },
          { label: 'MongoDB', value: 'mongodb' },
          { label: 'SQLite', value: 'sqlite' },
        ],
      },
      {
        id: 'table',
        name: 'Table Name',
        type: 'string',
        placeholder: 'users',
        description: 'Name of the database table'
      },
      {
        id: 'query',
        name: 'Query',
        type: 'textarea',
        placeholder: 'SELECT * FROM users WHERE id = $1',
        description: 'SQL query to execute (use $1, $2 for parameters)',
      },
    ],
    outputs: [
      {
        id: 'rows',
        name: 'Result Rows',
        type: 'array',
        description: 'Query result rows',
        sampleData: [{ id: 1, name: 'John' }],
      },
      {
        id: 'rowCount',
        name: 'Row Count',
        type: 'number',
        description: 'Number of affected rows',
        sampleData: 1,
      },
    ],
  },

  EMAIL: {
    type: 'EMAIL',
    displayName: 'Send Email',
    description: 'Send email notifications',
    icon: Send,
    iconName: 'Send',
    color: 'bg-rose-500',
    category: 'Actions',
    inputs: [
      {
        id: 'content',
        name: 'Email Content',
        type: 'json',
        placeholder: '{"subject": "...", "body": "..."}',
        description: 'Dynamic email content from previous nodes'
      },
    ],
    parameters: [
      {
        id: 'to',
        name: 'To',
        type: 'email',
        required: true,
        placeholder: 'recipient@example.com',
        description: 'Recipient email address'
      },
      {
        id: 'subject',
        name: 'Subject',
        type: 'string',
        required: true,
        placeholder: 'Email subject',
        description: 'Email subject line'
      },
      {
        id: 'body',
        name: 'Body',
        type: 'textarea',
        required: true,
        placeholder: 'Email body content...',
        description: 'Email body (supports HTML)'
      },
      {
        id: 'from',
        name: 'From',
        type: 'email',
        placeholder: 'sender@example.com',
        description: 'Sender email address'
      },
      {
        id: 'cc',
        name: 'CC',
        type: 'string',
        placeholder: 'cc1@example.com, cc2@example.com',
        description: 'Carbon copy recipients (comma-separated)'
      },
      {
        id: 'bcc',
        name: 'BCC',
        type: 'string',
        placeholder: 'bcc@example.com',
        description: 'Blind carbon copy recipients'
      },
    ],
    outputs: [
      {
        id: 'messageId',
        name: 'Message ID',
        type: 'string',
        description: 'Email message ID',
        sampleData: '<message-id@example.com>',
      },
      {
        id: 'status',
        name: 'Status',
        type: 'string',
        description: 'Send status',
        sampleData: 'sent',
      },
    ],
  },

  CODE: {
    type: 'CODE',
    displayName: 'Run Code',
    description: 'Execute custom JavaScript code',
    icon: FileCode,
    iconName: 'FileCode',
    color: 'bg-slate-500',
    category: 'Actions',
    inputs: [
      {
        id: 'input',
        name: 'Input Data',
        type: 'json',
        placeholder: '{"value": 42}',
        description: 'Data from previous nodes (available as "input" variable)'
      },
    ],
    parameters: [
      {
        id: 'code',
        name: 'JavaScript Code',
        type: 'textarea',
        required: true,
        placeholder: 'return { result: input.value * 2 };',
        description: 'JavaScript code to execute. Use "input" to access input data. Must return a value.',
      },
      {
        id: 'timeout',
        name: 'Timeout (ms)',
        type: 'number',
        defaultValue: 5000,
        validation: { min: 100, max: 30000 },
        description: 'Maximum execution time'
      },
    ],
    outputs: [
      {
        id: 'result',
        name: 'Result',
        type: 'json',
        description: 'Code execution result',
        sampleData: { result: 'output' },
      },
    ],
  },

  CONDITION: {
    type: 'CONDITION',
    displayName: 'Condition',
    description: 'Branch based on conditions',
    icon: Split,
    iconName: 'Split',
    color: 'bg-amber-500',
    category: 'Logic',
    inputs: [
      {
        id: 'data',
        name: 'Input Data',
        type: 'json',
        required: true,
        placeholder: '{"status": "active"}',
        description: 'Data to evaluate'
      },
    ],
    parameters: [
      {
        id: 'conditions',
        name: 'Conditions',
        type: 'json',
        required: true,
        placeholder: '[{"field": "status", "operator": "equals", "value": "active"}]',
        description: 'Array of conditions to evaluate'
      },
      {
        id: 'combineOperation',
        name: 'Combine Operation',
        type: 'select',
        defaultValue: 'AND',
        options: [
          { label: 'AND (all must match)', value: 'AND' },
          { label: 'OR (any must match)', value: 'OR' },
        ],
        description: 'How to combine multiple conditions'
      },
    ],
    outputs: [
      {
        id: 'true',
        name: 'True',
        type: 'json',
        description: 'Data when condition is true',
        sampleData: { matched: true, data: {} }
      },
      {
        id: 'false',
        name: 'False',
        type: 'json',
        description: 'Data when condition is false',
        sampleData: { matched: false, data: {} }
      },
    ],
  },

  FILTER: {
    type: 'FILTER',
    displayName: 'Filter',
    description: 'Filter array items based on conditions',
    icon: Shuffle,
    iconName: 'Shuffle',
    color: 'bg-indigo-500',
    category: 'Logic',
    inputs: [
      {
        id: 'items',
        name: 'Items',
        type: 'json',
        required: true,
        placeholder: '[{"age": 25}, {"age": 30}]',
        description: 'Array of items to filter'
      },
    ],
    parameters: [
      {
        id: 'field',
        name: 'Field',
        type: 'string',
        required: true,
        placeholder: 'age',
        description: 'Field name to filter on'
      },
      {
        id: 'operator',
        name: 'Operator',
        type: 'select',
        required: true,
        defaultValue: 'equals',
        options: [
          { label: 'Equals', value: 'equals' },
          { label: 'Not Equals', value: 'notEquals' },
          { label: 'Greater Than', value: 'greaterThan' },
          { label: 'Less Than', value: 'lessThan' },
          { label: 'Contains', value: 'contains' },
          { label: 'Starts With', value: 'startsWith' },
          { label: 'Ends With', value: 'endsWith' },
        ],
      },
      {
        id: 'value',
        name: 'Value',
        type: 'string',
        required: true,
        placeholder: '25',
        description: 'Value to compare against'
      },
    ],
    outputs: [
      {
        id: 'filtered',
        name: 'Filtered Items',
        type: 'array',
        description: 'Items that match the filter',
        sampleData: [{ age: 25 }],
      },
      {
        id: 'count',
        name: 'Count',
        type: 'number',
        description: 'Number of filtered items',
        sampleData: 1,
      },
      {
        id: 'removed',
        name: 'Removed Items',
        type: 'array',
        description: 'Items that did not match',
        sampleData: [{ age: 30 }],
      },
    ],
  },
};

// Helper function to get config for a node type
export function getNodeConfig(nodeType: string): NodeConfig | undefined {
  return NODE_CONFIGS[nodeType];
}

// Helper function to get all node types
export function getAllNodeTypes(): string[] {
  return Object.keys(NODE_CONFIGS);
}

// Helper to convert NODE_CONFIGS to your nodeTypes array format
// Helper to convert NODE_CONFIGS to your nodeTypes array format
export const nodeTypes = Object.values(NODE_CONFIGS).map(config => ({
  id: config.type.toLowerCase(),
  name: config.displayName,
  icon: config.icon,
  iconName: config.iconName,
  color: config.color,
  category: config.category,
  description: config.description,
  schemaType: config.type // This stays as "GOOGLE_FORM" for database
}));

export const getNodeTypeById = (id: string) => {
  return nodeTypes.find(node => node.id === id);
};

export const getNodeTypeBySchemaType = (schemaType: string) => {
  return nodeTypes.find(node => node.schemaType === schemaType);
};