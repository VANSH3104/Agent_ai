import { NodeTypes } from '@xyflow/react';
import {
  WebhookNode, ManualNode, ScheduleNode,
  HttpNode, DatabaseNode, EmailNode, AINode, CodeNode,
  ConditionNode, FilterNode, GoogleformsNode
} from '@/components/otherUi/customnode';


export const nodeComponents: NodeTypes = {
  webhook: WebhookNode,
  manual: ManualNode,
  schedule: ScheduleNode,
  http: HttpNode,
  googleform: GoogleformsNode,
  database: DatabaseNode,
  email: EmailNode,
  ai: AINode,
  code: CodeNode,
  condition: ConditionNode,
  filter: FilterNode,
};