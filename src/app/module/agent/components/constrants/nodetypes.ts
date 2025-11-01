import { 
  Zap, Clock, Globe, Database, Mail, Code, GitBranch, Filter 
} from 'lucide-react';

export const nodeTypes = [
  { id: 'trigger', name: 'Webhook', icon: Zap, color: 'bg-green-500', category: 'Triggers' },
  { id: 'schedule', name: 'Schedule', icon: Clock, color: 'bg-blue-500', category: 'Triggers' },
  { id: 'http', name: 'HTTP Request', icon: Globe, color: 'bg-purple-500', category: 'Actions' },
  { id: 'database', name: 'Database', icon: Database, color: 'bg-orange-500', category: 'Actions' },
  { id: 'email', name: 'Email', icon: Mail, color: 'bg-red-500', category: 'Actions' },
  { id: 'code', name: 'Code', icon: Code, color: 'bg-gray-500', category: 'Actions' },
  { id: 'condition', name: 'IF Condition', icon: GitBranch, color: 'bg-yellow-500', category: 'Logic' },
  { id: 'filter', name: 'Filter', icon: Filter, color: 'bg-indigo-500', category: 'Logic' },
];