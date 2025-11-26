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
  export interface NodeTypeUI {
    id: string;
    name: string;
    icon: any; // Icon component
    iconName: string; // Icon name as string - IMPORTANT!
    color: string;
    category: 'Triggers' | 'Actions' | 'Logic';
    description?: string;
    schemaType: string; // Matches your DB enum
  }
  
  export const nodeTypes: NodeTypeUI[] = [
    // TRIGGERS
    {
      id: 'webhook',
      name: 'Webhook',
      icon: Webhook,
      iconName: 'Webhook', // ADD THIS
      color: 'bg-emerald-500',
      category: 'Triggers',
      description: 'Trigger workflow via HTTP webhook',
      schemaType: 'WEBHOOK'
    },
    {
      id: 'manual',
      name: 'Manual Trigger',
      icon: Play,
      iconName: 'Play', // ADD THIS
      color: 'bg-blue-500',
      category: 'Triggers',
      description: 'Start workflow manually',
      schemaType: 'MANUAL'
    },
    {
      id: 'googleforms',
      name: 'Google Form',
      icon: SiGoogleforms,
      iconName: 'SiGoogleforms',
      color: 'bg-purple-500',
      category: 'Triggers',
      description: 'Google Form',
      schemaType: 'GOOGLE_FORM'
    },
    {
      id: 'schedule',
      name: 'Schedule',
      icon: Calendar,
      iconName: 'Calendar', // ADD THIS
      color: 'bg-cyan-500',
      category: 'Triggers',
      description: 'Run on a schedule',
      schemaType: 'SCHEDULE'
    },
    
    // ACTIONS
    {
      id: 'http',
      name: 'HTTP Request',
      icon: Globe2,
      iconName: 'Globe2', // ADD THIS
      color: 'bg-purple-500',
      category: 'Actions',
      description: 'Make HTTP API calls',
      schemaType: 'HTTP'
    },
    {
      id: 'database',
      name: 'Database',
      icon: Database,
      iconName: 'Database', // ADD THIS
      color: 'bg-orange-500',
      category: 'Actions',
      description: 'Query or update database',
      schemaType: 'DATABASE'
    },
    {
      id: 'email',
      name: 'Send Email',
      icon: Send,
      iconName: 'Send', // ADD THIS
      color: 'bg-rose-500',
      category: 'Actions',
      description: 'Send email notifications',
      schemaType: 'EMAIL'
    },
    {
      id: 'code',
      name: 'Run Code',
      icon: FileCode,
      iconName: 'FileCode', // ADD THIS
      color: 'bg-slate-500',
      category: 'Actions',
      description: 'Execute custom code',
      schemaType: 'CODE'
    },
    
    // LOGIC
    {
      id: 'condition',
      name: 'Condition',
      icon: Split,
      iconName: 'Split', // ADD THIS
      color: 'bg-amber-500',
      category: 'Logic',
      description: 'Branch based on conditions',
      schemaType: 'CONDITION'
    },
    {
      id: 'filter',
      name: 'Filter',
      icon: Shuffle,
      iconName: 'Shuffle', // ADD THIS
      color: 'bg-indigo-500',
      category: 'Logic',
      description: 'Filter data items',
      schemaType: 'FILTER'
    }
  ];
  
  export const getNodeTypeById = (id: string): NodeTypeUI | undefined => {
    return nodeTypes.find(node => node.id === id);
  };
  
  // Helper function to get node type by schema type (uppercase like 'WEBHOOK')
  export const getNodeTypeBySchemaType = (schemaType: string): NodeTypeUI | undefined => {
    return nodeTypes.find(node => node.schemaType === schemaType);
  };
