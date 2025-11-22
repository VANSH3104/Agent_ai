import { NodeTypes } from '@xyflow/react';
import { 
  WebhookNode, ManualNode, ScheduleNode,
  HttpNode, DatabaseNode, EmailNode, CodeNode,
  ConditionNode, FilterNode
} from '@/components/otherUi/customnode';

export const nodeComponents: NodeTypes = {
  webhook: WebhookNode,
  manual: ManualNode,
  schedule: ScheduleNode,
  http: HttpNode,
  database: DatabaseNode,
  email: EmailNode,
  code: CodeNode,
  condition: ConditionNode,
  filter: FilterNode,
};