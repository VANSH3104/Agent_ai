import { nodeTypesEnum } from '@/db/schema';
import { 
  Webhook, Play, Calendar, Globe2, Database, 
  Send, FileCode, Split, Shuffle 
} from 'lucide-react';

export type NodeType = typeof nodeTypesEnum.enumValues[number];

export interface NodeTypeUI {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string;
  bgColor: string;
  borderColor: string;
  category: 'Triggers' | 'Actions' | 'Logic';
  description: string;
  schemaType: NodeType;
}

export const nodeTypes: NodeTypeUI[] = [
  // Triggers
  { 
    id: 'webhook', 
    name: 'Webhook', 
    icon: Webhook, 
    color: 'bg-emerald-500',
    bgColor: '#10b981',
    borderColor: '#059669',
    category: 'Triggers',
    description: 'Trigger workflow via webhook',
    schemaType: 'WEBHOOK'
  },
  { 
    id: 'manual', 
    name: 'Manual Trigger', 
    icon: Play, 
    color: 'bg-blue-500',
    bgColor: '#3b82f6',
    borderColor: '#2563eb',
    category: 'Triggers',
    description: 'Trigger manually',
    schemaType: 'MANUAL'
  },
  { 
    id: 'schedule', 
    name: 'Schedule', 
    icon: Calendar, 
    color: 'bg-cyan-500',
    bgColor: '#06b6d4',
    borderColor: '#0891b2',
    category: 'Triggers',
    description: 'Trigger on schedule',
    schemaType: 'SCHEDULE'
  },
  
  // Actions
  { 
    id: 'http', 
    name: 'HTTP Request', 
    icon: Globe2, 
    color: 'bg-purple-500',
    bgColor: '#a855f7',
    borderColor: '#9333ea',
    category: 'Actions',
    description: 'Make HTTP request',
    schemaType: 'HTTP'
  },
  { 
    id: 'database', 
    name: 'Database', 
    icon: Database, 
    color: 'bg-orange-500',
    bgColor: '#f97316',
    borderColor: '#ea580c',
    category: 'Actions',
    description: 'Query database',
    schemaType: 'DATABASE'
  },
  { 
    id: 'email', 
    name: 'Send Email', 
    icon: Send, 
    color: 'bg-rose-500',
    bgColor: '#f43f5e',
    borderColor: '#e11d48',
    category: 'Actions',
    description: 'Send email',
    schemaType: 'EMAIL'
  },
  { 
    id: 'code', 
    name: 'Run Code', 
    icon: FileCode, 
    color: 'bg-slate-600',
    bgColor: '#475569',
    borderColor: '#334155',
    category: 'Actions',
    description: 'Execute code',
    schemaType: 'CODE'
  },
  
  // Logic
  { 
    id: 'condition', 
    name: 'IF Condition', 
    icon: Split, 
    color: 'bg-amber-500',
    bgColor: '#f59e0b',
    borderColor: '#d97706',
    category: 'Logic',
    description: 'Branch on condition',
    schemaType: 'CONDITION'
  },
  { 
    id: 'filter', 
    name: 'Filter', 
    icon: Shuffle, 
    color: 'bg-indigo-500',
    bgColor: '#6366f1',
    borderColor: '#4f46e5',
    category: 'Logic',
    description: 'Filter data',
    schemaType: 'FILTER'
  },
];

export const getNodeTypeById = (id: string) => nodeTypes.find(n => n.id === id);